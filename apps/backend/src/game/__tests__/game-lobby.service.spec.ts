import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GameLobbyService } from '../services/game-lobby.service';
import {
  CharacterSet,
  Game,
  GamePlayer,
  User,
} from '../../database/entities';
import {
  GamePlayerRole,
  GameStatus,
  GameVisibility,
} from '../../database/enums';

describe('GameLobbyService', () => {
  let service: GameLobbyService;
  let gameRepository: any;
  let playerRepository: any;
  let characterSetRepository: any;
  let userRepository: any;

  const mockCharacterSet = {
    id: 'char-set-1',
    name: 'Test Characters',
  } as CharacterSet;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    avatarUrl: 'http://example.com/avatar.jpg',
  } as User;

  const mockGame = {
    id: 'game-1',
    roomCode: 'ABC12',
    status: GameStatus.LOBBY,
    visibility: GameVisibility.PRIVATE,
    characterSet: mockCharacterSet,
    host: mockUser,
    turnTimerSeconds: 60,
    ruleConfig: {},
    createdAt: new Date('2024-01-01'),
    players: [],
  } as Game;

  beforeEach(async () => {
    gameRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      exists: jest.fn(),
    };

    playerRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    characterSetRepository = {
      findOne: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameLobbyService,
        {
          provide: getRepositoryToken(Game),
          useValue: gameRepository,
        },
        {
          provide: getRepositoryToken(GamePlayer),
          useValue: playerRepository,
        },
        {
          provide: getRepositoryToken(CharacterSet),
          useValue: characterSetRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<GameLobbyService>(GameLobbyService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizeRoomCode', () => {
    it('should normalize room code to uppercase and trimmed', () => {
      expect(service.normalizeRoomCode('  abc12  ')).toBe('ABC12');
      expect(service.normalizeRoomCode('xyz99')).toBe('XYZ99');
      expect(service.normalizeRoomCode('HELLO')).toBe('HELLO');
    });
  });

  describe('createGame', () => {
    it('should create a game with authenticated host', async () => {
      const request = {
        characterSetId: 'char-set-1',
        visibility: 'private' as const,
        turnTimerSeconds: 60,
        ruleConfig: {},
      };

      characterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      userRepository.findOne.mockResolvedValue(mockUser);
      gameRepository.exists.mockResolvedValue(false);
      gameRepository.create.mockReturnValue(mockGame);
      gameRepository.save.mockResolvedValue(mockGame);

      const mockHostPlayer = {
        id: 'player-1',
        username: 'testuser',
        role: GamePlayerRole.HOST,
        isReady: true,
        game: mockGame,
        user: mockUser,
      } as GamePlayer;

      playerRepository.create.mockReturnValue(mockHostPlayer);
      playerRepository.save.mockResolvedValue(mockHostPlayer);

      const mockGameWithPlayers = {
        ...mockGame,
        players: [mockHostPlayer],
      };

      gameRepository.findOne.mockResolvedValue(mockGameWithPlayers);

      const result = await service.createGame(request, 'user-1', 'testuser');

      expect(result).toBeDefined();
      expect(result.roomCode).toBeDefined();
      expect(characterSetRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'char-set-1' },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(gameRepository.save).toHaveBeenCalled();
      expect(playerRepository.save).toHaveBeenCalled();
    });

    it('should create a game with guest host', async () => {
      const request = {
        characterSetId: 'char-set-1',
        visibility: 'public' as const,
      };

      characterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      gameRepository.exists.mockResolvedValue(false);

      const mockGuestGame = {
        ...mockGame,
        host: null,
        visibility: GameVisibility.PUBLIC, // Fix: set the correct visibility
      };

      gameRepository.create.mockReturnValue(mockGuestGame);
      gameRepository.save.mockResolvedValue(mockGuestGame);

      const mockGuestPlayer = {
        id: 'player-1',
        username: 'guestuser',
        role: GamePlayerRole.HOST,
        isReady: true,
        game: mockGuestGame,
        user: null,
      } as GamePlayer;

      playerRepository.create.mockReturnValue(mockGuestPlayer);
      playerRepository.save.mockResolvedValue(mockGuestPlayer);

      const mockGameWithPlayers = {
        ...mockGuestGame,
        players: [mockGuestPlayer],
      };

      gameRepository.findOne.mockResolvedValue(mockGameWithPlayers);

      const result = await service.createGame(request, undefined, 'guestuser');

      expect(result).toBeDefined();
      expect(result.visibility).toBe(GameVisibility.PUBLIC);
    });

    it('should throw NotFoundException if character set not found', async () => {
      const request = {
        characterSetId: 'invalid-id',
      };

      characterSetRepository.findOne.mockResolvedValue(null);

      await expect(service.createGame(request, undefined, 'testuser')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createGame(request, undefined, 'testuser')).rejects.toThrow(
        'Character set not found',
      );
    });

    it('should throw NotFoundException if host user not found', async () => {
      const request = {
        characterSetId: 'char-set-1',
      };

      characterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.createGame(request, 'invalid-user-id', 'testuser')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createGame(request, 'invalid-user-id', 'testuser')).rejects.toThrow(
        'Host user not found',
      );
    });

    it('should throw BadRequestException if no host username provided', async () => {
      const request = {
        characterSetId: 'char-set-1',
      };

      characterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      gameRepository.exists.mockResolvedValue(false);
      gameRepository.create.mockReturnValue(mockGame);
      gameRepository.save.mockResolvedValue(mockGame);

      await expect(service.createGame(request, undefined, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle room code generation retry logic', async () => {
      const request = {
        characterSetId: 'char-set-1',
      };

      characterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      // First attempt fails (room code exists), second succeeds
      gameRepository.exists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      gameRepository.create.mockReturnValue(mockGame);
      gameRepository.save.mockResolvedValue(mockGame);

      const mockHostPlayer = {
        id: 'player-1',
        username: 'testuser',
        role: GamePlayerRole.HOST,
      } as GamePlayer;

      playerRepository.create.mockReturnValue(mockHostPlayer);
      playerRepository.save.mockResolvedValue(mockHostPlayer);

      gameRepository.findOne.mockResolvedValue({
        ...mockGame,
        players: [mockHostPlayer],
      });

      const result = await service.createGame(request, undefined, 'testuser');

      expect(result).toBeDefined();
      expect(gameRepository.exists).toHaveBeenCalledTimes(2);
    });

    it('should throw InternalServerErrorException after max room code attempts', async () => {
      const request = {
        characterSetId: 'char-set-1',
      };

      characterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      // All attempts fail
      gameRepository.exists.mockResolvedValue(true);

      await expect(service.createGame(request, undefined, 'testuser')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.createGame(request, undefined, 'testuser')).rejects.toThrow(
        'Unable to allocate a room code',
      );
    });

    it('should validate turnTimerSeconds is finite', async () => {
      const request = {
        characterSetId: 'char-set-1',
        turnTimerSeconds: Infinity,
      };

      characterSetRepository.findOne.mockResolvedValue(mockCharacterSet);

      await expect(service.createGame(request, undefined, 'testuser')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createGame(request, undefined, 'testuser')).rejects.toThrow(
        'Numeric fields must be finite numbers',
      );
    });
  });

  describe('joinGame', () => {
    it('should allow a new player to join', async () => {
      const request = {};

      const mockGameWithPlayers = {
        ...mockGame,
        players: [
          {
            id: 'player-1',
            username: 'host',
            role: GamePlayerRole.HOST,
            leftAt: null,
          } as GamePlayer,
        ],
      };

      // First call for the initial join check
      gameRepository.findOne.mockResolvedValueOnce(mockGameWithPlayers);

      const newPlayer = {
        id: 'player-2',
        username: 'newplayer',
        role: GamePlayerRole.PLAYER,
      } as GamePlayer;

      playerRepository.create.mockReturnValue(newPlayer);
      playerRepository.save.mockResolvedValue(newPlayer);

      // Second call for loading the lobby after join
      gameRepository.findOne.mockResolvedValueOnce({
        ...mockGameWithPlayers,
        players: [...mockGameWithPlayers.players, newPlayer],
      });

      const result = await service.joinGame('ABC12', request, undefined, 'newplayer');

      expect(result).toBeDefined();
      expect(playerRepository.create).toHaveBeenCalled();
      expect(playerRepository.save).toHaveBeenCalled();
    });

    it('should allow a player to rejoin after leaving', async () => {
      const request = {};

      const leftPlayer = {
        id: 'player-2',
        username: 'rejoinplayer',
        role: GamePlayerRole.PLAYER,
        leftAt: new Date('2024-01-02'),
        user: null,
      } as GamePlayer;

      const mockGameWithPlayers = {
        ...mockGame,
        players: [
          {
            id: 'player-1',
            username: 'host',
            role: GamePlayerRole.HOST,
            leftAt: null,
          } as GamePlayer,
          leftPlayer,
        ],
      };

      // First call for the initial join check
      gameRepository.findOne.mockResolvedValueOnce(mockGameWithPlayers);
      playerRepository.save.mockResolvedValue({
        ...leftPlayer,
        leftAt: null,
        isReady: false,
      });

      // Second call for loading the lobby after rejoin
      gameRepository.findOne.mockResolvedValueOnce({
        ...mockGameWithPlayers,
        players: [
          mockGameWithPlayers.players[0],
          { ...leftPlayer, leftAt: null },
        ],
      });

      const result = await service.joinGame('ABC12', request, undefined, 'rejoinplayer');

      expect(result).toBeDefined();
      expect(playerRepository.save).toHaveBeenCalled();
      // Check that leftAt was cleared and isReady was set to false
      const savedPlayer = (playerRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedPlayer.leftAt).toBeNull();
      expect(savedPlayer.isReady).toBe(false);
    });

    it('should return current state if player already in game', async () => {
      const request = {};

      const existingPlayer = {
        id: 'player-2',
        username: 'existingplayer',
        user: { id: 'user-2' } as User,
        leftAt: null,
      } as GamePlayer;

      const mockGameWithPlayers = {
        ...mockGame,
        players: [existingPlayer],
      };

      gameRepository.findOne.mockResolvedValue(mockGameWithPlayers);
      userRepository.findOne.mockResolvedValue({ id: 'user-2' } as User);

      const result = await service.joinGame('ABC12', request, 'user-2', 'existingplayer');

      expect(result).toBeDefined();
      expect(playerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if game not found', async () => {
      const request = {};

      gameRepository.findOne.mockResolvedValue(null);

      await expect(service.joinGame('INVALID', request, undefined, 'testuser')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.joinGame('INVALID', request, undefined, 'testuser')).rejects.toThrow(
        'Game not found',
      );
    });

    it('should throw BadRequestException if game is not in lobby', async () => {
      const request = {};

      const activeGame = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
      };

      gameRepository.findOne.mockResolvedValue(activeGame);

      await expect(service.joinGame('ABC12', request, undefined, 'testuser')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.joinGame('ABC12', request, undefined, 'testuser')).rejects.toThrow(
        'Game is not joinable',
      );
    });

    it('should throw BadRequestException if game is full (2 players)', async () => {
      const request = {};

      const fullGame = {
        ...mockGame,
        players: [
          {
            id: 'player-1',
            leftAt: null,
          } as GamePlayer,
          {
            id: 'player-2',
            leftAt: null,
          } as GamePlayer,
        ],
      };

      gameRepository.findOne.mockResolvedValue(fullGame);

      await expect(service.joinGame('ABC12', request, undefined, 'newplayer')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.joinGame('ABC12', request, undefined, 'newplayer')).rejects.toThrow(
        'Game is full (maximum 2 players)',
      );
    });

    it('should throw BadRequestException if no username provided', async () => {
      const request = {};

      gameRepository.findOne.mockResolvedValue(mockGame);

      await expect(service.joinGame('ABC12', request, undefined, '')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.joinGame('ABC12', request, undefined, '')).rejects.toThrow(
        'A username is required',
      );
    });

    it('should handle avatar URL for authenticated users', async () => {
      const request = {
        avatarUrl: 'custom-avatar.jpg',
      };

      gameRepository.findOne.mockResolvedValue({ ...mockGame, players: [] });
      userRepository.findOne.mockResolvedValue(mockUser);

      const newPlayer = {
        id: 'player-2',
        username: 'testuser',
        avatarUrl: 'custom-avatar.jpg',
      } as GamePlayer;

      playerRepository.create.mockReturnValue(newPlayer);
      playerRepository.save.mockResolvedValue(newPlayer);

      gameRepository.findOne.mockResolvedValue({
        ...mockGame,
        players: [newPlayer],
      });

      await service.joinGame('ABC12', request, 'user-1', 'testuser');

      expect(playerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: 'custom-avatar.jpg',
        }),
      );
    });

    it('should normalize room code when joining', async () => {
      const request = {};

      gameRepository.findOne.mockResolvedValue(mockGame);
      playerRepository.create.mockReturnValue({} as GamePlayer);
      playerRepository.save.mockResolvedValue({} as GamePlayer);
      gameRepository.findOne.mockResolvedValue({ ...mockGame, players: [] });

      await service.joinGame('  abc12  ', request, undefined, 'testuser');

      expect(gameRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roomCode: 'ABC12' },
        }),
      );
    });
  });

  describe('getLobbyByRoomCode', () => {
    it('should return lobby by room code', async () => {
      gameRepository.findOne.mockResolvedValue(mockGame);

      const result = await service.getLobbyByRoomCode('ABC12');

      expect(result).toBeDefined();
      expect(result.roomCode).toBe('ABC12');
    });

    it('should normalize room code', async () => {
      gameRepository.findOne.mockResolvedValue(mockGame);

      await service.getLobbyByRoomCode('  abc12  ');

      expect(gameRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roomCode: 'ABC12' },
        }),
      );
    });

    it('should throw NotFoundException if game not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);

      await expect(service.getLobbyByRoomCode('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePlayerReady', () => {
    it('should update player ready status', async () => {
      const mockPlayer = {
        id: 'player-1',
        isReady: false,
        game: mockGame,
      } as GamePlayer;

      playerRepository.findOne.mockResolvedValue(mockPlayer);
      playerRepository.save.mockResolvedValue({
        ...mockPlayer,
        isReady: true,
      });

      const result = await service.updatePlayerReady('player-1', true);

      expect(result.isReady).toBe(true);
      expect(playerRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if player not found', async () => {
      playerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePlayerReady('invalid-id', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if game not in lobby', async () => {
      const mockPlayer = {
        id: 'player-1',
        game: { ...mockGame, status: GameStatus.IN_PROGRESS },
      } as GamePlayer;

      playerRepository.findOne.mockResolvedValue(mockPlayer);

      await expect(
        service.updatePlayerReady('player-1', true),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updatePlayerReady('player-1', true),
      ).rejects.toThrow('Game is not in lobby state');
    });
  });

  describe('markPlayerAsLeft', () => {
    it('should mark player as left', async () => {
      const mockPlayer = {
        id: 'player-1',
        leftAt: null,
      } as GamePlayer;

      playerRepository.findOne.mockResolvedValue(mockPlayer);
      playerRepository.save.mockResolvedValue({
        ...mockPlayer,
        leftAt: expect.any(Date),
      });

      const result = await service.markPlayerAsLeft('player-1');

      expect(result.leftAt).toBeDefined();
      expect(playerRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if player not found', async () => {
      playerRepository.findOne.mockResolvedValue(null);

      await expect(service.markPlayerAsLeft('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('mapToLobbyResponse', () => {
    it('should map game to lobby response', () => {
      const mockGameWithPlayers = {
        ...mockGame,
        players: [
          {
            id: 'player-1',
            username: 'player1',
            avatarUrl: 'avatar1.jpg',
            role: GamePlayerRole.HOST,
            isReady: true,
            joinedAt: new Date('2024-01-01'),
            leftAt: null,
            user: mockUser,
          } as GamePlayer,
          {
            id: 'player-2',
            username: 'player2',
            avatarUrl: null,
            role: GamePlayerRole.PLAYER,
            isReady: false,
            joinedAt: new Date('2024-01-02'),
            leftAt: null,
            user: null,
          } as GamePlayer,
        ],
      };

      const result = service.mapToLobbyResponse(mockGameWithPlayers);

      expect(result).toBeDefined();
      expect(result.players).toHaveLength(2);
      expect(result.players[0].username).toBe('player1');
      expect(result.players[1].username).toBe('player2');
    });

    it('should filter out players who have left', () => {
      const mockGameWithPlayers = {
        ...mockGame,
        players: [
          {
            id: 'player-1',
            username: 'active',
            leftAt: null,
            joinedAt: new Date('2024-01-01'),
          } as GamePlayer,
          {
            id: 'player-2',
            username: 'left',
            leftAt: new Date('2024-01-02'),
            joinedAt: new Date('2024-01-01'),
          } as GamePlayer,
        ],
      };

      const result = service.mapToLobbyResponse(mockGameWithPlayers);

      expect(result.players).toHaveLength(1);
      expect(result.players[0].username).toBe('active');
    });

    it('should handle games with no players', () => {
      const mockGameNoPlayers = {
        ...mockGame,
        players: [],
      };

      const result = service.mapToLobbyResponse(mockGameNoPlayers);

      expect(result.players).toHaveLength(0);
    });
  });
});
