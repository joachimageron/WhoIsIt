import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GameStatsService } from '../services/game-stats.service';
import { GameLobbyService } from '../services/game-lobby.service';
import {
  Game,
  GamePlayer,
  PlayerStats,
  PlayerSecret,
  Round,
} from '../../database/entities';
import { GameStatus, PlayerSecretStatus, RoundState } from '../../database/enums';

describe('GameStatsService', () => {
  let service: GameStatsService;
  let gameRepository: any;
  let playerRepository: any;
  let playerStatsRepository: any;
  let playerSecretRepository: any;
  let roundRepository: any;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    isGuest: false,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlayer = {
    id: 'player-1',
    username: 'testplayer',
    user: mockUser,
    game: null as any,
    role: 'player',
    isReady: true,
    joinedAt: new Date(),
    score: 100,
    askedQuestions: [],
    answers: [],
    guesses: [],
  } as GamePlayer;

  const mockGame = {
    id: 'game-1',
    roomCode: 'ABC12',
    status: GameStatus.IN_PROGRESS,
    players: [mockPlayer],
  } as Game;

  beforeEach(async () => {
    gameRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    playerRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    playerStatsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    playerSecretRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        innerJoin: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getOne: jest.fn().mockResolvedValue(null),
      })),
    };

    roundRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockGameLobbyService = {
      normalizeRoomCode: jest.fn((code: string) => code.trim().toUpperCase()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameStatsService,
        {
          provide: getRepositoryToken(Game),
          useValue: gameRepository,
        },
        {
          provide: getRepositoryToken(GamePlayer),
          useValue: playerRepository,
        },
        {
          provide: getRepositoryToken(PlayerStats),
          useValue: playerStatsRepository,
        },
        {
          provide: getRepositoryToken(PlayerSecret),
          useValue: playerSecretRepository,
        },
        {
          provide: getRepositoryToken(Round),
          useValue: roundRepository,
        },
        {
          provide: GameLobbyService,
          useValue: mockGameLobbyService,
        },
      ],
    }).compile();

    service = module.get<GameStatsService>(GameStatsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAndHandleGameEnd', () => {
    it('should return false if game not ended', async () => {
      const game = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
      };

      // Mock more than 1 unrevealed player
      playerSecretRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
        getOne: jest.fn().mockResolvedValue(null),
      });

      const result = await service.checkAndHandleGameEnd(game, null);

      expect(result).toBe(false);
    });

    it('should end game when only one player remains with unrevealed secret', async () => {
      const winner = {
        id: 'player-1',
        username: 'winner',
        user: mockUser,
        game: mockGame,
        role: 'player',
        isReady: true,
        joinedAt: new Date(),
        score: 0,
        askedQuestions: [],
        answers: [],
        guesses: [],
      } as GamePlayer;

      const mockSecret = {
        id: 'secret-1',
        player: winner,
        character: { id: 'char-1' },
        status: PlayerSecretStatus.HIDDEN,
      } as PlayerSecret;

      const game = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
      };

      // Mock 1 unrevealed player
      playerSecretRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getOne: jest.fn().mockResolvedValue(mockSecret),
      });

      gameRepository.save.mockResolvedValue(game);
      roundRepository.findOne.mockResolvedValue(null);
      playerRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([winner]),
      });
      playerRepository.find.mockResolvedValue([winner]);
      playerRepository.save.mockResolvedValue(winner);
      playerStatsRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        gamesPlayed: 0,
        gamesWon: 0,
        totalQuestions: 0,
        totalGuesses: 0,
      });
      playerStatsRepository.save.mockResolvedValue({});

      const result = await service.checkAndHandleGameEnd(game, null);

      expect(result).toBe(true);
      expect(gameRepository.save).toHaveBeenCalled();
    });

    it('should end game when winner provided', async () => {
      const winner = {
        id: 'player-1',
        username: 'winner',
        user: mockUser,
        game: mockGame,
        role: 'player',
        isReady: true,
        joinedAt: new Date(),
        score: 0,
        askedQuestions: [],
        answers: [],
        guesses: [],
      } as GamePlayer;

      const game = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
      };

      // Mock 1 unrevealed player
      playerSecretRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getOne: jest.fn().mockResolvedValue(null),
      });

      gameRepository.save.mockResolvedValue(game);
      roundRepository.findOne.mockResolvedValue(null);
      playerRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([winner]),
      });
      playerRepository.find.mockResolvedValue([winner]);
      playerRepository.save.mockResolvedValue(winner);
      playerStatsRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        gamesPlayed: 0,
        gamesWon: 0,
        totalQuestions: 0,
        totalGuesses: 0,
      });
      playerStatsRepository.save.mockResolvedValue({});

      const result = await service.checkAndHandleGameEnd(game, winner);

      expect(result).toBe(true);
      expect(gameRepository.save).toHaveBeenCalled();
    });
  });

  describe('endGame', () => {
    it('endGame should mark game as completed', async () => {
      const winner = {
        id: 'player-1',
        username: 'winner',
        user: mockUser,
        game: mockGame,
        role: 'player',
        isReady: true,
        joinedAt: new Date(),
        score: 0,
        askedQuestions: [],
        answers: [],
        guesses: [],
      } as GamePlayer;

      const mockRound = {
        id: 'round-1',
        game: mockGame,
        state: RoundState.AWAITING_QUESTION,
        startedAt: new Date('2024-01-01T10:00:00'),
      } as Round;

      roundRepository.findOne.mockResolvedValue(mockRound);
      roundRepository.save.mockResolvedValue(mockRound);
      gameRepository.save.mockResolvedValue(mockGame);
      playerRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([winner]),
      });
      playerRepository.find.mockResolvedValue([winner]);
      playerRepository.save.mockResolvedValue(winner);
      playerStatsRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        gamesPlayed: 0,
        gamesWon: 0,
        totalQuestions: 0,
        totalGuesses: 0,
      });
      playerStatsRepository.save.mockResolvedValue({});

      await service.endGame(mockGame, winner);

      expect(gameRepository.save).toHaveBeenCalled();
      expect(roundRepository.save).toHaveBeenCalled();
      expect(mockRound.state).toBe(RoundState.CLOSED);
    });

    it('should handle game with no current round', async () => {
      const winner = {
        id: 'player-1',
        username: 'winner',
        user: mockUser,
        game: mockGame,
        role: 'player',
        isReady: true,
        joinedAt: new Date(),
        score: 0,
        askedQuestions: [],
        answers: [],
        guesses: [],
      } as GamePlayer;

      roundRepository.findOne.mockResolvedValue(null);
      gameRepository.save.mockResolvedValue(mockGame);
      playerRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([winner]),
      });
      playerRepository.find.mockResolvedValue([winner]);
      playerRepository.save.mockResolvedValue(winner);
      playerStatsRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        gamesPlayed: 0,
        gamesWon: 0,
        totalQuestions: 0,
        totalGuesses: 0,
      });
      playerStatsRepository.save.mockResolvedValue({});

      await service.endGame(mockGame, winner);

      expect(gameRepository.save).toHaveBeenCalled();
      expect(roundRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getGameOverResult', () => {
    it('should return game over result for completed game', async () => {
      const winner = {
        id: 'player-1',
        username: 'winner',
        user: mockUser,
        game: mockGame,
        role: 'player',
        isReady: true,
        score: 1000,
        placement: 1,
        joinedAt: new Date('2024-01-01T10:00:00'),
        leftAt: null,
        askedQuestions: [],
        answers: [],
        guesses: [],
      } as GamePlayer;

      const completedGame = {
        ...mockGame,
        status: GameStatus.COMPLETED,
        players: [winner],
        winner: winner.user,
        startedAt: new Date('2024-01-01T10:00:00'),
        endedAt: new Date('2024-01-01T10:30:00'),
        rounds: [],
      };

      gameRepository.findOne.mockResolvedValue(completedGame);

      const result = await service.getGameOverResult('ABC12');

      expect(result).toBeDefined();
      expect(result.winnerId).toBe('user-1');
      expect(result.players).toHaveLength(1);
      expect(result.roomCode).toBe('ABC12');
    });

    it('should throw NotFoundException if game not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getGameOverResult('invalid-room-code'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle game with no winner', async () => {
      const player1 = {
        id: 'player-1',
        username: 'player1',
        user: null,
        game: mockGame,
        role: 'player',
        isReady: true,
        score: 100,
        placement: 1,
        joinedAt: new Date('2024-01-01T10:00:00'),
        leftAt: null,
        askedQuestions: [],
        answers: [],
        guesses: [],
      } as unknown as GamePlayer;

      const completedGame = {
        ...mockGame,
        status: GameStatus.COMPLETED,
        players: [player1],
        winner: null,
        startedAt: new Date('2024-01-01T10:00:00'),
        endedAt: new Date('2024-01-01T10:30:00'),
        rounds: [],
      };

      gameRepository.findOne.mockResolvedValue(completedGame);

      const result = await service.getGameOverResult('ABC12');

      expect(result).toBeDefined();
      expect(result.winnerId).toBeUndefined();
    });

    it('should sort players by placement', async () => {
      const user1 = { ...mockUser, id: 'user-1' };
      const user2 = { ...mockUser, id: 'user-2' };
      const user3 = { ...mockUser, id: 'user-3' };

      const player1 = {
        id: 'player-1',
        username: 'first',
        user: user1,
        game: mockGame,
        role: 'player',
        isReady: true,
        score: 1000,
        placement: 1,
        joinedAt: new Date('2024-01-01T10:00:00'),
        leftAt: null,
        askedQuestions: [],
        answers: [],
        guesses: [],
      } as GamePlayer;

      const player2 = {
        id: 'player-2',
        username: 'second',
        user: user2,
        game: mockGame,
        role: 'player',
        isReady: true,
        score: 500,
        placement: 2,
        joinedAt: new Date('2024-01-01T10:00:00'),
        leftAt: null,
        askedQuestions: [],
        answers: [],
        guesses: [],
      } as GamePlayer;

      const player3 = {
        id: 'player-3',
        username: 'third',
        user: user3,
        game: mockGame,
        role: 'player',
        isReady: true,
        score: 250,
        placement: 3,
        joinedAt: new Date('2024-01-01T10:00:00'),
        leftAt: null,
        askedQuestions: [],
        answers: [],
        guesses: [],
      } as GamePlayer;

      const completedGame = {
        ...mockGame,
        status: GameStatus.COMPLETED,
        players: [player2, player3, player1], // Out of order
        winner: player1.user,
        startedAt: new Date('2024-01-01T10:00:00'),
        endedAt: new Date('2024-01-01T10:30:00'),
        rounds: [],
      };

      gameRepository.findOne.mockResolvedValue(completedGame);

      const result = await service.getGameOverResult('ABC12');

      expect(result.players).toHaveLength(3);
      expect(result.players[0].placement).toBe(1);
      expect(result.players[1].placement).toBe(2);
      expect(result.players[2].placement).toBe(3);
    });
  });
});
