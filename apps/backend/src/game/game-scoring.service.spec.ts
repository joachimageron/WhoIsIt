import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
import {
  GameStatus,
  PlayerSecretStatus,
  QuestionCategory,
  AnswerType,
  AnswerValue,
  RoundState,
} from '../database/enums';

describe('GameService - Scoring and Game End', () => {
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

  describe('Score Calculation', () => {
    it('should award points for asking a question', async () => {
      const mockPlayer = {
        id: 'player-1',
        username: 'Asker',
        score: 0,
      } as GamePlayer;

      const mockRound = {
        id: 'round-1',
        roundNumber: 1,
        state: RoundState.AWAITING_QUESTION,
        activePlayer: mockPlayer,
      } as Round;

      const mockGame = {
        id: 'game-1',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      } as Game;

      const mockQuestion = {
        id: 'question-1',
        round: mockRound,
        askedBy: mockPlayer,
        questionText: 'Does your character have glasses?',
        category: QuestionCategory.DIRECT,
        answerType: AnswerType.BOOLEAN,
        askedAt: new Date(),
      } as Question;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);
      mockQuestionRepository.create.mockReturnValue(mockQuestion);
      mockQuestionRepository.save.mockResolvedValue(mockQuestion);

      await service.askQuestion('ABC12', {
        playerId: 'player-1',
        questionText: 'Does your character have glasses?',
        category: 'direct',
        answerType: 'boolean',
      });

      expect(mockPlayerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 10, // SCORE_QUESTION_BONUS
        }),
      );
    });

    it('should award points for submitting an answer', async () => {
      const mockAnsweringPlayer = {
        id: 'player-2',
        username: 'Answerer',
        score: 0,
        game: { id: 'game-1' } as Game,
        secret: {
          character: {
            id: 'char-1',
          },
        },
      } as unknown as GamePlayer;

      const mockQuestion = {
        id: 'question-1',
        questionText: 'Does your character have glasses?',
        category: QuestionCategory.DIRECT,
        answerType: AnswerType.BOOLEAN,
        askedBy: { id: 'player-1' } as GamePlayer,
        targetPlayer: mockAnsweringPlayer,
        answers: [],
        round: {
          id: 'round-1',
          roundNumber: 1,
          state: RoundState.AWAITING_ANSWER,
        } as Round,
      } as unknown as Question;

      const mockRound = {
        id: 'round-1',
        roundNumber: 1,
        state: RoundState.AWAITING_ANSWER,
        activePlayer: { id: 'player-1' } as GamePlayer,
      } as Round;

      const mockGame = {
        id: 'game-1',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [mockAnsweringPlayer],
      } as Game;

      const mockAnswer = {
        id: 'answer-1',
        question: mockQuestion,
        answeredBy: mockAnsweringPlayer,
        answerValue: AnswerValue.YES,
        answeredAt: new Date(),
      } as Answer;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion);
      mockPlayerRepository.findOne.mockResolvedValue(mockAnsweringPlayer);
      mockAnswerRepository.create.mockReturnValue(mockAnswer);
      mockAnswerRepository.save.mockResolvedValue(mockAnswer);

      await service.submitAnswer('ABC12', {
        playerId: 'player-2',
        questionId: 'question-1',
        answerValue: 'yes',
      });

      expect(mockPlayerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 5, // SCORE_ANSWER_BONUS
        }),
      );
    });

    it('should award 1000 points for correct guess', async () => {
      const mockGuessingPlayer = {
        id: 'player-1',
        username: 'Guesser',
        score: 100,
        game: { id: 'game-1' } as Game,
      } as GamePlayer;

      const mockTargetPlayer = {
        id: 'player-2',
        username: 'Target',
        game: { id: 'game-1' } as Game,
        secret: {
          character: { id: 'char-1' } as Character,
          status: PlayerSecretStatus.HIDDEN,
        } as PlayerSecret,
      } as GamePlayer;

      const mockCharacter = {
        id: 'char-1',
        name: 'Character 1',
      } as Character;

      const mockRound = {
        id: 'round-1',
        roundNumber: 1,
      } as Round;

      const mockGame = {
        id: 'game-1',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [mockGuessingPlayer, mockTargetPlayer],
      } as Game;

      const mockGuess = {
        id: 'guess-1',
        round: mockRound,
        guessedBy: mockGuessingPlayer,
        targetPlayer: mockTargetPlayer,
        targetCharacter: mockCharacter,
        isCorrect: true,
        guessedAt: new Date(),
      } as Guess;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(mockGuessingPlayer)
        .mockResolvedValueOnce(mockTargetPlayer);
      mockPlayerRepository.find.mockResolvedValue([mockGuessingPlayer, mockTargetPlayer]); // For updatePlayerStatistics
      mockCharacterRepository.findOne.mockResolvedValue(mockCharacter);
      mockGuessRepository.create.mockReturnValue(mockGuess);
      mockGuessRepository.save.mockResolvedValue(mockGuess);
      mockRoundRepository.findOne.mockResolvedValue(mockRound);
      mockPlayerRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockGuessingPlayer, mockTargetPlayer]),
      });
      mockPlayerSecretRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1), // Only 1 unrevealed player left
      });
      mockPlayerStatsRepository.findOne.mockResolvedValue(null);

      await service.submitGuess('ABC12', {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      });

      // Should save player with updated score
      expect(mockPlayerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 1100, // 100 + 1000 (SCORE_CORRECT_GUESS)
        }),
      );
    });
  });

  describe('Game End Detection', () => {
    it('should end game when only 1 unrevealed player remains', async () => {
      const mockWinner = {
        id: 'player-1',
        username: 'Winner',
        score: 1000,
        game: { id: 'game-1' } as Game,
        user: { id: 'user-1' } as User,
      } as GamePlayer;

      const mockLoser = {
        id: 'player-2',
        username: 'Loser',
        score: 50,
        game: { id: 'game-1' } as Game,
        secret: {
          character: { id: 'char-2' } as Character,
          status: PlayerSecretStatus.REVEALED,
        } as PlayerSecret,
      } as GamePlayer;

      const mockRound = {
        id: 'round-1',
        roundNumber: 1,
      } as Round;

      const mockGame = {
        id: 'game-1',
        roomCode: 'ABC12',
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
        players: [mockWinner, mockLoser],
        startedAt: new Date(),
      } as Game;

      const mockCharacter = {
        id: 'char-2',
        name: 'Character 2',
      } as Character;

      const mockGuess = {
        id: 'guess-1',
        round: mockRound,
        guessedBy: mockWinner,
        targetPlayer: mockLoser,
        targetCharacter: mockCharacter,
        isCorrect: true,
        guessedAt: new Date(),
      } as Guess;

      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(mockWinner)
        .mockResolvedValueOnce(mockLoser);
      mockPlayerRepository.find.mockResolvedValue([mockWinner, mockLoser]); // For updatePlayerStatistics
      mockCharacterRepository.findOne.mockResolvedValue(mockCharacter);
      mockGuessRepository.create.mockReturnValue(mockGuess);
      mockGuessRepository.save.mockResolvedValue(mockGuess);
      mockRoundRepository.findOne.mockResolvedValue(mockRound);
      mockPlayerRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockWinner, mockLoser]),
      });
      mockPlayerSecretRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1), // Only 1 unrevealed player left
      });
      mockPlayerStatsRepository.findOne.mockResolvedValue(null);
      mockPlayerStatsRepository.create.mockReturnValue({
        userId: 'user-1',
        user: mockWinner.user,
        gamesPlayed: 0,
        gamesWon: 0,
        totalQuestions: 0,
        totalGuesses: 0,
        fastestWinSeconds: null,
        streak: 0,
      } as PlayerStats);

      await service.submitGuess('ABC12', {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-2',
      });

      // Should mark game as completed
      expect(mockGameRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: GameStatus.COMPLETED,
          endedAt: expect.any(Date),
          winner: mockWinner.user,
        }),
      );
    });
  });

  describe('Player Statistics', () => {
    it('should update player statistics when game ends', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'TestUser',
      } as User;

      const mockWinningPlayer = {
        id: 'player-1',
        username: 'Winner',
        score: 1000,
        game: { id: 'game-1', startedAt: new Date(), endedAt: new Date() } as Game,
        user: mockUser,
        askedQuestions: [
          { id: 'q1' } as Question,
          { id: 'q2' } as Question,
        ],
        answers: [
          { id: 'a1' } as Answer,
        ],
        guesses: [
          { id: 'g1', isCorrect: true } as Guess,
        ],
      } as GamePlayer;

      const mockStats = {
        userId: mockUser.id,
        user: mockUser,
        gamesPlayed: 5,
        gamesWon: 2,
        totalQuestions: 10,
        totalGuesses: 8,
        fastestWinSeconds: 300,
        streak: 1,
      } as PlayerStats;

      mockPlayerRepository.find.mockResolvedValue([mockWinningPlayer]);
      mockPlayerStatsRepository.findOne.mockResolvedValue(mockStats);
      mockPlayerStatsRepository.save.mockResolvedValue(mockStats);

    });
  });

  describe('getGameOverResult', () => {
    it('should return complete game results with player statistics', async () => {
      const mockUser1 = { id: 'user-1', username: 'Winner' } as User;
      const mockUser2 = { id: 'user-2', username: 'Second' } as User;

      const mockPlayer1 = {
        id: 'player-1',
        username: 'Winner',
        score: 1100,
        placement: 1,
        user: mockUser1,
        askedQuestions: [{ id: 'q1' }, { id: 'q2' }],
        answers: [{ id: 'a1' }],
        guesses: [{ id: 'g1', isCorrect: true }],
        joinedAt: new Date(Date.now() - 300000),
        leftAt: null,
      } as GamePlayer;

      const mockPlayer2 = {
        id: 'player-2',
        username: 'Second',
        score: 50,
        placement: 2,
        user: mockUser2,
        askedQuestions: [{ id: 'q3' }],
        answers: [{ id: 'a2' }, { id: 'a3' }],
        guesses: [{ id: 'g2', isCorrect: false }],
        joinedAt: new Date(Date.now() - 280000),
        leftAt: null,
      } as GamePlayer;

      const mockGame = {
        id: 'game-1',
        roomCode: 'ABC12',
        status: GameStatus.COMPLETED,
        winner: mockUser1,
        startedAt: new Date(Date.now() - 300000), // 5 minutes ago
        endedAt: new Date(),
        players: [mockPlayer1, mockPlayer2],
        rounds: [
          { id: 'round-1', roundNumber: 1 },
          { id: 'round-2', roundNumber: 2 },
        ],
      } as Game;

      mockGameRepository.findOne.mockResolvedValue(mockGame);

      const result = await service.getGameOverResult('ABC12');

      expect(result).toEqual({
        gameId: 'game-1',
        roomCode: 'ABC12',
        winnerId: 'user-1',
        winnerUsername: 'Winner',
        totalRounds: 2,
        gameDurationSeconds: expect.any(Number),
        endReason: 'victory',
        players: [
          {
            playerId: 'player-1',
            playerUsername: 'Winner',
            userId: 'user-1',
            score: 1100,
            questionsAsked: 2,
            questionsAnswered: 1,
            correctGuesses: 1,
            incorrectGuesses: 0,
            timePlayedSeconds: expect.any(Number),
            isWinner: true,
            placement: 1,
            leftAt: undefined,
          },
          {
            playerId: 'player-2',
            playerUsername: 'Second',
            userId: 'user-2',
            score: 50,
            questionsAsked: 1,
            questionsAnswered: 2,
            correctGuesses: 0,
            incorrectGuesses: 1,
            timePlayedSeconds: expect.any(Number),
            isWinner: false,
            placement: 2,
            leftAt: undefined,
          },
        ],
      });
    });
  });
});
