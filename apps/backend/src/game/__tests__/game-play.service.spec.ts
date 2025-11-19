import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GamePlayService } from '../services/game-play.service';
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
  PlayerSecretStatus,
  AnswerValue,
} from '../../database/enums';
import { GameLobbyService } from '../services/game-lobby.service';

describe('GamePlayService', () => {
  let service: GamePlayService;
  let gameRepository: any;
  let playerRepository: any;
  let roundRepository: any;
  let playerSecretRepository: any;
  let characterRepository: any;
  let questionRepository: any;
  let answerRepository: any;
  let guessRepository: any;
  let gameLobbyService: any;

  const mockPlayer = {
    id: 'player-1',
    username: 'testplayer',
    avatarUrl: null,
    leftAt: null,
    game: { id: 'game-1' },
  } as GamePlayer;

  const mockGame = {
    id: 'game-1',
    roomCode: 'ABC12',
    status: GameStatus.IN_PROGRESS,
    characterSet: { id: 'charset-1' },
    players: [mockPlayer],
  } as Game;

  const mockRound = {
    id: 'round-1',
    roundNumber: 1,
    game: mockGame,
    activePlayer: mockPlayer,
    state: RoundState.AWAITING_QUESTION,
    startedAt: new Date(),
  } as Round;

  const mockCharacter = {
    id: 'char-1',
    name: 'Test Character',
    imageUrl: 'test.jpg',
    isActive: true,
  } as Character;

  beforeEach(async () => {
    gameRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
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
      count: jest.fn(),
    };

    gameLobbyService = {
      normalizeRoomCode: jest.fn((code: string) => code.trim().toUpperCase()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamePlayService,
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
      ],
    }).compile();

    service = module.get<GamePlayService>(GamePlayService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializeFirstRound', () => {
    it('should create the first round with the first player', async () => {
      const game = {
        ...mockGame,
        players: [mockPlayer],
      };

      roundRepository.create.mockReturnValue(mockRound);
      roundRepository.save.mockResolvedValue(mockRound);

      const result = await service.initializeFirstRound(game);

      expect(result).toBeDefined();
      expect(roundRepository.create).toHaveBeenCalledWith({
        game,
        roundNumber: 1,
        activePlayer: mockPlayer,
        state: RoundState.AWAITING_QUESTION,
        startedAt: expect.any(Date),
      });
      expect(roundRepository.save).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if no players found', async () => {
      const game = {
        ...mockGame,
        players: [],
      };

      await expect(service.initializeFirstRound(game)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.initializeFirstRound(game)).rejects.toThrow(
        'No players found to initialize round',
      );
    });

    it('should throw InternalServerErrorException if players is undefined', async () => {
      const game = {
        ...mockGame,
        players: undefined,
      };

      await expect(service.initializeFirstRound(game)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('assignSecretCharacters', () => {
    it('should assign characters to all players', async () => {
      const player1 = { id: 'player-1', username: 'player1' } as GamePlayer;
      const player2 = { id: 'player-2', username: 'player2' } as GamePlayer;

      const game = {
        ...mockGame,
        players: [player1, player2],
      };

      const char1 = { id: 'char-1', name: 'Character 1' } as Character;
      const char2 = { id: 'char-2', name: 'Character 2' } as Character;

      characterRepository.find.mockResolvedValue([char1, char2]);
      playerSecretRepository.create.mockImplementation((secret) => secret);
      playerSecretRepository.save.mockResolvedValue([]);

      await service.assignSecretCharacters(game);

      expect(characterRepository.find).toHaveBeenCalledWith({
        where: {
          set: { id: 'charset-1' },
          isActive: true,
        },
      });
      expect(playerSecretRepository.create).toHaveBeenCalledTimes(2);
      expect(playerSecretRepository.save).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if no characters found', async () => {
      characterRepository.find.mockResolvedValue([]);

      await expect(
        service.assignSecretCharacters(mockGame),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.assignSecretCharacters(mockGame),
      ).rejects.toThrow('No characters found in the character set');
    });

    it('should throw InternalServerErrorException if no players in game', async () => {
      const game = {
        ...mockGame,
        players: [],
      };

      characterRepository.find.mockResolvedValue([mockCharacter]);

      await expect(service.assignSecretCharacters(game)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.assignSecretCharacters(game)).rejects.toThrow(
        'No players found in the game',
      );
    });

    it('should throw BadRequestException if not enough characters', async () => {
      const player1 = { id: 'player-1' } as GamePlayer;
      const player2 = { id: 'player-2' } as GamePlayer;

      const game = {
        ...mockGame,
        players: [player1, player2],
      };

      characterRepository.find.mockResolvedValue([mockCharacter]); // Only 1 character for 2 players

      await expect(service.assignSecretCharacters(game)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.assignSecretCharacters(game)).rejects.toThrow(
        'Not enough characters in the set for all players',
      );
    });
  });

  describe('getGameState', () => {
    it('should return game state for an active game', async () => {
      const gameWithRounds = {
        ...mockGame,
        rounds: [mockRound],
        players: [mockPlayer],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);

      const result = await service.getGameState('ABC12');

      expect(result).toBeDefined();
      expect(result.roomCode).toBe('ABC12');
      expect(result.status).toBe(GameStatus.IN_PROGRESS);
      expect(result.currentRoundNumber).toBe(1);
      expect(result.currentRoundState).toBe(RoundState.AWAITING_QUESTION);
      expect(result.activePlayerId).toBe('player-1');
      expect(gameLobbyService.normalizeRoomCode).toHaveBeenCalledWith('ABC12');
    });

    it('should throw NotFoundException if game not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);

      await expect(service.getGameState('INVALID')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getGameState('INVALID')).rejects.toThrow(
        'Game not found',
      );
    });

    it('should handle game with no rounds', async () => {
      const gameNoRounds = {
        ...mockGame,
        rounds: [],
        players: [mockPlayer],
      };

      gameRepository.findOne.mockResolvedValue(gameNoRounds);

      const result = await service.getGameState('ABC12');

      expect(result.currentRoundNumber).toBe(0);
      expect(result.currentRoundState).toBe('');
      expect(result.activePlayerId).toBeUndefined();
    });

    it('should filter out players who have left', async () => {
      const leftPlayer = {
        ...mockPlayer,
        id: 'player-2',
        leftAt: new Date(),
      } as GamePlayer;

      const gameWithLeftPlayer = {
        ...mockGame,
        rounds: [mockRound],
        players: [mockPlayer, leftPlayer],
      };

      gameRepository.findOne.mockResolvedValue(gameWithLeftPlayer);

      const result = await service.getGameState('ABC12');

      expect(result.players).toHaveLength(1);
      expect(result.players[0].id).toBe('player-1');
    });
  });

  describe('askQuestion', () => {
    it('should create and save a question successfully', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Is your character wearing glasses?',
      };

      const targetPlayer = {
        id: 'player-2',
        username: 'target',
        game: mockGame,
      } as GamePlayer;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(targetPlayer);

      const mockQuestion = {
        id: 'question-1',
        round: mockRound,
        askedBy: mockPlayer,
        targetPlayer: targetPlayer,
        questionText: 'Is your character wearing glasses?',
      } as Question;

      questionRepository.create.mockReturnValue(mockQuestion);
      questionRepository.save.mockResolvedValue(mockQuestion);
      playerRepository.save.mockResolvedValue(mockPlayer);
      roundRepository.save.mockResolvedValue(mockRound);

      const result = await service.askQuestion('ABC12', request);

      expect(result).toBeDefined();
      expect(result.questionText).toBe('Is your character wearing glasses?');
      expect(questionRepository.save).toHaveBeenCalled();
      expect(roundRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if game not found', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Test question?',
      };

      gameRepository.findOne.mockResolvedValue(null);

      await expect(
        service.askQuestion('INVALID', request),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if game is not in progress', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Test question?',
      };

      const gameInLobby = {
        ...mockGame,
        status: GameStatus.LOBBY,
        rounds: [mockRound],
      };

      gameRepository.findOne.mockResolvedValue(gameInLobby);

      await expect(
        service.askQuestion('ABC12', request),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.askQuestion('ABC12', request),
      ).rejects.toThrow('Game is not in progress');
    });

    it('should throw BadRequestException if round is not awaiting question', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        questionText: 'Test question?',
      };

      const roundAwaitingAnswer = {
        ...mockRound,
        state: RoundState.AWAITING_ANSWER,
      } as Round;

      const gameWithWrongState = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundAwaitingAnswer],
      };

      gameRepository.findOne.mockResolvedValue(gameWithWrongState);

      await expect(
        service.askQuestion('ABC12', request),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if player is not the active player', async () => {
      const request = {
        playerId: 'player-2',
        targetPlayerId: 'player-1',
        questionText: 'Test question?',
      };

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [mockRound],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);

      await expect(
        service.askQuestion('ABC12', request),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target player not found', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'invalid-player',
        questionText: 'Test question?',
      };

      const freshRound = {
        id: 'round-1',
        roundNumber: 1,
        game: mockGame,
        activePlayer: mockPlayer,
        state: RoundState.AWAITING_QUESTION,
        startedAt: new Date(),
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [freshRound],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(null);

      await expect(
        service.askQuestion('ABC12', request),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitAnswer', () => {
    it('should submit answer successfully', async () => {
      const request = {
        playerId: 'player-2',
        questionId: 'question-1',
        answerValue: AnswerValue.YES,
        answerText: undefined,
      };

      const mockQuestion = {
        id: 'question-1',
        round: mockRound,
        askedBy: mockPlayer,
        targetPlayer: { id: 'player-2' } as GamePlayer,
        answers: [],
        questionText: 'Test question?',
        askedAt: new Date(),
      } as Question;

      const answeringPlayer = {
        id: 'player-2',
        username: 'answerer',
        game: mockGame,
        secret: {
          character: mockCharacter,
        },
      } as GamePlayer;

      const roundAwaitingAnswer = {
        ...mockRound,
        state: RoundState.AWAITING_ANSWER,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundAwaitingAnswer],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      questionRepository.findOne.mockResolvedValue(mockQuestion);
      playerRepository.findOne.mockResolvedValue(answeringPlayer);

      const mockAnswer = {
        id: 'answer-1',
        question: mockQuestion,
        answeredBy: answeringPlayer,
        answerValue: AnswerValue.YES,
        answeredAt: new Date(),
      } as Answer;

      answerRepository.create.mockReturnValue(mockAnswer);
      answerRepository.save.mockResolvedValue(mockAnswer);
      playerRepository.save.mockResolvedValue(answeringPlayer);
      roundRepository.save.mockResolvedValue(roundAwaitingAnswer);

      const result = await service.submitAnswer('ABC12', request);

      expect(result).toBeDefined();
      expect(result.answerValue).toBe(AnswerValue.YES);
      expect(answerRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if game not found', async () => {
      const request = {
        playerId: 'player-1',
        questionId: 'invalid-question',
        answerValue: AnswerValue.YES,
      };

      gameRepository.findOne.mockResolvedValue(null);

      await expect(service.submitAnswer('INVALID', request)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if game is not in progress', async () => {
      const request = {
        playerId: 'player-1',
        questionId: 'question-1',
        answerValue: AnswerValue.YES,
      };

      const gameInLobby = {
        ...mockGame,
        status: GameStatus.LOBBY,
        rounds: [mockRound],
      };

      gameRepository.findOne.mockResolvedValue(gameInLobby);

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Game is not in progress',
      );
    });

    it('should throw NotFoundException if question not found', async () => {
      const request = {
        playerId: 'player-1',
        questionId: 'invalid-question',
        answerValue: AnswerValue.YES,
      };

      const roundAwaitingAnswer = {
        ...mockRound,
        state: RoundState.AWAITING_ANSWER,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundAwaitingAnswer],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      questionRepository.findOne.mockResolvedValue(null);

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Question not found',
      );
    });

    it('should throw BadRequestException if question already answered', async () => {
      const request = {
        playerId: 'player-2',
        questionId: 'question-1',
        answerValue: AnswerValue.YES,
      };

      const mockQuestion = {
        id: 'question-1',
        round: mockRound,
        answers: [{ id: 'answer-1' } as Answer],
      } as Question;

      const roundAwaitingAnswer = {
        ...mockRound,
        state: RoundState.AWAITING_ANSWER,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundAwaitingAnswer],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      questionRepository.findOne.mockResolvedValue(mockQuestion);

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Question has already been answered',
      );
    });

    it('should throw BadRequestException if player tries to answer their own question', async () => {
      const request = {
        playerId: 'player-1',
        questionId: 'question-1',
        answerValue: AnswerValue.YES,
      };

      const mockQuestion = {
        id: 'question-1',
        round: mockRound,
        askedBy: mockPlayer,
        targetPlayer: null,
        answers: [],
        questionText: 'Test question?',
        askedAt: new Date(),
      } as unknown as Question;

      const roundAwaitingAnswer = {
        ...mockRound,
        state: RoundState.AWAITING_ANSWER,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundAwaitingAnswer],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      questionRepository.findOne.mockResolvedValue(mockQuestion);
      playerRepository.findOne.mockResolvedValue(mockPlayer);

      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.submitAnswer('ABC12', request)).rejects.toThrow(
        'Cannot answer your own question',
      );
    });
  });

  describe('submitGuess', () => {
    it('should submit a correct guess successfully', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      const targetPlayer = {
        id: 'player-2',
        username: 'target',
        game: mockGame,
        secret: {
          character: mockCharacter,
        },
      } as GamePlayer;

      const guessingPlayer = {
        ...mockPlayer,
        score: 0,
      } as GamePlayer;

      const mockSecret = {
        id: 'secret-1',
        player: targetPlayer,
        character: mockCharacter,
        status: PlayerSecretStatus.HIDDEN,
      } as PlayerSecret;

      const roundForGuess = {
        ...mockRound,
        state: RoundState.AWAITING_QUESTION,
        activePlayer: guessingPlayer,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundForGuess],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(guessingPlayer)
        .mockResolvedValueOnce(targetPlayer);
      playerSecretRepository.findOne.mockResolvedValue(mockSecret);
      characterRepository.findOne.mockResolvedValue(mockCharacter);
      guessRepository.count.mockResolvedValue(0);

      const mockGuess = {
        id: 'guess-1',
        round: roundForGuess,
        guessedBy: guessingPlayer,
        targetPlayer: targetPlayer,
        guessedCharacter: mockCharacter,
        targetCharacter: mockCharacter,
        isCorrect: true,
        guessedAt: new Date(),
      } as Guess;

      guessRepository.create.mockReturnValue(mockGuess);
      guessRepository.save.mockResolvedValue(mockGuess);
      playerSecretRepository.save.mockResolvedValue(mockSecret);
      playerRepository.save.mockResolvedValue(guessingPlayer);

      const result = await service.submitGuess('ABC12', request);

      expect(result).toBeDefined();
      expect(result.isCorrect).toBe(true);
      expect(guessRepository.save).toHaveBeenCalled();
    });

    it('should submit an incorrect guess', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-2',
      };

      const targetPlayer = {
        id: 'player-2',
        username: 'target',
        game: mockGame,
        secret: {
          character: mockCharacter,
        },
      } as GamePlayer;

      const guessingPlayer = {
        ...mockPlayer,
        score: 0,
      } as GamePlayer;

      const wrongCharacter = {
        id: 'char-2',
        name: 'Wrong Character',
      } as Character;

      const mockSecret = {
        id: 'secret-1',
        player: targetPlayer,
        character: mockCharacter,
        status: PlayerSecretStatus.HIDDEN,
      } as PlayerSecret;

      const roundForGuess = {
        ...mockRound,
        state: RoundState.AWAITING_QUESTION,
        activePlayer: guessingPlayer,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundForGuess],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(guessingPlayer)
        .mockResolvedValueOnce(targetPlayer);
      playerSecretRepository.findOne.mockResolvedValue(mockSecret);
      characterRepository.findOne.mockResolvedValue(wrongCharacter);
      playerRepository.save.mockResolvedValue(guessingPlayer);
      guessRepository.count.mockResolvedValue(0);

      const mockGuess = {
        id: 'guess-1',
        round: roundForGuess,
        guessedBy: guessingPlayer,
        targetPlayer: targetPlayer,
        guessedCharacter: wrongCharacter,
        targetCharacter: mockCharacter,
        isCorrect: false,
        guessedAt: new Date(),
      } as Guess;

      guessRepository.create.mockReturnValue(mockGuess);
      guessRepository.save.mockResolvedValue(mockGuess);

      const result = await service.submitGuess('ABC12', request);

      expect(result).toBeDefined();
      expect(result.isCorrect).toBe(false);
    });

    it('should throw NotFoundException if game not found', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      gameRepository.findOne.mockResolvedValue(null);

      await expect(
        service.submitGuess('INVALID', request),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if game is not in progress', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      const gameInLobby = {
        ...mockGame,
        status: GameStatus.LOBBY,
        rounds: [mockRound],
      };

      gameRepository.findOne.mockResolvedValue(gameInLobby);

      await expect(
        service.submitGuess('ABC12', request),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if guessing player not found', async () => {
      const request = {
        playerId: 'invalid-player',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      const roundForGuess = {
        ...mockRound,
        state: RoundState.AWAITING_QUESTION,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundForGuess],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.submitGuess('ABC12', request),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if character not found', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'invalid-char',
      };

      const targetPlayer = {
        id: 'player-2',
        username: 'target',
        game: mockGame,
      } as GamePlayer;

      const guessingPlayer = {
        ...mockPlayer,
        score: 0,
      } as GamePlayer;

      const roundForGuess = {
        ...mockRound,
        state: RoundState.AWAITING_QUESTION,
        activePlayer: guessingPlayer,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundForGuess],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(targetPlayer);
      characterRepository.findOne.mockResolvedValue(null);

      await expect(
        service.submitGuess('ABC12', request),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if round is not in AWAITING_QUESTION state', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      const roundAwaitingAnswer = {
        ...mockRound,
        state: RoundState.AWAITING_ANSWER,
      } as Round;

      const gameWithWrongState = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundAwaitingAnswer],
      };

      gameRepository.findOne.mockResolvedValue(gameWithWrongState);

      await expect(
        service.submitGuess('ABC12', request),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.submitGuess('ABC12', request),
      ).rejects.toThrow('Cannot submit guess in round state: awaiting_answer');
    });

    it('should throw BadRequestException if player is not the active player', async () => {
      const request = {
        playerId: 'player-2',
        targetPlayerId: 'player-1',
        targetCharacterId: 'char-1',
      };

      const player2 = {
        id: 'player-2',
        username: 'player2',
        game: mockGame,
      } as GamePlayer;

      const roundWithDifferentActivePlayer = {
        ...mockRound,
        state: RoundState.AWAITING_QUESTION,
        activePlayer: mockPlayer, // player-1 is active
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundWithDifferentActivePlayer],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(player2)
        .mockResolvedValueOnce(player2);

      await expect(
        service.submitGuess('ABC12', request),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.submitGuess('ABC12', request),
      ).rejects.toThrow('Only the active player can make a guess');
    });

    it('should throw BadRequestException if player has reached max guesses', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      const guessingPlayer = {
        ...mockPlayer,
      } as GamePlayer;

      const roundForGuess = {
        ...mockRound,
        state: RoundState.AWAITING_QUESTION,
        activePlayer: guessingPlayer,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundForGuess],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne.mockResolvedValueOnce(guessingPlayer);
      guessRepository.count.mockResolvedValue(3); // Already at max

      await expect(
        service.submitGuess('ABC12', request),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow guess when under the limit', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-1',
      };

      const targetPlayer = {
        id: 'player-2',
        username: 'target',
        game: mockGame,
        secret: {
          character: mockCharacter,
        },
      } as GamePlayer;

      const guessingPlayer = {
        ...mockPlayer,
        score: 100,
      } as GamePlayer;

      const roundForGuess = {
        ...mockRound,
        state: RoundState.AWAITING_QUESTION,
        activePlayer: guessingPlayer,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundForGuess],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(guessingPlayer)
        .mockResolvedValueOnce(targetPlayer);
      characterRepository.findOne.mockResolvedValue(mockCharacter);
      guessRepository.count.mockResolvedValue(2); // Under limit

      const mockGuess = {
        id: 'guess-1',
        round: roundForGuess,
        guessedBy: guessingPlayer,
        targetPlayer: targetPlayer,
        targetCharacter: mockCharacter,
        isCorrect: true,
        guessedAt: new Date(),
      } as Guess;

      guessRepository.create.mockReturnValue(mockGuess);
      guessRepository.save.mockResolvedValue(mockGuess);

      const result = await service.submitGuess('ABC12', request);

      expect(result).toBeDefined();
      expect(guessRepository.count).toHaveBeenCalledWith({
        where: {
          guessedBy: { id: guessingPlayer.id },
          round: { game: { id: mockGame.id } },
        },
      });
    });

    it('should apply score penalty for incorrect guess', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-2',
      };

      const targetPlayer = {
        id: 'player-2',
        username: 'target',
        game: mockGame,
        secret: {
          character: mockCharacter,
        },
      } as GamePlayer;

      const guessingPlayer = {
        ...mockPlayer,
        score: 200,
      } as GamePlayer;

      const wrongCharacter = {
        id: 'char-2',
        name: 'Wrong Character',
      } as Character;

      const roundForGuess = {
        ...mockRound,
        state: RoundState.AWAITING_QUESTION,
        activePlayer: guessingPlayer,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundForGuess],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(guessingPlayer)
        .mockResolvedValueOnce(targetPlayer);
      characterRepository.findOne.mockResolvedValue(wrongCharacter);
      guessRepository.count.mockResolvedValue(0);

      const mockGuess = {
        id: 'guess-1',
        round: roundForGuess,
        guessedBy: guessingPlayer,
        targetPlayer: targetPlayer,
        targetCharacter: wrongCharacter,
        isCorrect: false,
        guessedAt: new Date(),
      } as Guess;

      guessRepository.create.mockReturnValue(mockGuess);
      guessRepository.save.mockResolvedValue(mockGuess);
      playerRepository.save.mockResolvedValue(guessingPlayer);

      await service.submitGuess('ABC12', request);

      expect(playerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 100, // 200 - 100 penalty
        }),
      );
    });

    it('should not let score go below zero after penalty', async () => {
      const request = {
        playerId: 'player-1',
        targetPlayerId: 'player-2',
        targetCharacterId: 'char-2',
      };

      const targetPlayer = {
        id: 'player-2',
        username: 'target',
        game: mockGame,
        secret: {
          character: mockCharacter,
        },
      } as GamePlayer;

      const guessingPlayer = {
        ...mockPlayer,
        score: 50, // Less than penalty
      } as GamePlayer;

      const wrongCharacter = {
        id: 'char-2',
        name: 'Wrong Character',
      } as Character;

      const roundForGuess = {
        ...mockRound,
        state: RoundState.AWAITING_QUESTION,
        activePlayer: guessingPlayer,
      } as Round;

      const gameWithRounds = {
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
        rounds: [roundForGuess],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);
      playerRepository.findOne
        .mockResolvedValueOnce(guessingPlayer)
        .mockResolvedValueOnce(targetPlayer);
      characterRepository.findOne.mockResolvedValue(wrongCharacter);
      guessRepository.count.mockResolvedValue(0);

      const mockGuess = {
        id: 'guess-1',
        round: roundForGuess,
        guessedBy: guessingPlayer,
        targetPlayer: targetPlayer,
        targetCharacter: wrongCharacter,
        isCorrect: false,
        guessedAt: new Date(),
      } as Guess;

      guessRepository.create.mockReturnValue(mockGuess);
      guessRepository.save.mockResolvedValue(mockGuess);
      playerRepository.save.mockResolvedValue(guessingPlayer);

      await service.submitGuess('ABC12', request);

      expect(playerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 0, // Should be clamped to 0, not negative
        }),
      );
    });
  });

  describe('getPlayerCharacter', () => {
    it('should return player\'s secret character', async () => {
      const playerWithSecret = {
        ...mockPlayer,
        secret: {
          character: {
            ...mockCharacter,
            slug: 'test-character',
            summary: null,
            metadata: {},
          },
          assignedAt: new Date(),
        },
      } as GamePlayer;

      const gameWithPlayers = {
        ...mockGame,
        players: [playerWithSecret],
      };

      gameRepository.findOne.mockResolvedValue(gameWithPlayers);
      playerRepository.findOne.mockResolvedValue(playerWithSecret);

      const result = await service.getPlayerCharacter('ABC12', 'player-1');

      expect(result).toBeDefined();
      expect(result.character.id).toBe('char-1');
      expect(result.character.name).toBe('Test Character');
      expect(result.playerId).toBe('player-1');
    });

    it('should throw NotFoundException if game not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPlayerCharacter('INVALID', 'player-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if player not found', async () => {
      const gameWithPlayers = {
        ...mockGame,
        players: [mockPlayer],
      };

      gameRepository.findOne.mockResolvedValue(gameWithPlayers);
      playerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPlayerCharacter('ABC12', 'invalid-player'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if player secret not found', async () => {
      const gameWithPlayers = {
        ...mockGame,
        players: [mockPlayer],
      };

      gameRepository.findOne.mockResolvedValue(gameWithPlayers);
      playerRepository.findOne.mockResolvedValue(mockPlayer);
      playerSecretRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPlayerCharacter('ABC12', 'player-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getQuestions', () => {
    it('should return questions with proper mapping', async () => {
      const mockTargetPlayer = {
        id: 'player-2',
        username: 'player2',
      } as GamePlayer;

      const mockQuestions = [
        {
          id: 'question-1',
          questionText: 'Question 1?',
          askedBy: mockPlayer,
          targetPlayer: mockTargetPlayer,
          round: mockRound,
          askedAt: new Date(),
        } as Question,
        {
          id: 'question-2',
          questionText: 'Question 2?',
          askedBy: mockPlayer,
          targetPlayer: mockTargetPlayer,
          round: mockRound,
          askedAt: new Date(),
        } as Question,
      ];

      const gameWithRounds = {
        ...mockGame,
        rounds: [{ ...mockRound, questions: mockQuestions }],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);

      const result = await service.getQuestions('ABC12');

      expect(result).toHaveLength(2);
      expect(result[0].questionText).toBe('Question 1?');
      expect(result[0].targetPlayerId).toBe('player-2');
      expect(result[1].questionText).toBe('Question 2?');
      expect(result[1].targetPlayerId).toBe('player-2');
    });

    it('should return empty array if no questions found', async () => {
      const gameWithRounds = {
        ...mockGame,
        rounds: [{ ...mockRound, questions: [] }],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);

      const result = await service.getQuestions('ABC12');

      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundException if game not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);

      await expect(service.getQuestions('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAnswers', () => {
    it('should return answers with proper mapping', async () => {
      const mockAnswers = [
        {
          id: 'answer-1',
          answerValue: AnswerValue.YES,
          answeredBy: mockPlayer,
          question: { id: 'question-1' } as Question,
          answeredAt: new Date(),
        } as Answer,
        {
          id: 'answer-2',
          answerValue: AnswerValue.NO,
          answeredBy: { id: 'player-2', username: 'player2' } as GamePlayer,
          question: { id: 'question-2' } as Question,
          answeredAt: new Date(),
        } as Answer,
      ];

      const mockQuestion = {
        id: 'question-1',
        questionText: 'Test question?',
        askedBy: mockPlayer,
        answers: mockAnswers,
      } as Question;

      const gameWithRounds = {
        ...mockGame,
        rounds: [{ ...mockRound, questions: [mockQuestion] }],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);

      const result = await service.getAnswers('ABC12');

      expect(result).toHaveLength(2);
      expect(result[0].answerValue).toBe(AnswerValue.YES);
      expect(result[1].answerValue).toBe(AnswerValue.NO);
    });

    it('should return empty array if no answers found', async () => {
      const gameWithRounds = {
        ...mockGame,
        rounds: [{ ...mockRound, questions: [] }],
      };

      gameRepository.findOne.mockResolvedValue(gameWithRounds);

      const result = await service.getAnswers('ABC12');

      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundException if game not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);

      await expect(service.getAnswers('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('advanceToNextTurn', () => {
    it('should advance to the next active player', async () => {
      const player2 = {
        id: 'player-2',
        username: 'player2',
        leftAt: null,
      } as GamePlayer;

      const gameWithPlayers = {
        ...mockGame,
        players: [mockPlayer, player2],
      };

      roundRepository.save.mockResolvedValue(mockRound);

      await service.advanceToNextTurn(mockRound, gameWithPlayers);

      expect(roundRepository.save).toHaveBeenCalled();
      expect(mockRound.state).toBe(RoundState.AWAITING_QUESTION);
    });

    it('should skip eliminated players', async () => {
      const eliminatedPlayer = {
        id: 'player-2',
        username: 'eliminated',
        leftAt: new Date(),
      } as GamePlayer;

      const player3 = {
        id: 'player-3',
        username: 'player3',
        leftAt: null,
      } as GamePlayer;

      const gameWithPlayers = {
        ...mockGame,
        players: [mockPlayer, eliminatedPlayer, player3],
      };

      roundRepository.save.mockResolvedValue(mockRound);

      await service.advanceToNextTurn(mockRound, gameWithPlayers);

      expect(roundRepository.save).toHaveBeenCalled();
      // Should skip eliminatedPlayer and go to player3
    });
  });

  describe('handleGuessResult', () => {
    it('should handle correct guess', async () => {
      const mockSecret = {
        id: 'secret-1',
        status: PlayerSecretStatus.HIDDEN,
      } as PlayerSecret;

      const targetPlayer = {
        id: 'player-2',
        username: 'target',
        secret: mockSecret,
      } as GamePlayer;

      const guessingPlayer = {
        ...mockPlayer,
        score: 0,
      } as GamePlayer;

      const correctGuess = {
        id: 'guess-1',
        guessedBy: guessingPlayer,
        targetPlayer: targetPlayer,
        isCorrect: true,
      } as Guess;

      playerSecretRepository.save.mockResolvedValue({
        ...mockSecret,
        status: PlayerSecretStatus.REVEALED,
      });
      playerRepository.save.mockResolvedValue(guessingPlayer);

      const result = await service.handleGuessResult(correctGuess);

      expect(result).toBe(true);
      expect(playerSecretRepository.save).toHaveBeenCalled();
      expect(playerRepository.save).toHaveBeenCalled();
    });

    it('should handle incorrect guess', async () => {
      const guessingPlayer = {
        ...mockPlayer,
        score: 0,
      } as GamePlayer;

      const targetPlayer = {
        id: 'player-2',
        username: 'target',
      } as GamePlayer;

      const incorrectGuess = {
        id: 'guess-1',
        guessedBy: guessingPlayer,
        targetPlayer: targetPlayer,
        isCorrect: false,
      } as Guess;

      playerRepository.save.mockResolvedValue(guessingPlayer);

      const result = await service.handleGuessResult(incorrectGuess);

      expect(result).toBe(false);
      expect(playerRepository.save).not.toHaveBeenCalled();
    });
  });
});
