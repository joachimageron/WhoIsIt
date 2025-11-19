import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionManager } from '../gateway/connection.manager';
import { User } from '../../database/entities/user.entity';
import type { TypedSocket } from '../gateway/types';

describe('ConnectionManager Security Features', () => {
  let connectionManager: ConnectionManager;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
    isGuest: false,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSeenAt: new Date(),
  } as User;

  const createMockSocket = (user?: User | null, socketId = 'socket-123') => {
    const socket = {
      id: socketId,
      user: user ?? null,
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      disconnect: jest.fn(),
      to: jest.fn().mockReturnThis(),
      handshake: {
        headers: {},
        auth: {},
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return socket as any as TypedSocket;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnectionManager],
    }).compile();

    connectionManager = module.get<ConnectionManager>(ConnectionManager);
  });

  afterEach(() => {
    connectionManager.stopInactivityMonitoring();
  });

  describe('Single Connection Enforcement', () => {
    it('should allow first connection for a user', () => {
      const socket = createMockSocket(mockUser);

      const result = connectionManager.trackConnection(socket);

      expect(result.allowed).toBe(true);
      expect(result.socketsToDisconnect).toBeUndefined();
      expect(connectionManager.getConnectedUsersCount()).toBe(1);
    });

    it('should detect and mark old socket for disconnection when user reconnects', () => {
      const socket1 = createMockSocket(mockUser, 'socket-1');
      const socket2 = createMockSocket(mockUser, 'socket-2');

      // First connection
      const result1 = connectionManager.trackConnection(socket1);
      expect(result1.allowed).toBe(true);
      expect(result1.socketsToDisconnect).toBeUndefined();

      // Second connection (reconnect)
      const result2 = connectionManager.trackConnection(socket2);
      expect(result2.allowed).toBe(true);
      expect(result2.socketsToDisconnect).toEqual(['socket-1']);
      expect(connectionManager.getConnectedUsersCount()).toBe(1);
    });

    it('should allow multiple guest connections (no userId)', () => {
      const socket1 = createMockSocket(null, 'socket-1');
      const socket2 = createMockSocket(null, 'socket-2');

      const result1 = connectionManager.trackConnection(socket1);
      const result2 = connectionManager.trackConnection(socket2);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(connectionManager.getConnectedUsersCount()).toBe(2);
    });

    it('should allow connections from different users', () => {
      const user1 = { ...mockUser, id: 'user-1', username: 'user1' } as User;
      const user2 = { ...mockUser, id: 'user-2', username: 'user2' } as User;

      const socket1 = createMockSocket(user1, 'socket-1');
      const socket2 = createMockSocket(user2, 'socket-2');

      const result1 = connectionManager.trackConnection(socket1);
      const result2 = connectionManager.trackConnection(socket2);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(connectionManager.getConnectedUsersCount()).toBe(2);
    });
  });

  describe('Reconnection Abuse Detection', () => {
    it('should allow normal reconnection rate', () => {
      const socket1 = createMockSocket(mockUser, 'socket-1');
      const socket2 = createMockSocket(mockUser, 'socket-2');
      const socket3 = createMockSocket(mockUser, 'socket-3');

      const result1 = connectionManager.trackConnection(socket1);
      const result2 = connectionManager.trackConnection(socket2);
      const result3 = connectionManager.trackConnection(socket3);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });

    it('should ban user after exceeding reconnection limit (>5/min)', () => {
      const sockets = Array.from({ length: 7 }, (_, i) =>
        createMockSocket(mockUser, `socket-${i}`),
      );

      // First 5 attempts should be allowed (plus the original connection = 6 total)
      for (let i = 0; i < 6; i++) {
        const result = connectionManager.trackConnection(sockets[i]);
        expect(result.allowed).toBe(true);
      }

      // 7th attempt should trigger ban
      const result7 = connectionManager.trackConnection(sockets[6]);
      expect(result7.allowed).toBe(false);
      expect(result7.reason).toContain('Too many reconnection attempts');
    });

    it('should reject subsequent connections while user is banned', () => {
      // Trigger ban by rapid reconnections
      for (let i = 0; i < 7; i++) {
        connectionManager.trackConnection(
          createMockSocket(mockUser, `socket-${i}`),
        );
      }

      // Try to connect again
      const result = connectionManager.trackConnection(
        createMockSocket(mockUser, 'socket-new'),
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('banned');
    });

    it('should return ban status for a user', () => {
      // Trigger ban
      for (let i = 0; i < 7; i++) {
        connectionManager.trackConnection(
          createMockSocket(mockUser, `socket-${i}`),
        );
      }

      const banStatus = connectionManager.getUserBanStatus(mockUser.id);

      expect(banStatus.banned).toBe(true);
      expect(banStatus.bannedUntil).toBeInstanceOf(Date);
      expect(banStatus.bannedUntil!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return reconnection history for a user', () => {
      connectionManager.trackConnection(createMockSocket(mockUser, 'socket-1'));
      connectionManager.trackConnection(createMockSocket(mockUser, 'socket-2'));
      connectionManager.trackConnection(createMockSocket(mockUser, 'socket-3'));

      const history = connectionManager.getUserReconnectionHistory(mockUser.id);

      expect(history.attempts).toBe(3);
      expect(history.recentAttempts).toHaveLength(3);
      expect(history.recentAttempts[0]).toBeInstanceOf(Date);
    });
  });

  describe('Inactivity Monitoring', () => {
    it('should start and stop inactivity monitoring', () => {
      const callback = jest.fn();

      connectionManager.startInactivityMonitoring(callback);
      connectionManager.stopInactivityMonitoring();

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should not start monitoring twice', () => {
      const callback = jest.fn();

      connectionManager.startInactivityMonitoring(callback);
      connectionManager.startInactivityMonitoring(callback); // Second call should be ignored

      connectionManager.stopInactivityMonitoring();
      expect(true).toBe(true);
    });

    it('should disconnect inactive connections', (done) => {
      jest.useFakeTimers();

      const socket = createMockSocket(mockUser);
      const disconnectCallback = jest.fn();

      connectionManager.trackConnection(socket);
      connectionManager.startInactivityMonitoring(disconnectCallback);

      // Fast forward past inactivity timeout (60s + check interval 30s)
      jest.advanceTimersByTime(91000);

      // Wait for interval to execute
      setTimeout(() => {
        expect(disconnectCallback).toHaveBeenCalledWith(socket.id);
        connectionManager.stopInactivityMonitoring();
        jest.useRealTimers();
        done();
      }, 100);

      jest.runOnlyPendingTimers();
    });

    it('should not disconnect active connections', (done) => {
      jest.useFakeTimers();

      const socket = createMockSocket(mockUser);
      const disconnectCallback = jest.fn();

      connectionManager.trackConnection(socket);
      connectionManager.startInactivityMonitoring(disconnectCallback);

      // Update last seen time before timeout
      jest.advanceTimersByTime(30000);
      connectionManager.updateLastSeen(socket.id);

      // Fast forward more time
      jest.advanceTimersByTime(31000);

      setTimeout(() => {
        expect(disconnectCallback).not.toHaveBeenCalled();
        connectionManager.stopInactivityMonitoring();
        jest.useRealTimers();
        done();
      }, 100);

      jest.runOnlyPendingTimers();
    });
  });

  describe('Connection Tracking', () => {
    it('should track connection details', () => {
      const socket = createMockSocket(mockUser);

      connectionManager.trackConnection(socket);
      const connection = connectionManager.getConnection(socket.id);

      expect(connection).toBeDefined();
      expect(connection?.socketId).toBe(socket.id);
      expect(connection?.userId).toBe(mockUser.id);
      expect(connection?.connectedAt).toBeInstanceOf(Date);
      expect(connection?.lastSeenAt).toBeInstanceOf(Date);
    });

    it('should update last seen time', (done) => {
      const socket = createMockSocket(mockUser);

      connectionManager.trackConnection(socket);
      const originalConnection = connectionManager.getConnection(socket.id);
      const originalLastSeen = originalConnection?.lastSeenAt;

      // Wait a bit and update
      setTimeout(() => {
        connectionManager.updateLastSeen(socket.id);
        const updatedConnection = connectionManager.getConnection(socket.id);

        expect(updatedConnection?.lastSeenAt.getTime()).toBeGreaterThan(
          originalLastSeen!.getTime(),
        );
        done();
      }, 10);
    });

    it('should update connection room', () => {
      const socket = createMockSocket(mockUser);

      connectionManager.trackConnection(socket);
      connectionManager.updateConnectionRoom(socket.id, 'ROOM123', 'player-1');

      const connection = connectionManager.getConnection(socket.id);

      expect(connection?.roomCode).toBe('ROOM123');
      expect(connection?.playerId).toBe('player-1');
    });

    it('should handle disconnect', () => {
      const socket = createMockSocket(mockUser);

      connectionManager.trackConnection(socket);
      expect(connectionManager.getConnectedUsersCount()).toBe(1);

      connectionManager.handleDisconnect(socket);
      expect(connectionManager.getConnectedUsersCount()).toBe(0);
    });

    it('should get all connections', () => {
      const socket1 = createMockSocket(mockUser, 'socket-1');
      const socket2 = createMockSocket(
        { ...mockUser, id: 'user-2' } as User,
        'socket-2',
      );

      connectionManager.trackConnection(socket1);
      connectionManager.trackConnection(socket2);

      const allConnections = connectionManager.getAllConnections();

      expect(allConnections.size).toBe(2);
      expect(allConnections.has('socket-1')).toBe(true);
      expect(allConnections.has('socket-2')).toBe(true);
    });
  });
});
