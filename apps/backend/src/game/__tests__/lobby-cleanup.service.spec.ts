import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LobbyCleanupService } from '../services/lobby-cleanup.service';
import { GameService } from '../services/game.service';
import { ConnectionManager } from '../gateway/connection.manager';
import { Logger } from '@nestjs/common';
import { GameStatus } from '../../database/enums';
import { Game } from '../../database/entities';

describe('LobbyCleanupService', () => {
  let service: LobbyCleanupService;
  let gameService: jest.Mocked<GameService>;
  let gameRepository: jest.Mocked<Repository<Game>>;
  let connectionManager: jest.Mocked<ConnectionManager>;
  let mockServer: any;

  beforeEach(async () => {
    // Create mock server with sockets adapter
    mockServer = {
      sockets: {
        adapter: {
          rooms: new Map(),
        },
      },
    };

    const mockGameService = {
      getGameByRoomCode: jest.fn(),
    };

    const mockGameRepository = {
      find: jest.fn(),
      remove: jest.fn(),
    };

    const mockConnectionManager = {
      getConnection: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LobbyCleanupService,
        {
          provide: getRepositoryToken(Game),
          useValue: mockGameRepository,
        },
        {
          provide: GameService,
          useValue: mockGameService,
        },
        {
          provide: ConnectionManager,
          useValue: mockConnectionManager,
        },
      ],
    }).compile();

    service = module.get<LobbyCleanupService>(LobbyCleanupService);
    gameRepository = module.get(getRepositoryToken(Game)) as jest.Mocked<
      Repository<Game>
    >;
    gameService = module.get(GameService) as jest.Mocked<GameService>;
    connectionManager = module.get(
      ConnectionManager,
    ) as jest.Mocked<ConnectionManager>;

    // Set the mock server
    service.setServer(mockServer);

    // Mock the logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setServer', () => {
    it('should set the server instance', () => {
      const newMockServer = {
        sockets: {
          adapter: {
            rooms: new Map(),
          },
        },
      };

      service.setServer(newMockServer);

      // Service should be able to use the server
      expect(service).toBeDefined();
    });
  });

  describe('startCleanup', () => {
    it('should start cleanup interval', () => {
      jest.useFakeTimers();

      service.startCleanup();

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Started lobby cleanup task'),
      );

      jest.useRealTimers();
    });

    it('should call cleanupAbandonedLobbies periodically', () => {
      jest.useFakeTimers();

      // Spy on the private method through prototype
      const cleanupSpy = jest.spyOn(
        service as any,
        'cleanupAbandonedLobbies',
      );
      cleanupSpy.mockResolvedValue(undefined);

      service.startCleanup();

      // Fast-forward time by 5 minutes (cleanup interval)
      jest.advanceTimersByTime(5 * 60 * 1000);

      expect(cleanupSpy).toHaveBeenCalled();

      jest.useRealTimers();
      cleanupSpy.mockRestore();
    });
  });

  describe('cleanupAbandonedLobbies', () => {
    it('should skip rooms that are socket IDs', async () => {
      const socketId = 'socket123';
      const sockets = new Set([socketId]);
      mockServer.sockets.adapter.rooms.set(socketId, sockets);

      await (service as any).cleanupAbandonedLobbies();

      expect(gameService.getGameByRoomCode).not.toHaveBeenCalled();
    });

    it('should skip rooms with active users', async () => {
      const roomCode = 'ABC12';
      const socketId = 'socket123';
      const sockets = new Set([socketId]);
      mockServer.sockets.adapter.rooms.set(roomCode, sockets);

      connectionManager.getConnection.mockReturnValue({
        socketId,
        roomCode,
        userId: 'user1',
      } as any);

      await (service as any).cleanupAbandonedLobbies();

      expect(gameService.getGameByRoomCode).not.toHaveBeenCalled();
    });

    it('should check inactive lobbies and delete old ones', async () => {
      const roomCode = 'ABC12';
      const socketId = 'socket123';
      const sockets = new Set([socketId]);
      mockServer.sockets.adapter.rooms.set(roomCode, sockets);

      // No active connection
      connectionManager.getConnection.mockReturnValue(null);

      const oldGame = {
        id: 'game-id-1',
        roomCode,
        status: GameStatus.LOBBY,
        createdAt: new Date(Date.now() - 61 * 60 * 1000), // 61 minutes ago (> 1 hour)
      } as Game;

      gameService.getGameByRoomCode.mockResolvedValue(oldGame);
      gameRepository.remove.mockResolvedValue(oldGame);

      await (service as any).cleanupAbandonedLobbies();

      expect(gameService.getGameByRoomCode).toHaveBeenCalledWith(roomCode);
      expect(gameRepository.remove).toHaveBeenCalledWith(oldGame);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Found 1 potentially inactive lobbies'),
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Cleaning up abandoned lobby: ABC12'),
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Deleted abandoned lobby: ABC12'),
      );
    });

    it('should not cleanup recent lobbies', async () => {
      const roomCode = 'ABC12';
      const socketId = 'socket123';
      const sockets = new Set([socketId]);
      mockServer.sockets.adapter.rooms.set(roomCode, sockets);

      connectionManager.getConnection.mockReturnValue(null);

      const recentGame = {
        roomCode,
        status: GameStatus.LOBBY,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago (< 1 hour)
      } as Game;

      gameService.getGameByRoomCode.mockResolvedValue(recentGame);

      await (service as any).cleanupAbandonedLobbies();

      expect(gameService.getGameByRoomCode).toHaveBeenCalledWith(roomCode);
      expect(gameRepository.remove).not.toHaveBeenCalled();
      // Should not log cleanup message
      const logCalls = (Logger.prototype.log as jest.Mock).mock.calls;
      const hasCleanupMessage = logCalls.some((call) =>
        call[0]?.includes('Cleaning up abandoned lobby'),
      );
      expect(hasCleanupMessage).toBe(false);
    });

    it('should not cleanup games in progress', async () => {
      const roomCode = 'ABC12';
      const socketId = 'socket123';
      const sockets = new Set([socketId]);
      mockServer.sockets.adapter.rooms.set(roomCode, sockets);

      connectionManager.getConnection.mockReturnValue(null);

      const activeGame = {
        roomCode,
        status: GameStatus.IN_PROGRESS,
        createdAt: new Date(Date.now() - 61 * 60 * 1000), // 61 minutes ago
      } as Game;

      gameService.getGameByRoomCode.mockResolvedValue(activeGame);

      await (service as any).cleanupAbandonedLobbies();

      expect(gameService.getGameByRoomCode).toHaveBeenCalledWith(roomCode);
      expect(gameRepository.remove).not.toHaveBeenCalled();
      // Should not log cleanup message for in-progress games
      const logCalls = (Logger.prototype.log as jest.Mock).mock.calls;
      const hasCleanupMessage = logCalls.some((call) =>
        call[0]?.includes('Cleaning up abandoned lobby'),
      );
      expect(hasCleanupMessage).toBe(false);
    });

    it('should handle game not found', async () => {
      const roomCode = 'ABC12';
      const socketId = 'socket123';
      const sockets = new Set([socketId]);
      mockServer.sockets.adapter.rooms.set(roomCode, sockets);

      connectionManager.getConnection.mockReturnValue(null);
      gameService.getGameByRoomCode.mockResolvedValue(null);

      await (service as any).cleanupAbandonedLobbies();

      expect(gameService.getGameByRoomCode).toHaveBeenCalledWith(roomCode);
      // Should continue without error
      expect(Logger.prototype.error).not.toHaveBeenCalled();
    });

    it('should handle errors when checking individual lobbies', async () => {
      const roomCode = 'ABC12';
      const socketId = 'socket123';
      const sockets = new Set([socketId]);
      mockServer.sockets.adapter.rooms.set(roomCode, sockets);

      connectionManager.getConnection.mockReturnValue(null);
      const error = new Error('Database error');
      gameService.getGameByRoomCode.mockRejectedValue(error);

      await (service as any).cleanupAbandonedLobbies();

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Error checking lobby ABC12 for cleanup:'),
        error,
      );
    });

    it('should handle errors in the cleanup process', async () => {
      // Make the rooms forEach throw an error
      const error = new Error('Adapter error');
      mockServer.sockets.adapter.rooms.forEach = jest
        .fn()
        .mockImplementation(() => {
          throw error;
        });

      await (service as any).cleanupAbandonedLobbies();

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error in cleanupAbandonedLobbies:',
        error,
      );
    });
  });

  describe('cleanupCompletedGames', () => {
    it('should cleanup completed games older than 7 days', async () => {
      const oldCompletedGame = {
        id: 'game-id-1',
        roomCode: 'ABC12',
        status: GameStatus.COMPLETED,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        endedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      } as Game;

      gameRepository.find.mockResolvedValue([oldCompletedGame]);
      gameRepository.remove.mockResolvedValue(oldCompletedGame);

      await (service as any).cleanupCompletedGames();

      expect(gameRepository.find).toHaveBeenCalled();
      expect(gameRepository.remove).toHaveBeenCalledWith(oldCompletedGame);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Found 1 completed/aborted games older than 7 days'),
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Cleaning up completed game: ABC12'),
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Deleted completed game: ABC12'),
      );
    });

    it('should cleanup aborted games older than 7 days', async () => {
      const oldAbortedGame = {
        id: 'game-id-2',
        roomCode: 'XYZ99',
        status: GameStatus.ABORTED,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        endedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      } as Game;

      gameRepository.find.mockResolvedValue([oldAbortedGame]);
      gameRepository.remove.mockResolvedValue(oldAbortedGame);

      await (service as any).cleanupCompletedGames();

      expect(gameRepository.find).toHaveBeenCalled();
      expect(gameRepository.remove).toHaveBeenCalledWith(oldAbortedGame);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Cleaning up completed game: XYZ99'),
      );
    });

    it('should cleanup multiple old games', async () => {
      const oldGames = [
        {
          id: 'game-id-1',
          roomCode: 'ABC12',
          status: GameStatus.COMPLETED,
          endedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'game-id-2',
          roomCode: 'XYZ99',
          status: GameStatus.ABORTED,
          endedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      ] as Game[];

      gameRepository.find.mockResolvedValue(oldGames);
      gameRepository.remove.mockImplementation((game) => Promise.resolve(game));

      await (service as any).cleanupCompletedGames();

      expect(gameRepository.find).toHaveBeenCalled();
      expect(gameRepository.remove).toHaveBeenCalledTimes(2);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Found 2 completed/aborted games older than 7 days'),
      );
    });

    it('should not cleanup recent completed games', async () => {
      gameRepository.find.mockResolvedValue([]);

      await (service as any).cleanupCompletedGames();

      expect(gameRepository.find).toHaveBeenCalled();
      expect(gameRepository.remove).not.toHaveBeenCalled();
    });

    it('should handle errors when cleaning up individual games', async () => {
      const oldGame = {
        id: 'game-id-1',
        roomCode: 'ABC12',
        status: GameStatus.COMPLETED,
        endedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      } as Game;

      gameRepository.find.mockResolvedValue([oldGame]);
      const error = new Error('Database error');
      gameRepository.remove.mockRejectedValue(error);

      await (service as any).cleanupCompletedGames();

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Error cleaning up game ABC12:'),
        error,
      );
    });

    it('should handle errors in the cleanup process', async () => {
      const error = new Error('Find error');
      gameRepository.find.mockRejectedValue(error);

      await (service as any).cleanupCompletedGames();

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error in cleanupCompletedGames:',
        error,
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should clear cleanup interval on module destroy', () => {
      jest.useFakeTimers();

      service.startCleanup();
      service.onModuleDestroy();

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Stopped lobby cleanup task',
      );

      jest.useRealTimers();
    });

    it('should not throw error if cleanup was never started', () => {
      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });
});
