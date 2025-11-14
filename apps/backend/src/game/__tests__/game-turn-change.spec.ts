import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GamePlayService } from '../services/game-play.service';
import { GameService } from '../services/game.service';
import { GameStatsService } from '../services/game-stats.service';
import {
  Game,
  GamePlayer,
  Round,
  PlayerSecret,
  Character,
  Question,
  Answer,
  Guess,
} from '../../database/entities';
import {
  GameStatus,
  RoundState,
  AnswerValue,
  PlayerSecretStatus,
} from '../../database/enums';
import { GameLobbyService } from '../services/game-lobby.service';

/**
 * Test suite specifically for verifying turn-changing logic
 */
describe('Game Turn Change Logic', () => {
  let gamePlayService: GamePlayService;
  let gameService: GameService;
  let gameRepository: any;
  let playerRepository: any;
  let roundRepository: any;
  let playerSecretRepository: any;
  let characterRepository: any;
  let questionRepository: any;
  let answerRepository: any;
  let guessRepository: any;
  let gameLobbyService: any;
  let gameStatsService: any;

  const mockPlayer1 = {
    id: 'player-1',
    username: 'player1',
    avatarUrl: null,
    leftAt: null,
    score: 0,
    game: { id: 'game-1' },
  } as GamePlayer;

  const mockPlayer2 = {
    id: 'player-2',
    username: 'player2',
    avatarUrl: null,
    leftAt: null,
    score: 0,
    game: { id: 'game-1' },
  } as GamePlayer;

  const mockPlayer3 = {
    id: 'player-3',
    username: 'player3',
    avatarUrl: null,
    leftAt: null,
    score: 0,
    game: { id: 'game-1' },
  } as GamePlayer;

  const mockGame = {
    id: 'game-1',
    roomCode: 'ABC12',
    status: GameStatus.IN_PROGRESS,
    characterSet: { id: 'charset-1' },
    players: [mockPlayer1, mockPlayer2, mockPlayer3],
  } as Game;

  beforeEach(async () => {
    gameRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      manager: {
        findOne: jest.fn(),
      },
    };

    playerRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    roundRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    playerSecretRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    characterRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    questionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    answerRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    guessRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    gameLobbyService = {
      normalizeRoomCode: jest.fn((code: string) => code.trim().toUpperCase()),
    };

    gameStatsService = {
      checkAndHandleGameEnd: jest.fn().mockResolvedValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamePlayService,
        GameService,
        {
          provide: getRepositoryToken(Game),
          useValue: gameRepository,
        },
        {
          provide: getRepositoryToken(GamePlayer),
          useValue: playerRepository,
        },
        {
          provide: getRepositoryToken(Round),
          useValue: roundRepository,
        },
        {
          provide: getRepositoryToken(PlayerSecret),
          useValue: playerSecretRepository,
        },
        {
          provide: getRepositoryToken(Character),
          useValue: characterRepository,
        },
        {
          provide: getRepositoryToken(Question),
          useValue: questionRepository,
        },
        {
          provide: getRepositoryToken(Answer),
          useValue: answerRepository,
        },
        {
          provide: getRepositoryToken(Guess),
          useValue: guessRepository,
        },
        {
          provide: GameLobbyService,
          useValue: gameLobbyService,
        },
        {
          provide: GameStatsService,
          useValue: gameStatsService,
        },
      ],
    }).compile();

    gamePlayService = module.get<GamePlayService>(GamePlayService);
    gameService = module.get<GameService>(GameService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gamePlayService).toBeDefined();
    expect(gameService).toBeDefined();
  });

  describe('Turn changes after asking a question', () => {
    it('should change turn to next player after asking a question', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Is your character wearing glasses?',
      };

      const mockRound = {
        id: 'round-1',
        roundNumber: 1,
        game: mockGame,
        activePlayer: mockPlayer1,
        state: RoundState.AWAITING_QUESTION,
        startedAt: new Date(),
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(mockPlayer1)
        .mockResolvedValueOnce(mockPlayer2);

      const mockQuestion = {
        id: 'question-1',
        round: mockRound,
        askedBy: mockPlayer1,
        targetPlayer: mockPlayer2,
        questionText: 'Is your character wearing glasses?',
      } as Question;

      questionRepository.create.mockReturnValue(mockQuestion);
      questionRepository.save.mockResolvedValue(mockQuestion);
      playerRepository.save.mockResolvedValue(mockPlayer1);

      let savedRound: Round | null = null;
      roundRepository.save.mockImplementation((round: Round) => {
        savedRound = round;
        return Promise.resolve(round);
      });

      await gamePlayService.askQuestion('ABC12', request);

      // Verify round was saved
      expect(roundRepository.save).toHaveBeenCalled();
      expect(savedRound).not.toBeNull();

      // Verify the active player changed to the next player (player-2)
      expect(savedRound?.activePlayer).toBe(mockPlayer2);

      // Verify state changed to AWAITING_ANSWER
      expect(savedRound?.state).toBe(RoundState.AWAITING_ANSWER);
    });
  });

  describe('Turn does NOT change after submitting an answer', () => {
    it('should not change turn after submitting an answer (turn already changed on question)', async () => {
      const request = {
        playerId: 'player-2',
        questionId: 'question-1',
        answerValue: AnswerValue.YES,
      };

      const mockRound = {
        id: 'round-1',
        roundNumber: 1,
        game: mockGame,
        activePlayer: mockPlayer2, // Player 2 is already the active player
        state: RoundState.AWAITING_ANSWER,
        startedAt: new Date(),
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      };

      const mockQuestion = {
        id: 'question-1',
        round: mockRound,
        askedBy: mockPlayer1,
        targetPlayer: mockPlayer2,
        questionText: 'Is your character wearing glasses?',
        answers: [],
      } as Question;

      const answeringPlayerWithSecret = {
        ...mockPlayer2,
        secret: {
          character: {
            id: 'char-1',
            name: 'Character 1',
          },
        },
      } as GamePlayer;

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      questionRepository.findOne.mockResolvedValue(mockQuestion);
      playerRepository.findOne.mockResolvedValue(answeringPlayerWithSecret);

      const mockAnswer = {
        id: 'answer-1',
        question: mockQuestion,
        answeredBy: mockPlayer2,
        answerValue: AnswerValue.YES,
        answeredAt: new Date(),
      } as Answer;

      answerRepository.create.mockReturnValue(mockAnswer);
      answerRepository.save.mockResolvedValue(mockAnswer);
      playerRepository.save.mockResolvedValue(mockPlayer2);

      let savedRound: Round | null = null;
      roundRepository.save.mockImplementation((round: Round) => {
        savedRound = round;
        return Promise.resolve(round);
      });

      await gamePlayService.submitAnswer('ABC12', request);

      // Verify round was saved
      expect(roundRepository.save).toHaveBeenCalled();
      expect(savedRound).not.toBeNull();

      // Verify the active player did NOT change (still player-2)
      expect(savedRound?.activePlayer).toBe(mockPlayer2);

      // Verify state changed back to AWAITING_QUESTION
      expect(savedRound?.state).toBe(RoundState.AWAITING_QUESTION);
    });
  });

  describe('Turn changes after making a guess', () => {
    it('should change turn to next player after making a guess', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      const mockRound = {
        id: 'round-1',
        roundNumber: 1,
        game: mockGame,
        activePlayer: mockPlayer1,
        state: RoundState.AWAITING_QUESTION,
        startedAt: new Date(),
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      };

      const mockCharacter = {
        id: 'char-1',
        name: 'Character 1',
      } as Character;

      const targetPlayerWithSecret = {
        ...mockPlayer2,
        secret: {
          character: mockCharacter,
          status: PlayerSecretStatus.HIDDEN,
        },
      } as GamePlayer;

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(mockPlayer1)
        .mockResolvedValueOnce(targetPlayerWithSecret);
      characterRepository.findOne.mockResolvedValue(mockCharacter);

      const mockGuess = {
        id: 'guess-1',
        round: mockRound,
        guessedBy: mockPlayer1,
        targetPlayer: targetPlayerWithSecret,
        targetCharacter: mockCharacter,
        isCorrect: true,
        guessedAt: new Date(),
      } as Guess;

      guessRepository.create.mockReturnValue(mockGuess);
      guessRepository.save.mockResolvedValue(mockGuess);

      // Mock the guess retrieval for game.service.ts
      gameRepository.manager.findOne.mockResolvedValue({
        ...mockGuess,
        guessedBy: mockPlayer1,
        targetPlayer: targetPlayerWithSecret,
        round: mockRound,
      });

      let savedRound: Round | null = null;
      roundRepository.save.mockImplementation((round: Round) => {
        savedRound = round;
        return Promise.resolve(round);
      });

      playerSecretRepository.save.mockResolvedValue({});
      playerRepository.save.mockResolvedValue(mockPlayer1);
      gameStatsService.checkAndHandleGameEnd.mockResolvedValue(false);

      await gameService.submitGuess('ABC12', request);

      // Verify round was saved (by advanceToNextTurn)
      expect(roundRepository.save).toHaveBeenCalled();
      expect(savedRound).not.toBeNull();

      // Verify the active player changed to the next player (player-2)
      expect(savedRound?.activePlayer).toBe(mockPlayer2);

      // Verify state is set to AWAITING_QUESTION
      expect(savedRound?.state).toBe(RoundState.AWAITING_QUESTION);
    });

    it('should change turn after an incorrect guess that eliminates the player', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-wrong',
      };

      const mockRound = {
        id: 'round-1',
        roundNumber: 1,
        game: mockGame,
        activePlayer: mockPlayer1,
        state: RoundState.AWAITING_QUESTION,
        startedAt: new Date(),
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      };

      const correctCharacter = {
        id: 'char-1',
        name: 'Character 1',
      } as Character;

      const wrongCharacter = {
        id: 'char-wrong',
        name: 'Wrong Character',
      } as Character;

      const targetPlayerWithSecret = {
        ...mockPlayer2,
        secret: {
          character: correctCharacter,
          status: PlayerSecretStatus.HIDDEN,
        },
      } as GamePlayer;

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(mockPlayer1)
        .mockResolvedValueOnce(targetPlayerWithSecret);
      characterRepository.findOne.mockResolvedValue(wrongCharacter);

      const mockGuess = {
        id: 'guess-1',
        round: mockRound,
        guessedBy: mockPlayer1,
        targetPlayer: targetPlayerWithSecret,
        targetCharacter: wrongCharacter,
        isCorrect: false,
        guessedAt: new Date(),
      } as Guess;

      guessRepository.create.mockReturnValue(mockGuess);
      guessRepository.save.mockResolvedValue(mockGuess);

      // Mock the guess retrieval for game.service.ts
      gameRepository.manager.findOne.mockResolvedValue({
        ...mockGuess,
        guessedBy: mockPlayer1,
        targetPlayer: targetPlayerWithSecret,
        round: mockRound,
      });

      let savedRound: Round | null = null;
      roundRepository.save.mockImplementation((round: Round) => {
        savedRound = round;
        return Promise.resolve(round);
      });

      playerRepository.save.mockResolvedValue(mockPlayer1);
      gameStatsService.checkAndHandleGameEnd.mockResolvedValue(false);

      await gameService.submitGuess('ABC12', request);

      // Verify round was saved (by advanceToNextTurn)
      expect(roundRepository.save).toHaveBeenCalled();
      expect(savedRound).not.toBeNull();

      // Verify the active player changed to the next player (player-2, skipping eliminated player-1)
      expect(savedRound?.activePlayer).toBe(mockPlayer2);
    });
  });
});
