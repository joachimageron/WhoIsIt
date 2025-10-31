import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GameService } from './game.service';
import {
  CharacterSet,
  Game,
  GamePlayer,
  User,
  Round,
  PlayerSecret,
  Character,
  Question,
  Answer,
  Guess,
  PlayerStats,
} from '../database/entities';
import { GamePlayerRole, GameStatus, GameVisibility } from '../database/enums';
import type { CreateGameRequest, JoinGameRequest } from '@whois-it/contracts';

describe('GameService', () => {
  let service: GameService;

  const mockGameRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    exists: jest.fn(),
  };

  const mockPlayerRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockCharacterSetRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockRoundRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockPlayerSecretRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    })),
  };

  const mockCharacterRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockQuestionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAnswerRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockGuessRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    })),
  };

  const mockPlayerStatsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: getRepositoryToken(Game),
          useValue: mockGameRepository,
        },
        {
          provide: getRepositoryToken(GamePlayer),
          useValue: mockPlayerRepository,
        },
        {
          provide: getRepositoryToken(CharacterSet),
          useValue: mockCharacterSetRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Round),
          useValue: mockRoundRepository,
        },
        {
          provide: getRepositoryToken(PlayerSecret),
          useValue: mockPlayerSecretRepository,
        },
        {
          provide: getRepositoryToken(Character),
          useValue: mockCharacterRepository,
        },
        {
          provide: getRepositoryToken(Question),
          useValue: mockQuestionRepository,
        },
        {
          provide: getRepositoryToken(Answer),
          useValue: mockAnswerRepository,
        },
        {
          provide: getRepositoryToken(Guess),
          useValue: mockGuessRepository,
        },
        {
          provide: getRepositoryToken(PlayerStats),
          useValue: mockPlayerStatsRepository,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGame', () => {
    it('should successfully create a game with authenticated user', async () => {
      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
        slug: 'test-set',
        visibility: GameVisibility.PUBLIC,
        isDefault: true,
        metadata: {},
        createdAt: new Date(),
      } as CharacterSet;

      const mockUser: User = {
        id: 'user-123',
        email: 'host@example.com',
        username: 'hostuser',
        avatarUrl: 'https://example.com/avatar.jpg',
        isGuest: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      const createRequest: CreateGameRequest = {
        characterSetId: 'char-set-123',
        hostUserId: 'user-123',
        hostUsername: 'Host User',
        visibility: 'private',
        maxPlayers: 4,
        turnTimerSeconds: 60,
      };

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        characterSet: mockCharacterSet,
        host: mockUser,
        status: GameStatus.LOBBY,
        visibility: GameVisibility.PRIVATE,
        maxPlayers: 4,
        turnTimerSeconds: 60,
        ruleConfig: {},
        createdAt: new Date(),
        players: [],
      } as Game;

      const mockHostPlayer: GamePlayer = {
        id: 'player-123',
        game: mockGame,
        user: mockUser,
        username: 'hostuser',
        avatarUrl: mockUser.avatarUrl,
        role: GamePlayerRole.HOST,
        isReady: true,
        joinedAt: new Date(),
      } as GamePlayer;

      mockCharacterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockGameRepository.exists.mockResolvedValue(false);
      mockGameRepository.create.mockReturnValue(mockGame);
      mockGameRepository.save.mockResolvedValue(mockGame);
      mockPlayerRepository.create.mockReturnValue(mockHostPlayer);
      mockPlayerRepository.save.mockResolvedValue(mockHostPlayer);
      mockGameRepository.findOne.mockResolvedValue({
        ...mockGame,
        players: [mockHostPlayer],
      });

      const result = await service.createGame(createRequest);

      expect(result).toBeDefined();
      expect(result.roomCode).toBe('ABC12');
      expect(result.status).toBe(GameStatus.LOBBY);
      expect(result.players).toHaveLength(1);
      expect(result.players[0].role).toBe(GamePlayerRole.HOST);
      expect(mockCharacterSetRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'char-set-123' },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should successfully create a game with guest user', async () => {
      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
        slug: 'test-set',
        visibility: GameVisibility.PUBLIC,
        isDefault: true,
        metadata: {},
        createdAt: new Date(),
      } as CharacterSet;

      const createRequest: CreateGameRequest = {
        characterSetId: 'char-set-123',
        hostUsername: 'Guest Host',
        visibility: 'public',
      };

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'XYZ99',
        characterSet: mockCharacterSet,
        status: GameStatus.LOBBY,
        visibility: GameVisibility.PUBLIC,
        ruleConfig: {},
        createdAt: new Date(),
        players: [],
      } as Game;

      const mockHostPlayer: GamePlayer = {
        id: 'player-123',
        game: mockGame,
        username: 'guesthost',
        role: GamePlayerRole.HOST,
        isReady: true,
        joinedAt: new Date(),
      } as GamePlayer;

      mockCharacterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      mockGameRepository.exists.mockResolvedValue(false);
      mockGameRepository.create.mockReturnValue(mockGame);
      mockGameRepository.save.mockResolvedValue(mockGame);
      mockPlayerRepository.create.mockReturnValue(mockHostPlayer);
      mockPlayerRepository.save.mockResolvedValue(mockHostPlayer);
      mockGameRepository.findOne.mockResolvedValue({
        ...mockGame,
        players: [mockHostPlayer],
      });

      const result = await service.createGame(createRequest);

      expect(result).toBeDefined();
      expect(result.roomCode).toBe('XYZ99');
      expect(result.visibility).toBe(GameVisibility.PUBLIC);
      expect(result.players[0].username).toBe('guesthost');
    });

    it('should throw NotFoundException if character set not found', async () => {
      const createRequest: CreateGameRequest = {
        characterSetId: 'non-existent',
        hostUsername: 'Host',
      };

      mockCharacterSetRepository.findOne.mockResolvedValue(null);

      await expect(service.createGame(createRequest)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createGame(createRequest)).rejects.toThrow(
        'Character set not found',
      );
    });

    it('should throw NotFoundException if host user not found', async () => {
      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
        slug: 'test-set',
      } as CharacterSet;

      const createRequest: CreateGameRequest = {
        characterSetId: 'char-set-123',
        hostUserId: 'non-existent-user',
        hostUsername: 'Host',
      };

      mockCharacterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.createGame(createRequest)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createGame(createRequest)).rejects.toThrow(
        'Host user not found',
      );
    });

    it('should throw BadRequestException if host display name is missing', async () => {
      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
        slug: 'test-set',
      } as CharacterSet;

      const createRequest: CreateGameRequest = {
        characterSetId: 'char-set-123',
      };

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        characterSet: mockCharacterSet,
        status: GameStatus.LOBBY,
        players: [],
      } as unknown as Game;

      mockCharacterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      mockGameRepository.exists.mockResolvedValue(false);
      mockGameRepository.create.mockReturnValue(mockGame);
      mockGameRepository.save.mockResolvedValue(mockGame);

      await expect(service.createGame(createRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createGame(createRequest)).rejects.toThrow(
        'A host username is required',
      );
    });

    it('should throw InternalServerErrorException if unable to generate room code', async () => {
      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
        slug: 'test-set',
      } as CharacterSet;

      const createRequest: CreateGameRequest = {
        characterSetId: 'char-set-123',
        hostUsername: 'Host',
      };

      mockCharacterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      mockGameRepository.exists.mockResolvedValue(true); // All room codes exist

      await expect(service.createGame(createRequest)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.createGame(createRequest)).rejects.toThrow(
        'Unable to allocate a room code',
      );
    });
  });

  describe('joinGame', () => {
    it('should successfully join a game as authenticated user', async () => {
      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
      } as CharacterSet;

      const mockHostUser: User = {
        id: 'host-123',
        username: 'host',
      } as User;

      const mockJoiningUser: User = {
        id: 'user-456',
        email: 'player@example.com',
        username: 'player',
        avatarUrl: 'https://example.com/player.jpg',
        isGuest: false,
      } as User;

      const mockHostPlayer: GamePlayer = {
        id: 'player-host',
        username: 'host',
        role: GamePlayerRole.HOST,
        user: mockHostUser,
      } as GamePlayer;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        characterSet: mockCharacterSet,
        host: mockHostUser,
        status: GameStatus.LOBBY,
        maxPlayers: 4,
        players: [mockHostPlayer],
      } as Game;

      const mockNewPlayer: GamePlayer = {
        id: 'player-new',
        game: mockGame,
        user: mockJoiningUser,
        username: 'playerone',
        avatarUrl: mockJoiningUser.avatarUrl,
        role: GamePlayerRole.PLAYER,
        isReady: false,
        joinedAt: new Date(),
      } as GamePlayer;

      const joinRequest: JoinGameRequest = {
        userId: 'user-456',
        username: 'playerone',
      };

      mockGameRepository.findOne.mockResolvedValueOnce(mockGame);
      mockUserRepository.findOne.mockResolvedValue(mockJoiningUser);
      mockPlayerRepository.create.mockReturnValue(mockNewPlayer);
      mockPlayerRepository.save.mockResolvedValue(mockNewPlayer);
      mockGameRepository.findOne.mockResolvedValueOnce({
        ...mockGame,
        players: [mockHostPlayer, mockNewPlayer],
      });

      const result = await service.joinGame('ABC12', joinRequest);

      expect(result).toBeDefined();
      expect(result.players).toHaveLength(2);
      expect(result.players[1].username).toBe('playerone');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-456' },
      });
    });

    it('should successfully join a game as guest', async () => {
      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
      } as CharacterSet;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        characterSet: mockCharacterSet,
        status: GameStatus.LOBBY,
        players: [],
      } as unknown as Game;

      const mockNewPlayer: GamePlayer = {
        id: 'player-guest',
        game: mockGame,
        username: 'guestplayer',
        role: GamePlayerRole.PLAYER,
        isReady: false,
        joinedAt: new Date(),
      } as GamePlayer;

      const joinRequest: JoinGameRequest = {
        username: 'guestplayer',
      };

      mockGameRepository.findOne.mockResolvedValueOnce(mockGame);
      mockPlayerRepository.create.mockReturnValue(mockNewPlayer);
      mockPlayerRepository.save.mockResolvedValue(mockNewPlayer);
      mockGameRepository.findOne.mockResolvedValueOnce({
        ...mockGame,
        players: [mockNewPlayer],
      });

      const result = await service.joinGame('abc12', joinRequest);

      expect(result).toBeDefined();
      expect(result.roomCode).toBe('ABC12');
      expect(result.players[0].username).toBe('guestplayer');
    });

    it('should throw NotFoundException if game not found', async () => {
      const joinRequest: JoinGameRequest = {
        username: 'player',
      };

      mockGameRepository.findOne.mockResolvedValue(null);

      await expect(service.joinGame('INVALID', joinRequest)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.joinGame('INVALID', joinRequest)).rejects.toThrow(
        'Game not found',
      );
    });

    it('should throw BadRequestException if game is not joinable', async () => {
      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        players: [],
      } as unknown as Game;

      const joinRequest: JoinGameRequest = {
        username: 'player',
      };

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      await expect(service.joinGame('ABC12', joinRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.joinGame('ABC12', joinRequest)).rejects.toThrow(
        'Game is not joinable',
      );
    });

    it('should throw BadRequestException if game is full', async () => {
      const mockPlayers = [
        { id: '1' } as GamePlayer,
        { id: '2' } as GamePlayer,
        { id: '3' } as GamePlayer,
        { id: '4' } as GamePlayer,
      ];

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        maxPlayers: 4,
        players: mockPlayers,
      } as Game;

      const joinRequest: JoinGameRequest = {
        username: 'player',
      };

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      await expect(service.joinGame('ABC12', joinRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.joinGame('ABC12', joinRequest)).rejects.toThrow(
        'Game is full',
      );
    });

    it('should throw NotFoundException if joining user not found', async () => {
      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        players: [],
      } as unknown as Game;

      const joinRequest: JoinGameRequest = {
        userId: 'non-existent',
        username: 'player',
      };

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.joinGame('ABC12', joinRequest)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.joinGame('ABC12', joinRequest)).rejects.toThrow(
        'Joining user not found',
      );
    });

    it('should throw BadRequestException if display name is missing', async () => {
      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        players: [],
      } as unknown as Game;

      const joinRequest: JoinGameRequest = {};

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      await expect(service.joinGame('ABC12', joinRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.joinGame('ABC12', joinRequest)).rejects.toThrow(
        'A username is required',
      );
    });

    it('should return existing game if user already joined', async () => {
      const mockUser: User = {
        id: 'user-123',
        username: 'existingplayer',
      } as User;

      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
      } as CharacterSet;

      const mockPlayer: GamePlayer = {
        id: 'player-123',
        user: mockUser,
        username: 'existingplayer',
      } as GamePlayer;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        characterSet: mockCharacterSet,
        players: [mockPlayer],
        createdAt: new Date(),
      } as Game;

      const joinRequest: JoinGameRequest = {
        userId: 'user-123',
        username: 'existingplayer',
      };

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.joinGame('ABC12', joinRequest);

      expect(result).toBeDefined();
      expect(mockPlayerRepository.create).not.toHaveBeenCalled();
    });

    it('should allow authenticated user to rejoin after leaving', async () => {
      const mockUser: User = {
        id: 'user-789',
        username: 'rejoinuser',
        avatarUrl: 'https://example.com/avatar.jpg',
      } as User;

      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
      } as CharacterSet;

      const mockPlayer: GamePlayer = {
        id: 'player-789',
        user: mockUser,
        username: 'rejoinuser',
        avatarUrl: mockUser.avatarUrl,
        leftAt: new Date('2024-01-01T10:00:00Z'), // Player previously left
        isReady: false,
      } as GamePlayer;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        characterSet: mockCharacterSet,
        players: [mockPlayer],
        createdAt: new Date(),
      } as Game;

      const joinRequest: JoinGameRequest = {
        userId: 'user-789',
        username: 'rejoinuser',
      };

      mockGameRepository.findOne
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({
          ...mockGame,
          players: [{ ...mockPlayer, leftAt: null }],
        });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPlayerRepository.save.mockImplementation((player) =>
        Promise.resolve({ ...player, leftAt: null }),
      );

      const result = await service.joinGame('ABC12', joinRequest);

      expect(result).toBeDefined();
      expect(mockPlayerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player-789',
          leftAt: null,
          isReady: false,
        }),
      );
      expect(mockPlayerRepository.create).not.toHaveBeenCalled();
    });

    it('should allow guest to rejoin after leaving (matched by username)', async () => {
      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
      } as CharacterSet;

      const mockGuestPlayer: GamePlayer = {
        id: 'player-guest-123',
        username: 'guestplayer',
        user: null,
        leftAt: new Date('2024-01-01T10:00:00Z'), // Guest previously left
        isReady: false,
      } as GamePlayer;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        characterSet: mockCharacterSet,
        players: [mockGuestPlayer],
        createdAt: new Date(),
      } as Game;

      const joinRequest: JoinGameRequest = {
        username: 'guestplayer',
      };

      mockGameRepository.findOne
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({
          ...mockGame,
          players: [{ ...mockGuestPlayer, leftAt: null }],
        });
      mockPlayerRepository.save.mockImplementation((player) =>
        Promise.resolve({ ...player, leftAt: null }),
      );

      const result = await service.joinGame('ABC12', joinRequest);

      expect(result).toBeDefined();
      expect(mockPlayerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player-guest-123',
          leftAt: null,
          isReady: false,
        }),
      );
      expect(mockPlayerRepository.create).not.toHaveBeenCalled();
    });

    it('should count only active players when checking if game is full', async () => {
      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
      } as CharacterSet;

      const mockLeftPlayer: GamePlayer = {
        id: 'player-left',
        username: 'leftplayer',
        leftAt: new Date('2024-01-01T10:00:00Z'),
      } as GamePlayer;

      const mockActivePlayer1: GamePlayer = {
        id: 'player-1',
        username: 'active1',
      } as GamePlayer;

      const mockActivePlayer2: GamePlayer = {
        id: 'player-2',
        username: 'active2',
      } as GamePlayer;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        characterSet: mockCharacterSet,
        maxPlayers: 3,
        players: [mockLeftPlayer, mockActivePlayer1, mockActivePlayer2],
        createdAt: new Date(),
      } as Game;

      const mockNewPlayer: GamePlayer = {
        id: 'player-new',
        username: 'newplayer',
      } as GamePlayer;

      const joinRequest: JoinGameRequest = {
        username: 'newplayer',
      };

      mockGameRepository.findOne
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({
          ...mockGame,
          players: [
            mockLeftPlayer,
            mockActivePlayer1,
            mockActivePlayer2,
            mockNewPlayer,
          ],
        });
      mockPlayerRepository.create.mockReturnValue(mockNewPlayer);
      mockPlayerRepository.save.mockResolvedValue(mockNewPlayer);

      const result = await service.joinGame('ABC12', joinRequest);

      expect(result).toBeDefined();
      expect(mockPlayerRepository.create).toHaveBeenCalled();
      // Should succeed even though there are 3 total players,
      // because one has left and maxPlayers is 3
    });
  });

  describe('getLobbyByRoomCode', () => {
    it('should return lobby information for valid room code', async () => {
      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        characterSet: { id: 'char-set-123' } as CharacterSet,
        players: [],
        createdAt: new Date(),
      } as unknown as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      const result = await service.getLobbyByRoomCode('abc12');

      expect(result).toBeDefined();
      expect(result.roomCode).toBe('ABC12');
      expect(mockGameRepository.findOne).toHaveBeenCalledWith({
        where: { roomCode: 'ABC12' },
        relations: {
          characterSet: true,
          host: true,
          players: { user: true },
        },
      });
    });

    it('should throw NotFoundException if game not found', async () => {
      mockGameRepository.findOne.mockResolvedValue(null);

      await expect(service.getLobbyByRoomCode('INVALID')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getLobbyByRoomCode('INVALID')).rejects.toThrow(
        'Game not found',
      );
    });
  });

  describe('updatePlayerReady', () => {
    it('should successfully update player ready status', async () => {
      const mockPlayer: GamePlayer = {
        id: 'player-123',
        isReady: false,
        game: { status: GameStatus.LOBBY } as Game,
      } as GamePlayer;

      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);
      mockPlayerRepository.save.mockResolvedValue({
        ...mockPlayer,
        isReady: true,
      });

      const result = await service.updatePlayerReady('player-123', true);

      expect(result.isReady).toBe(true);
      expect(mockPlayerRepository.save).toHaveBeenCalledWith({
        ...mockPlayer,
        isReady: true,
      });
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePlayerReady('non-existent', true),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updatePlayerReady('non-existent', true),
      ).rejects.toThrow('Player not found');
    });

    it('should throw BadRequestException if game is not in lobby state', async () => {
      const mockPlayer: GamePlayer = {
        id: 'player-123',
        isReady: false,
        game: { status: GameStatus.IN_PROGRESS } as Game,
      } as GamePlayer;

      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);

      await expect(
        service.updatePlayerReady('player-123', true),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updatePlayerReady('player-123', true),
      ).rejects.toThrow('Game is not in lobby state');
    });
  });

  describe('markPlayerAsLeft', () => {
    it('should successfully mark player as left', async () => {
      const mockPlayer: GamePlayer = {
        id: 'player-123',
        leftAt: null,
        game: { status: GameStatus.LOBBY } as Game,
      } as GamePlayer;

      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);
      mockPlayerRepository.save.mockImplementation((player) =>
        Promise.resolve(player),
      );

      const result = await service.markPlayerAsLeft('player-123');

      expect(result.leftAt).toBeInstanceOf(Date);
      expect(mockPlayerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player-123',
          leftAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(null);

      await expect(service.markPlayerAsLeft('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.markPlayerAsLeft('non-existent')).rejects.toThrow(
        'Player not found',
      );
    });
  });

  describe('startGame', () => {
    it('should successfully start a game with all players ready', async () => {
      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
        slug: 'test-set',
      } as CharacterSet;

      const mockPlayer1: GamePlayer = {
        id: 'player-1',
        username: 'Player 1',
        isReady: true,
        joinedAt: new Date(),
      } as GamePlayer;

      const mockPlayer2: GamePlayer = {
        id: 'player-2',
        username: 'Player 2',
        isReady: true,
        joinedAt: new Date(),
      } as GamePlayer;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        characterSet: mockCharacterSet,
        players: [mockPlayer1, mockPlayer2],
        createdAt: new Date(),
      } as Game;

      const mockCharacters: Character[] = [
        { id: 'char-1', name: 'Character 1' } as Character,
        { id: 'char-2', name: 'Character 2' } as Character,
        { id: 'char-3', name: 'Character 3' } as Character,
      ];

      const mockRound: Round = {
        id: 'round-1',
        roundNumber: 1,
      } as Round;

      mockGameRepository.findOne
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({ ...mockGame, status: GameStatus.IN_PROGRESS });
      mockGameRepository.save.mockResolvedValue({
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
      });
      mockCharacterRepository.find.mockResolvedValue(mockCharacters);
      mockRoundRepository.create.mockReturnValue(mockRound);
      mockRoundRepository.save.mockResolvedValue(mockRound);
      mockPlayerSecretRepository.create.mockImplementation((data) => data);
      mockPlayerSecretRepository.save.mockResolvedValue([]);

      const result = await service.startGame('ABC12');

      expect(result).toBeDefined();
      expect(mockGameRepository.save).toHaveBeenCalled();
      expect(mockRoundRepository.create).toHaveBeenCalled();
      expect(mockRoundRepository.save).toHaveBeenCalled();
      expect(mockCharacterRepository.find).toHaveBeenCalled();
      expect(mockPlayerSecretRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if game not found', async () => {
      mockGameRepository.findOne.mockResolvedValue(null);

      await expect(service.startGame('NOTFOUND')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.startGame('NOTFOUND')).rejects.toThrow(
        'Game not found',
      );
    });

    it('should throw BadRequestException if game has already started', async () => {
      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      await expect(service.startGame('ABC12')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.startGame('ABC12')).rejects.toThrow(
        'Game has already started or ended',
      );
    });

    it('should throw BadRequestException if less than 2 players', async () => {
      const mockPlayer: GamePlayer = {
        id: 'player-1',
        username: 'Player 1',
        isReady: true,
      } as GamePlayer;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        players: [mockPlayer],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      await expect(service.startGame('ABC12')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.startGame('ABC12')).rejects.toThrow(
        'Need at least 2 players to start the game',
      );
    });

    it('should throw BadRequestException if not all players are ready', async () => {
      const mockPlayer1: GamePlayer = {
        id: 'player-1',
        username: 'Player 1',
        isReady: true,
      } as GamePlayer;

      const mockPlayer2: GamePlayer = {
        id: 'player-2',
        username: 'Player 2',
        isReady: false,
      } as GamePlayer;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        players: [mockPlayer1, mockPlayer2],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      await expect(service.startGame('ABC12')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.startGame('ABC12')).rejects.toThrow(
        'All players must be ready to start',
      );
    });

    it('should throw BadRequestException if not enough characters for all players', async () => {
      const mockCharacterSet: CharacterSet = {
        id: 'char-set-123',
        name: 'Test Set',
      } as CharacterSet;

      const mockPlayer1: GamePlayer = {
        id: 'player-1',
        username: 'Player 1',
        isReady: true,
        joinedAt: new Date(),
      } as GamePlayer;

      const mockPlayer2: GamePlayer = {
        id: 'player-2',
        username: 'Player 2',
        isReady: true,
        joinedAt: new Date(),
      } as GamePlayer;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        characterSet: mockCharacterSet,
        players: [mockPlayer1, mockPlayer2],
        createdAt: new Date(),
      } as Game;

      const mockCharacters: Character[] = [
        { id: 'char-1', name: 'Character 1' } as Character,
      ];

      const mockRound: Round = {
        id: 'round-1',
        roundNumber: 1,
      } as Round;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockGameRepository.save.mockResolvedValue({
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
      });
      mockCharacterRepository.find.mockResolvedValue(mockCharacters);
      mockRoundRepository.create.mockReturnValue(mockRound);
      mockRoundRepository.save.mockResolvedValue(mockRound);

      const error = await service
        .startGame('ABC12')
        .catch((err) => err) as BadRequestException;

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toContain(
        'Not enough characters in the set for all players',
      );
    });
  });

  describe('askQuestion', () => {
    it('should successfully ask a question', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_question' as any,
        activePlayer: {
          id: 'player-1',
          username: 'Player1',
        } as GamePlayer,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [
          { id: 'player-1', username: 'Player1' },
          { id: 'player-2', username: 'Player2' },
        ] as GamePlayer[],
      } as Game;

      const mockPlayer1: GamePlayer = {
        id: 'player-1',
        username: 'Player1',
        game: mockGame,
      } as GamePlayer;

      const mockPlayer2: GamePlayer = {
        id: 'player-2',
        username: 'Player2',
        game: mockGame,
      } as GamePlayer;

      const mockQuestion: Question = {
        id: 'question-123',
        round: mockRound,
        askedBy: mockPlayer1,
        targetPlayer: mockPlayer2,
        questionText: 'Does your character have glasses?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
        askedAt: new Date(),
      } as Question;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(mockPlayer1)
        .mockResolvedValueOnce(mockPlayer2);
      mockQuestionRepository.create.mockReturnValue(mockQuestion);
      mockQuestionRepository.save.mockResolvedValue(mockQuestion);
      mockRoundRepository.save.mockResolvedValue({
        ...mockRound,
        state: 'awaiting_answer' as any,
      });

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Does your character have glasses?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
      };

      const result = await service.askQuestion('ABC12', request);

      expect(result).toBeDefined();
      expect(result.questionText).toBe('Does your character have glasses?');
      expect(result.askedByPlayerId).toBe('player-1');
      expect(result.targetPlayerId).toBe('player-2');
      expect(mockQuestionRepository.create).toHaveBeenCalled();
      expect(mockQuestionRepository.save).toHaveBeenCalled();
      expect(mockRoundRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'awaiting_answer',
        }),
      );
    });

    it('should throw NotFoundException if game not found', async () => {
      mockGameRepository.findOne.mockResolvedValue(null);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Test question?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
      };

      await expect(service.askQuestion('INVALID', request)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.askQuestion('INVALID', request)).rejects.toThrow(
        'Game not found',
      );
    });

    it('should throw BadRequestException if game is not in progress', async () => {
      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Test question?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
      };

      await expect(service.askQuestion('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.askQuestion('ABC12', request)).rejects.toThrow(
        'Game is not in progress',
      );
    });

    it('should throw InternalServerErrorException if no active round found', async () => {
      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [],
      } as unknown as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Test question?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
      };

      await expect(service.askQuestion('ABC12', request)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.askQuestion('ABC12', request)).rejects.toThrow(
        'No active round found',
      );
    });

    it('should throw BadRequestException if round is not awaiting question', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_answer' as any,
        activePlayer: {
          id: 'player-1',
        } as GamePlayer,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Test question?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
      };

      await expect(service.askQuestion('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.askQuestion('ABC12', request)).rejects.toThrow(
        'Cannot ask question in round state',
      );
    });

    it('should throw BadRequestException if player is not the active player', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_question' as any,
        activePlayer: {
          id: 'player-2',
        } as GamePlayer,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Test question?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
      };

      await expect(service.askQuestion('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.askQuestion('ABC12', request)).rejects.toThrow(
        'Only the active player can ask a question',
      );
    });

    it('should throw NotFoundException if asking player not found', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_question' as any,
        activePlayer: {
          id: 'player-1',
        } as GamePlayer,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne.mockResolvedValue(null);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Test question?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
      };

      await expect(service.askQuestion('ABC12', request)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.askQuestion('ABC12', request)).rejects.toThrow(
        'Player not found',
      );
    });

    it('should throw NotFoundException if target player not found', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_question' as any,
        activePlayer: {
          id: 'player-1',
        } as GamePlayer,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      const mockPlayer1: GamePlayer = {
        id: 'player-1',
        username: 'Player1',
        game: mockGame,
      } as GamePlayer;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(mockPlayer1)
        .mockResolvedValueOnce(null);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Test question?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
      };

      const error = await service
        .askQuestion('ABC12', request)
        .catch((err) => err) as NotFoundException;

      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe('Target player not found');
    });

    it('should throw BadRequestException if target player is not in the game', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_question' as any,
        activePlayer: {
          id: 'player-1',
        } as GamePlayer,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      const mockPlayer1: GamePlayer = {
        id: 'player-1',
        username: 'Player1',
        game: mockGame,
      } as GamePlayer;

      const mockPlayer2: GamePlayer = {
        id: 'player-2',
        username: 'Player2',
        game: { id: 'different-game' } as Game,
      } as GamePlayer;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(mockPlayer1)
        .mockResolvedValueOnce(mockPlayer2);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Test question?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
      };

      const error = await service
        .askQuestion('ABC12', request)
        .catch((err) => err) as BadRequestException;

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('Target player is not in this game');
    });

    it('should allow asking question without target player', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_question' as any,
        activePlayer: {
          id: 'player-1',
          username: 'Player1',
        } as GamePlayer,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      const mockPlayer1: GamePlayer = {
        id: 'player-1',
        username: 'Player1',
        game: mockGame,
      } as GamePlayer;

      const mockQuestion: Question = {
        id: 'question-123',
        round: mockRound,
        askedBy: mockPlayer1,
        targetPlayer: null,
        questionText: 'How many characters remain?',
        category: 'meta' as any,
        answerType: 'text' as any,
        askedAt: new Date(),
      } as Question;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer1);
      mockQuestionRepository.create.mockReturnValue(mockQuestion);
      mockQuestionRepository.save.mockResolvedValue(mockQuestion);
      mockRoundRepository.save.mockResolvedValue({
        ...mockRound,
        state: 'awaiting_answer' as any,
      });

      const request = {
        playerId: 'player-1',
        questionText: 'How many characters remain?',
        category: 'meta' as any,
        answerType: 'text' as any,
      };

      const result = await service.askQuestion('ABC12', request);

      expect(result).toBeDefined();
      expect(result.questionText).toBe('How many characters remain?');
      expect(result.targetPlayerId).toBeUndefined();
    });
  });

  describe('getGameState', () => {
    it('should return current game state', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 2,
        state: 'awaiting_question' as any,
        activePlayer: {
          id: 'player-1',
          username: 'Player1',
        } as GamePlayer,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [
          {
            id: 'player-1',
            username: 'Player1',
            isReady: true,
            role: GamePlayerRole.HOST,
            joinedAt: new Date(),
          },
          {
            id: 'player-2',
            username: 'Player2',
            isReady: true,
            role: GamePlayerRole.PLAYER,
            joinedAt: new Date(),
          },
        ] as GamePlayer[],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      const result = await service.getGameState('ABC12');

      expect(result).toBeDefined();
      expect(result.roomCode).toBe('ABC12');
      expect(result.status).toBe(GameStatus.IN_PROGRESS);
      expect(result.currentRoundNumber).toBe(2);
      expect(result.currentRoundState).toBe('awaiting_question');
      expect(result.activePlayerId).toBe('player-1');
      expect(result.activePlayerUsername).toBe('Player1');
      expect(result.players).toHaveLength(2);
    });

    it('should throw NotFoundException if game not found', async () => {
      mockGameRepository.findOne.mockResolvedValue(null);

      await expect(service.getGameState('INVALID')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getGameState('INVALID')).rejects.toThrow(
        'Game not found',
      );
    });
  });

  describe('submitAnswer', () => {
    it('should successfully submit an answer', async () => {
      const mockCharacter: Character = {
        id: 'char-1',
        name: 'Character 1',
        
      } as unknown as Character;

      const mockPlayerSecret: PlayerSecret = {
        id: 'secret-1',
        character: mockCharacter,
        status: 'hidden' as any,
      } as PlayerSecret;

      const mockAnsweringPlayer: GamePlayer = {
        id: 'player-2',
        username: 'Player2',
        game: { id: 'game-123' } as Game,
        secret: mockPlayerSecret,
      } as GamePlayer;

      const mockPlayer1: GamePlayer = {
        id: 'player-1',
        username: 'Player1',
      } as GamePlayer;

      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_answer' as any,
        activePlayer: mockPlayer1,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [
          mockPlayer1,
          mockAnsweringPlayer,
          { id: 'player-3', username: 'Player3', leftAt: null } as GamePlayer,
        ],
      } as Game;

      const mockQuestion: Question = {
        id: 'question-123',
        round: mockRound,
        askedBy: mockPlayer1,
        targetPlayer: mockAnsweringPlayer,
        questionText: 'Does your character have glasses?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
        answers: [],
      } as unknown as Question;

      const mockAnswer = {
        id: 'answer-123',
        question: mockQuestion,
        answeredBy: mockAnsweringPlayer,
        answerValue: 'yes' as any,
        answerText: null,
        latencyMs: null,
        answeredAt: new Date(),
      };

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion);
      mockPlayerRepository.findOne.mockResolvedValue(mockAnsweringPlayer);
      mockAnswerRepository.create.mockReturnValue(mockAnswer);
      mockAnswerRepository.save.mockResolvedValue(mockAnswer);
      mockRoundRepository.save.mockResolvedValue({
        ...mockRound,
        state: 'awaiting_question' as any,
        activePlayer: mockAnsweringPlayer,
      });

      const request = {
        playerId: 'player-2',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      const result = await service.submitAnswer('ABC12', request);

      expect(result).toBeDefined();
      expect(result.id).toBe('answer-123');
      expect(result.questionId).toBe('question-123');
      expect(result.answeredByPlayerId).toBe('player-2');
      expect(result.answeredByPlayerUsername).toBe('Player2');
      expect(result.answerValue).toBe('yes');
      expect(mockRoundRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if game not found', async () => {
      mockGameRepository.findOne.mockResolvedValue(null);

      const request = {
        playerId: 'player-1',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await expect(service.submitAnswer('INVALID', request)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.submitAnswer('INVALID', request)).rejects.toThrow(
        'Game not found',
      );
    });

    it('should throw BadRequestException if game is not in progress', async () => {
      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        rounds: [],
      } as unknown as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      const request = {
        playerId: 'player-1',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Game is not in progress',
      );
    });

    it('should throw InternalServerErrorException if no active round found', async () => {
      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [],
      } as unknown as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      const request = {
        playerId: 'player-1',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'No active round found',
      );
    });

    it('should throw BadRequestException if round is not awaiting answer', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_question' as any,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      const request = {
        playerId: 'player-1',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Cannot submit answer in round state',
      );
    });

    it('should throw NotFoundException if question not found', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_answer' as any,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockQuestionRepository.findOne.mockResolvedValue(null);

      const request = {
        playerId: 'player-1',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Question not found',
      );
    });

    it('should throw BadRequestException if question is not for current round', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_answer' as any,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      const mockQuestion: Question = {
        id: 'question-123',
        round: { id: 'different-round' } as Round,
        answers: [],
      } as unknown as Question;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion);

      const request = {
        playerId: 'player-1',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Question is not for the current round',
      );
    });

    it('should throw BadRequestException if question has already been answered', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_answer' as any,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      const mockQuestion: Question = {
        id: 'question-123',
        round: mockRound,
        answers: [{ id: 'answer-1' }] as any[],
      } as Question;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion);

      const request = {
        playerId: 'player-1',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Question has already been answered',
      );
    });

    it('should throw NotFoundException if answering player not found', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_answer' as any,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      const mockQuestion: Question = {
        id: 'question-123',
        round: mockRound,
        answers: [],
      } as unknown as Question;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion);
      mockPlayerRepository.findOne.mockResolvedValue(null);

      const request = {
        playerId: 'player-1',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Player not found',
      );
    });

    it('should throw BadRequestException if answering player is not in the game', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_answer' as any,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      const mockQuestion: Question = {
        id: 'question-123',
        round: mockRound,
        answers: [],
      } as unknown as Question;

      const mockPlayer: GamePlayer = {
        id: 'player-1',
        username: 'Player1',
        game: { id: 'different-game' } as Game,
      } as GamePlayer;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion);
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);

      const request = {
        playerId: 'player-1',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Player is not in this game',
      );
    });

    it('should throw BadRequestException if answering player is not the targeted player', async () => {
      const mockPlayer1: GamePlayer = {
        id: 'player-1',
        username: 'Player1',
      } as GamePlayer;

      const mockPlayer2: GamePlayer = {
        id: 'player-2',
        username: 'Player2',
        game: { id: 'game-123' } as Game,
        secret: {
          character: { id: 'char-1' } as unknown as Character,
        } as PlayerSecret,
      } as GamePlayer;

      const mockPlayer3: GamePlayer = {
        id: 'player-3',
        username: 'Player3',
        game: { id: 'game-123' } as Game,
        secret: {
          character: { id: 'char-2' } as unknown as Character,
        } as PlayerSecret,
      } as GamePlayer;

      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_answer' as any,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [mockPlayer1, mockPlayer2, mockPlayer3],
      } as Game;

      const mockQuestion: Question = {
        id: 'question-123',
        round: mockRound,
        askedBy: mockPlayer1,
        targetPlayer: mockPlayer2,
        answers: [],
      } as unknown as Question;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion);
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer3);

      const request = {
        playerId: 'player-3',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Only the targeted player can answer this question',
      );
    });

    it('should throw BadRequestException if player tries to answer their own question', async () => {
      const mockPlayer1: GamePlayer = {
        id: 'player-1',
        username: 'Player1',
        game: { id: 'game-123' } as Game,
        secret: {
          character: { id: 'char-1' } as unknown as Character,
        } as PlayerSecret,
      } as GamePlayer;

      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_answer' as any,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [mockPlayer1],
      } as Game;

      const mockQuestion: Question = {
        id: 'question-123',
        round: mockRound,
        askedBy: mockPlayer1,
        targetPlayer: null,
        answers: [],
      } as unknown as Question;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion);
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer1);

      const request = {
        playerId: 'player-1',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Cannot answer your own question',
      );
    });

    it('should advance to next player turn after answer submission', async () => {
      const mockCharacter: Character = {
        id: 'char-1',
        name: 'Character 1',
        
      } as unknown as Character;

      const mockPlayerSecret: PlayerSecret = {
        id: 'secret-1',
        character: mockCharacter,
        status: 'hidden' as any,
      } as PlayerSecret;

      const mockPlayer1: GamePlayer = {
        id: 'player-1',
        username: 'Player1',
        leftAt: null,
      } as GamePlayer;

      const mockPlayer2: GamePlayer = {
        id: 'player-2',
        username: 'Player2',
        game: { id: 'game-123' } as Game,
        secret: mockPlayerSecret,
        leftAt: null,
      } as GamePlayer;

      const mockPlayer3: GamePlayer = {
        id: 'player-3',
        username: 'Player3',
        leftAt: null,
      } as GamePlayer;

      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_answer' as any,
        activePlayer: mockPlayer1,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [mockPlayer1, mockPlayer2, mockPlayer3],
      } as Game;

      const mockQuestion: Question = {
        id: 'question-123',
        round: mockRound,
        askedBy: mockPlayer1,
        targetPlayer: mockPlayer2,
        questionText: 'Does your character have glasses?',
        category: 'direct' as any,
        answerType: 'boolean' as any,
        answers: [],
      } as unknown as Question;

      const mockAnswer = {
        id: 'answer-123',
        question: mockQuestion,
        answeredBy: mockPlayer2,
        answerValue: 'yes' as any,
        answerText: null,
        latencyMs: null,
        answeredAt: new Date(),
      };

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion);
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer2);
      mockAnswerRepository.create.mockReturnValue(mockAnswer);
      mockAnswerRepository.save.mockResolvedValue(mockAnswer);
      mockRoundRepository.save.mockResolvedValue({
        ...mockRound,
        state: 'awaiting_question' as any,
        activePlayer: mockPlayer2,
      });

      const request = {
        playerId: 'player-2',
        questionId: 'question-123',
        answerValue: 'yes' as any,
      };

      await service.submitAnswer('ABC12', request);

      expect(mockRoundRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'awaiting_question',
          activePlayer: mockPlayer2,
        }),
      );
    });
  });

  describe('submitGuess', () => {
    it('should successfully submit a correct guess and reveal target player secret', async () => {
      const mockCharacter: Character = {
        id: 'char-1',
        name: 'Character 1',
      } as Character;

      const mockPlayerSecret: PlayerSecret = {
        id: 'secret-1',
        character: mockCharacter,
        status: 'hidden' as any,
      } as PlayerSecret;

      const mockGuessingPlayer: GamePlayer = {
        id: 'player-1',
        username: 'Guesser',
        game: { id: 'game-123' } as Game,
        leftAt: null,
      } as GamePlayer;

      const mockTargetPlayer: GamePlayer = {
        id: 'player-2',
        username: 'Target',
        game: { id: 'game-123' } as Game,
        secret: mockPlayerSecret,
        leftAt: null,
      } as GamePlayer;

      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_question' as any,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [mockGuessingPlayer, mockTargetPlayer],
      } as Game;

      const mockGuess: Guess = {
        id: 'guess-123',
        round: mockRound,
        guessedBy: mockGuessingPlayer,
        targetPlayer: mockTargetPlayer,
        targetCharacter: mockCharacter,
        isCorrect: true,
        latencyMs: null,
        guessedAt: new Date(),
      } as Guess;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(mockGuessingPlayer)
        .mockResolvedValueOnce(mockTargetPlayer);
      mockCharacterRepository.findOne.mockResolvedValue(mockCharacter);
      mockGuessRepository.create.mockReturnValue(mockGuess);
      mockGuessRepository.save.mockResolvedValue(mockGuess);
      mockPlayerSecretRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      });

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      const result = await service.submitGuess('ABC12', request);

      expect(result).toBeDefined();
      expect(result.isCorrect).toBe(true);
      expect(result.guessedByPlayerId).toBe('player-1');
      expect(result.targetPlayerId).toBe('player-2');
      expect(result.targetCharacterId).toBe('char-1');
      expect(mockPlayerSecretRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'revealed',
        }),
      );
    });

    it('should successfully submit an incorrect guess', async () => {
      const mockCorrectCharacter: Character = {
        id: 'char-1',
        name: 'Character 1',
      } as Character;

      const mockGuessedCharacter: Character = {
        id: 'char-2',
        name: 'Character 2',
      } as Character;

      const mockPlayerSecret: PlayerSecret = {
        id: 'secret-1',
        character: mockCorrectCharacter,
        status: 'hidden' as any,
      } as PlayerSecret;

      const mockGuessingPlayer: GamePlayer = {
        id: 'player-1',
        username: 'Guesser',
        game: { id: 'game-123' } as Game,
        leftAt: null,
      } as GamePlayer;

      const mockTargetPlayer: GamePlayer = {
        id: 'player-2',
        username: 'Target',
        game: { id: 'game-123' } as Game,
        secret: mockPlayerSecret,
        leftAt: null,
      } as GamePlayer;

      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_question' as any,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [mockGuessingPlayer, mockTargetPlayer],
      } as Game;

      const mockGuess: Guess = {
        id: 'guess-123',
        round: mockRound,
        guessedBy: mockGuessingPlayer,
        targetPlayer: mockTargetPlayer,
        targetCharacter: mockGuessedCharacter,
        isCorrect: false,
        latencyMs: null,
        guessedAt: new Date(),
      } as Guess;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(mockGuessingPlayer)
        .mockResolvedValueOnce(mockTargetPlayer);
      mockCharacterRepository.findOne.mockResolvedValue(mockGuessedCharacter);
      mockGuessRepository.create.mockReturnValue(mockGuess);
      mockGuessRepository.save.mockResolvedValue(mockGuess);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-2',
      };

      const result = await service.submitGuess('ABC12', request);

      expect(result).toBeDefined();
      expect(result.isCorrect).toBe(false);
      expect(result.guessedByPlayerId).toBe('player-1');
      expect(result.targetPlayerId).toBe('player-2');
      expect(result.targetCharacterId).toBe('char-2');
      expect(mockPlayerSecretRepository.save).not.toHaveBeenCalled();
    });

    it('should mark game as completed when only 1 unrevealed player remains', async () => {
      const mockCharacter: Character = {
        id: 'char-1',
        name: 'Character 1',
      } as Character;

      const mockPlayerSecret: PlayerSecret = {
        id: 'secret-1',
        character: mockCharacter,
        status: 'hidden' as any,
      } as PlayerSecret;

      const mockGuessingPlayer: GamePlayer = {
        id: 'player-1',
        username: 'Guesser',
        game: { id: 'game-123' } as Game,
        leftAt: null,
      } as GamePlayer;

      const mockTargetPlayer: GamePlayer = {
        id: 'player-2',
        username: 'Target',
        game: { id: 'game-123' } as Game,
        secret: mockPlayerSecret,
        leftAt: null,
      } as GamePlayer;

      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
        state: 'awaiting_question' as any,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [mockGuessingPlayer, mockTargetPlayer],
      } as Game;

      const mockGuess: Guess = {
        id: 'guess-123',
        round: mockRound,
        guessedBy: mockGuessingPlayer,
        targetPlayer: mockTargetPlayer,
        targetCharacter: mockCharacter,
        isCorrect: true,
        latencyMs: null,
        guessedAt: new Date(),
      } as Guess;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(mockGuessingPlayer)
        .mockResolvedValueOnce(mockTargetPlayer);
      mockPlayerRepository.find.mockResolvedValue([mockGuessingPlayer, mockTargetPlayer]);
      mockPlayerRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockGuessingPlayer, mockTargetPlayer]),
      });
      mockCharacterRepository.findOne.mockResolvedValue(mockCharacter);
      mockGuessRepository.create.mockReturnValue(mockGuess);
      mockGuessRepository.save.mockResolvedValue(mockGuess);
      mockRoundRepository.findOne.mockResolvedValue(mockRound);
      mockPlayerSecretRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      });
      mockPlayerStatsRepository.findOne.mockResolvedValue(null);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      await service.submitGuess('ABC12', request);

      expect(mockGameRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: GameStatus.COMPLETED,
          endedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if game not found', async () => {
      mockGameRepository.findOne.mockResolvedValue(null);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      await expect(service.submitGuess('ABC12', request)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if game is not in progress', async () => {
      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.COMPLETED,
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      await expect(service.submitGuess('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if guesser player not found', async () => {
      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne.mockResolvedValue(null);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      await expect(service.submitGuess('ABC12', request)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if guesser is not in the game', async () => {
      const mockPlayer: GamePlayer = {
        id: 'player-1',
        username: 'Guesser',
        game: { id: 'different-game' } as Game,
      } as GamePlayer;

      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      await expect(service.submitGuess('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if target character not found', async () => {
      const mockGuessingPlayer: GamePlayer = {
        id: 'player-1',
        username: 'Guesser',
        game: { id: 'game-123' } as Game,
      } as GamePlayer;

      const mockTargetPlayer: GamePlayer = {
        id: 'player-2',
        username: 'Target',
        game: { id: 'game-123' } as Game,
      } as GamePlayer;

      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(mockGuessingPlayer)
        .mockResolvedValueOnce(mockTargetPlayer);
      mockCharacterRepository.findOne.mockResolvedValue(null);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      await expect(service.submitGuess('ABC12', request)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if guessing own character', async () => {
      const mockGuessingPlayer: GamePlayer = {
        id: 'player-1',
        username: 'Guesser',
        game: { id: 'game-123' } as Game,
      } as GamePlayer;

      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(mockGuessingPlayer)
        .mockResolvedValueOnce(mockGuessingPlayer);
      mockCharacterRepository.findOne.mockResolvedValue({
        id: 'char-1',
        name: 'Character 1',
      } as Character);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-1',
        targetCharacterId: 'char-1',
      };

      await expect(service.submitGuess('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException if target player has no secret', async () => {
      const mockCharacter: Character = {
        id: 'char-1',
        name: 'Character 1',
      } as Character;

      const mockGuessingPlayer: GamePlayer = {
        id: 'player-1',
        username: 'Guesser',
        game: { id: 'game-123' } as Game,
      } as GamePlayer;

      const mockTargetPlayer: GamePlayer = {
        id: 'player-2',
        username: 'Target',
        game: { id: 'game-123' } as Game,
        secret: null,
      } as GamePlayer;

      const mockRound: Round = {
        id: 'round-123',
        roundNumber: 1,
      } as Round;

      const mockGame: Game = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(mockGuessingPlayer)
        .mockResolvedValueOnce(mockTargetPlayer);
      mockCharacterRepository.findOne.mockResolvedValue(mockCharacter);

      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      await expect(service.submitGuess('ABC12', request)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
