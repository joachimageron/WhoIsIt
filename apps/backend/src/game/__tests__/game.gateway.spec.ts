import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GameGateway } from '../gateway/game.gateway';
import { GameService } from '../services/game.service';
import { ConnectionManager } from '../gateway/connection.manager';
import { BroadcastService } from '../services/broadcast.service';
import { LobbyCleanupService } from '../services/lobby-cleanup.service';
import { User } from '../../database/entities/user.entity';
import type { GameLobbyResponse } from '@whois-it/contracts';

describe('GameGateway', () => {
  let gateway: GameGateway;

  const mockGameService = {
    getLobbyByRoomCode: jest.fn(),
    getGameByRoomCode: jest.fn(),
    updatePlayerReady: jest.fn(),
    markPlayerAsLeft: jest.fn(),
    getPlayerIdByUserId: jest.fn(),
  };

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

  const mockLobbyResponse: GameLobbyResponse = {
    id: 'game-123',
    visibility: 'public',
    ruleConfig: {},
    roomCode: 'ABC12',
    status: 'lobby',
    characterSetId: 'char-set-1',
    turnTimerSeconds: 60,
    players: [
      {
        id: 'player-1',
        userId: 'user-123',
        username: 'testuser',
        avatarUrl: undefined,
        role: 'host',
        isReady: false,
        joinedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const createMockSocket = (user?: User | null) => {
    const socket = {
      id: 'socket-123',
      user: user ?? null,
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      handshake: {
        headers: {},
        auth: {},
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return socket as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        {
          provide: GameService,
          useValue: mockGameService,
        },
        ConnectionManager,
        {
          provide: BroadcastService,
          useValue: {
            setServer: jest.fn(),
            broadcastLobbyUpdate: jest.fn(),
            broadcastGameStarted: jest.fn(),
            broadcastQuestionAsked: jest.fn(),
            broadcastAnswerSubmitted: jest.fn(),
            broadcastGuessResult: jest.fn(),
            broadcastGameOver: jest.fn(),
          },
        },
        {
          provide: LobbyCleanupService,
          useValue: {
            setServer: jest.fn(),
            startCleanup: jest.fn(),
            onModuleDestroy: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);

    // Mock the server
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        adapter: {
          rooms: new Map(),
        },
      },
    } as any;

    jest.clearAllMocks();
  });

  afterEach(() => {
    // Stop inactivity monitoring to prevent open handles
    const connectionManager = (gateway as any).connectionManager as ConnectionManager;
    connectionManager.stopInactivityMonitoring();

    // Clean up is handled by LobbyCleanupService
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should log initialization message', () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');
      gateway.afterInit();
      expect(loggerSpy).toHaveBeenCalledWith('WebSocket Gateway initialized');
    });
  });

  describe('handleConnection', () => {
    it('should track authenticated user connection', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const socket = createMockSocket(mockUser);
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      gateway.handleConnection(socket);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Client connected'),
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('testuser'),
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('authenticated: true'),
      );
      expect(gateway.getConnectedUsersCount()).toBe(1);
    });

    it('should track guest connection', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const socket = createMockSocket(null);
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      gateway.handleConnection(socket);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('guest'));
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('authenticated: false'),
      );
      expect(gateway.getConnectedUsersCount()).toBe(1);
    });

    it('should detect reconnection of same user', () => {
      const socket1 = createMockSocket(mockUser);
      socket1.id = 'socket-1';
      const socket2 = createMockSocket(mockUser);
      socket2.id = 'socket-2';
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      gateway.handleConnection(socket1);
      gateway.handleConnection(socket2);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('reconnected'),
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should remove connection from tracking', () => {
      const socket = createMockSocket(mockUser);
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      gateway.handleConnection(socket);
      expect(gateway.getConnectedUsersCount()).toBe(1);

      gateway.handleDisconnect(socket);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Client disconnected'),
      );
      expect(gateway.getConnectedUsersCount()).toBe(0);
    });

    it('should log room information if user was in a room', async () => {
      const socket = createMockSocket(mockUser);
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      mockGameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);

      gateway.handleConnection(socket);
      await gateway.handleJoinRoom(socket, { roomCode: 'ABC12' });
      gateway.handleDisconnect(socket);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('was in room: ABC12'),
      );
    });
  });

  describe('handleJoinRoom', () => {
    it('should successfully join a room', async () => {
      const socket = createMockSocket(mockUser);
      mockGameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);
      mockGameService.getPlayerIdByUserId.mockResolvedValue('player-1');

      const result = await gateway.handleJoinRoom(socket, {
        roomCode: 'abc12',
      });

      expect(result.success).toBe(true);
      expect(result.lobby).toEqual(mockLobbyResponse);
      expect(socket.join).toHaveBeenCalledWith('ABC12');
      expect(socket.emit).toHaveBeenCalledWith(
        'lobbyUpdate',
        mockLobbyResponse,
      );
      expect(socket.to).toHaveBeenCalledWith('ABC12');
    });

    it('should normalize room code to uppercase', async () => {
      const socket = createMockSocket(mockUser);
      mockGameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);

      await gateway.handleJoinRoom(socket, { roomCode: 'abc12' });

      expect(mockGameService.getLobbyByRoomCode).toHaveBeenCalledWith('ABC12');
      expect(socket.join).toHaveBeenCalledWith('ABC12');
    });

    it('should track room membership', async () => {
      const socket = createMockSocket(mockUser);
      mockGameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);

      gateway.handleConnection(socket);
      await gateway.handleJoinRoom(socket, { roomCode: 'ABC12' });

      // Verify internal tracking is updated
      expect(socket.join).toHaveBeenCalledWith('ABC12');
    });

    it('should handle errors gracefully', async () => {
      const socket = createMockSocket(mockUser);
      const error = new Error('Game not found');
      mockGameService.getLobbyByRoomCode.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      const result = await gateway.handleJoinRoom(socket, {
        roomCode: 'INVALID',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not found');
      expect(loggerSpy).toHaveBeenCalledWith('Error in handleJoinRoom:', error);
    });
  });

  describe('handleLeaveRoom', () => {
    it('should successfully leave a room', async () => {
      const socket = createMockSocket(mockUser);
      mockGameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);
      mockGameService.markPlayerAsLeft.mockResolvedValue({
        id: 'player-1',
        leftAt: new Date(),
      });

      gateway.handleConnection(socket);
      await gateway.handleJoinRoom(socket, { roomCode: 'ABC12' });

      const result = await gateway.handleLeaveRoom(socket, {
        roomCode: 'abc12',
      });

      expect(result.success).toBe(true);
      expect(socket.leave).toHaveBeenCalledWith('ABC12');
    });

    it('should notify other players when someone leaves', async () => {
      const socket = createMockSocket(mockUser);
      const updatedLobby = {
        ...mockLobbyResponse,
        players: [], // Player has left, so empty
      };

      // Mock player ID lookup
      mockGameService.getPlayerIdByUserId.mockResolvedValueOnce('player-1');

      // First call for joining
      mockGameService.getLobbyByRoomCode.mockResolvedValueOnce(
        mockLobbyResponse,
      );
      // Second call for broadcasting updated state (lookup skipped because we have ID)
      mockGameService.getLobbyByRoomCode.mockResolvedValueOnce(updatedLobby);

      mockGameService.markPlayerAsLeft.mockResolvedValue({
        id: 'player-1',
        leftAt: new Date(),
      });

      gateway.handleConnection(socket);
      await gateway.handleJoinRoom(socket, { roomCode: 'ABC12' });

      await gateway.handleLeaveRoom(socket, { roomCode: 'ABC12' });

      // Verify that playerLeft event was emitted
      expect(socket.to).toHaveBeenCalledWith('ABC12');
      expect(socket.to('ABC12').emit).toHaveBeenCalledWith(
        'playerLeft',
        expect.objectContaining({
          roomCode: 'ABC12',
          lobby: updatedLobby,
        }),
      );
      // Verify that lobbyUpdate was also broadcast
      expect(socket.to('ABC12').emit).toHaveBeenCalledWith(
        'lobbyUpdate',
        updatedLobby,
      );
    });

    it('should mark player as left in database', async () => {
      const socket = createMockSocket(mockUser);
      mockGameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);
      mockGameService.markPlayerAsLeft.mockResolvedValue({
        id: 'player-1',
        leftAt: new Date(),
      });

      gateway.handleConnection(socket);
      await gateway.handleJoinRoom(socket, { roomCode: 'ABC12' });

      await gateway.handleLeaveRoom(socket, { roomCode: 'ABC12' });

      expect(mockGameService.markPlayerAsLeft).toHaveBeenCalledWith('player-1');
    });

    it('should handle errors gracefully', async () => {
      const socket = createMockSocket(mockUser);
      const error = new Error('Leave failed');
      socket.leave = jest.fn().mockRejectedValue(error);
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      const result = await gateway.handleLeaveRoom(socket, {
        roomCode: 'ABC12',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Leave failed');
      expect(loggerSpy).toHaveBeenCalledWith(
        'Error in handleLeaveRoom:',
        error,
      );
    });

    it('should handle case when player is not found in lobby', async () => {
      const socket = createMockSocket(null); // Guest user
      mockGameService.getLobbyByRoomCode.mockResolvedValue({
        ...mockLobbyResponse,
        players: [], // No players
      });

      const result = await gateway.handleLeaveRoom(socket, {
        roomCode: 'ABC12',
      });

      expect(result.success).toBe(true);
      expect(socket.leave).toHaveBeenCalledWith('ABC12');
      // markPlayerAsLeft should not be called if player not found
      expect(mockGameService.markPlayerAsLeft).not.toHaveBeenCalled();
    });
  });

  describe('handleUpdatePlayerReady', () => {
    it('should successfully update player ready status', async () => {
      const socket = createMockSocket(mockUser);
      mockGameService.updatePlayerReady.mockResolvedValue({
        id: 'player-1',
        isReady: true,
      });
      mockGameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);
      mockGameService.getPlayerIdByUserId.mockResolvedValue('player-1');

      gateway.handleConnection(socket);

      const result = await gateway.handleUpdatePlayerReady(socket, {
        roomCode: 'ABC12',
        isReady: true,
      });

      expect(result.success).toBe(true);
      expect(result.lobby).toEqual(mockLobbyResponse);
      expect(mockGameService.updatePlayerReady).toHaveBeenCalledWith(
        'player-1',
        true,
      );
      expect(gateway.server.to).toHaveBeenCalledWith('ABC12');
    });

    it('should handle errors gracefully', async () => {
      const socket = createMockSocket(mockUser);
      const error = new Error('Player not found');
      mockGameService.updatePlayerReady.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      const result = await gateway.handleUpdatePlayerReady(socket, {
        roomCode: 'ABC12',
        isReady: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
      expect(loggerSpy).toHaveBeenCalledWith(
        'Error in handleUpdatePlayerReady:',
        error,
      );
    });
  });

  describe('getConnectedUsersCount', () => {
    it('should return number of connected users', () => {
      expect(gateway.getConnectedUsersCount()).toBe(0);

      const socket1 = createMockSocket(mockUser);
      socket1.id = 'socket-1';
      gateway.handleConnection(socket1);
      expect(gateway.getConnectedUsersCount()).toBe(1);

      const socket2 = createMockSocket(null);
      socket2.id = 'socket-2';
      gateway.handleConnection(socket2);
      expect(gateway.getConnectedUsersCount()).toBe(2);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      gateway.handleDisconnect(socket1);
      expect(gateway.getConnectedUsersCount()).toBe(1);
    });
  });

  describe('getActiveRoomsCount', () => {
    it('should return number of active rooms', () => {
      // Initially no rooms
      expect(gateway.getActiveRoomsCount()).toBe(0);

      // Add some mock rooms
      const mockRooms = new Map();
      mockRooms.set('socket-1', new Set(['socket-1'])); // Default room (socket ID)
      mockRooms.set('ABC12', new Set(['socket-1', 'socket-2'])); // Actual game room
      mockRooms.set('socket-2', new Set(['socket-2'])); // Default room (socket ID)
      mockRooms.set('XYZ34', new Set(['socket-3'])); // Actual game room

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      gateway.server.sockets.adapter.rooms = mockRooms;

      // Should count only non-default rooms (ABC12 and XYZ34)
      expect(gateway.getActiveRoomsCount()).toBe(2);
    });
  });
});
