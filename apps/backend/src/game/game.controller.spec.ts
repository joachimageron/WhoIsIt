import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './services/game.service';
import { BroadcastService } from './services/broadcast.service';
import { AnswerValue } from '../database/enums';
import type {
  CreateGameRequest,
  GameLobbyResponse,
  JoinGameRequest,
  AskQuestionRequest,
  QuestionResponse,
  GameStateResponse,
  SubmitAnswerRequest,
  AnswerResponse,
  SubmitGuessRequest,
  GuessResponse,
  GameOverResult,
  PlayerCharacterResponse,
} from '@whois-it/contracts';

describe('GameController', () => {
  let controller: GameController;
  let gameService: jest.Mocked<GameService>;
  let broadcastService: jest.Mocked<BroadcastService>;

  const mockGameLobbyResponse: GameLobbyResponse = {
    roomCode: 'ABC12',
    status: 'lobby',
    visibility: 'public',
    maxPlayers: 4,
    currentPlayers: 1,
    players: [
      {
        id: 'player1',
        username: 'TestHost',
        isHost: true,
        isReady: false,
        avatarUrl: null,
      },
    ],
  };

  const mockGameStateResponse: GameStateResponse = {
    roomCode: 'ABC12',
    status: 'in_progress',
    currentRound: 1,
    players: [],
  };

  const mockQuestionResponse: QuestionResponse = {
    id: 'question1',
    questionText: 'Does your character have brown hair?',
    roundNumber: 1,
    playerId: 'player1',
    targetPlayerId: 'player2',
    createdAt: new Date().toISOString(),
  };

  const mockAnswerResponse: AnswerResponse = {
    id: 'answer1',
    questionId: 'question1',
    playerId: 'player2',
    answerValue: AnswerValue.YES,
    answerText: null,
    createdAt: new Date().toISOString(),
  };

  const mockGuessResponse: GuessResponse = {
    id: 'guess1',
    playerId: 'player1',
    targetPlayerId: 'player2',
    targetCharacterId: 'char1',
    isCorrect: true,
    createdAt: new Date().toISOString(),
  };

  const mockPlayerCharacterResponse: PlayerCharacterResponse = {
    characterId: 'char1',
    characterName: 'Alice',
    imageUrl: 'https://example.com/alice.jpg',
  };

  const mockGameOverResult: GameOverResult = {
    roomCode: 'ABC12',
    winner: {
      playerId: 'player1',
      username: 'TestHost',
      score: 100,
    },
    players: [],
  };

  const mockUser = {
    id: 'user-1',
    username: 'TestHost',
    email: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockRequest = {
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const mockGameService = {
      createGame: jest.fn(),
      joinGame: jest.fn(),
      getLobbyByRoomCode: jest.fn(),
      getPlayerCharacter: jest.fn(),
      startGame: jest.fn(),
      askQuestion: jest.fn(),
      getGameState: jest.fn(),
      getQuestions: jest.fn(),
      getAnswers: jest.fn(),
      submitAnswer: jest.fn(),
      submitGuess: jest.fn(),
      getGameOverResult: jest.fn(),
    };

    const mockBroadcastService = {
      broadcastGameStarted: jest.fn(),
      broadcastQuestionAsked: jest.fn(),
      broadcastAnswerSubmitted: jest.fn(),
      broadcastGuessResult: jest.fn(),
      broadcastGameOver: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        {
          provide: GameService,
          useValue: mockGameService,
        },
        {
          provide: BroadcastService,
          useValue: mockBroadcastService,
        },
      ],
    }).compile();

    controller = module.get<GameController>(GameController);
    gameService = module.get(GameService) as jest.Mocked<GameService>;
    broadcastService = module.get(BroadcastService) as jest.Mocked<
      BroadcastService
    >;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a game successfully', async () => {
      const createRequest: CreateGameRequest = {
        characterSetId: 'charset1',
        visibility: 'public',
        maxPlayers: 4,
      };

      gameService.createGame.mockResolvedValue(mockGameLobbyResponse);

      const result = await controller.create(mockRequest, createRequest);

      expect(result).toEqual(mockGameLobbyResponse);
      expect(gameService.createGame).toHaveBeenCalledWith(
        {
          ...createRequest,
          characterSetId: 'charset1',
        },
        mockUser.id,
        mockUser.username,
      );
    });

    it('should trim characterSetId', async () => {
      const createRequest: CreateGameRequest = {
        characterSetId: '  charset1  ',
        visibility: 'public',
        maxPlayers: 4,
      };

      gameService.createGame.mockResolvedValue(mockGameLobbyResponse);

      await controller.create(mockRequest, createRequest);

      expect(gameService.createGame).toHaveBeenCalledWith(
        {
          ...createRequest,
          characterSetId: 'charset1',
        },
        mockUser.id,
        mockUser.username,
      );
    });

    it('should throw BadRequestException if characterSetId is missing', async () => {
      const createRequest: any = {
        visibility: 'public',
        maxPlayers: 4,
      };

      await expect(controller.create(mockRequest, createRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(mockRequest, createRequest)).rejects.toThrow(
        'characterSetId is required',
      );
    });

    it('should throw BadRequestException if characterSetId is empty', async () => {
      const createRequest: CreateGameRequest = {
        characterSetId: '   ',
        visibility: 'public',
        maxPlayers: 4,
      };

      await expect(controller.create(mockRequest, createRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('join', () => {
    it('should join a game successfully', async () => {
      const roomCode = 'ABC12';

      gameService.joinGame.mockResolvedValue(mockGameLobbyResponse);

      const result = await controller.join(roomCode, mockRequest);

      expect(result).toEqual(mockGameLobbyResponse);
      expect(gameService.joinGame).toHaveBeenCalledWith(
        roomCode,
        mockUser.id,
        mockUser.username,
      );
    });



    it('should throw BadRequestException if roomCode is missing', async () => {
      const joinRequest: JoinGameRequest = {};

      await expect(controller.join('', mockRequest, joinRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.join('', mockRequest, joinRequest)).rejects.toThrow(
        'roomCode is required',
      );
    });
  });

  describe('getLobby', () => {
    it('should get lobby information', async () => {
      const roomCode = 'ABC12';

      gameService.getLobbyByRoomCode.mockResolvedValue(mockGameLobbyResponse);

      const result = await controller.getLobby(roomCode);

      expect(result).toEqual(mockGameLobbyResponse);
      expect(gameService.getLobbyByRoomCode).toHaveBeenCalledWith(roomCode);
    });

    it('should throw BadRequestException if roomCode is missing', async () => {
      await expect(controller.getLobby('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getLobby('')).rejects.toThrow(
        'roomCode is required',
      );
    });
  });

  describe('getPlayerCharacter', () => {
    it('should get player character', async () => {
      const roomCode = 'ABC12';
      const playerId = 'player1';

      gameService.getPlayerCharacter.mockResolvedValue(
        mockPlayerCharacterResponse,
      );

      const result = await controller.getPlayerCharacter(roomCode, playerId, mockRequest);

      expect(result).toEqual(mockPlayerCharacterResponse);
      expect(gameService.getPlayerCharacter).toHaveBeenCalledWith(
        roomCode,
        mockUser.id,
        playerId,
      );
    });

    it('should throw BadRequestException if roomCode is missing', async () => {
      await expect(
        controller.getPlayerCharacter('', 'player1', mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if playerId is missing', async () => {
      await expect(
        controller.getPlayerCharacter('ABC12', '', mockRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('startGame', () => {
    it('should start a game successfully', async () => {
      const roomCode = 'ABC12';

      gameService.startGame.mockResolvedValue(mockGameLobbyResponse);

      const result = await controller.startGame(roomCode);

      expect(result).toEqual(mockGameLobbyResponse);
      expect(gameService.startGame).toHaveBeenCalledWith(roomCode);
      expect(broadcastService.broadcastGameStarted).toHaveBeenCalledWith(
        roomCode,
      );
    });

    it('should throw BadRequestException if roomCode is missing', async () => {
      await expect(controller.startGame('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('askQuestion', () => {
    it('should ask a question successfully', async () => {
      const roomCode = 'ABC12';
      const askRequest: AskQuestionRequest = {
        questionText: 'Does your character have brown hair?',
        targetPlayerId: 'player2',
      };

      gameService.askQuestion.mockResolvedValue(mockQuestionResponse);
      gameService.getGameState.mockResolvedValue(mockGameStateResponse);

      const result = await controller.askQuestion(roomCode, mockRequest, askRequest);

      expect(result).toEqual(mockQuestionResponse);
      expect(gameService.askQuestion).toHaveBeenCalledWith(roomCode, mockUser.id, {
        ...askRequest,
        questionText: 'Does your character have brown hair?',
        targetPlayerId: 'player2',
      });
      expect(gameService.getGameState).toHaveBeenCalledWith(roomCode);
      expect(broadcastService.broadcastQuestionAsked).toHaveBeenCalledWith(
        roomCode,
        mockQuestionResponse,
        mockGameStateResponse,
      );
    });

    it('should trim text fields', async () => {
      const roomCode = 'ABC12';
      const askRequest: AskQuestionRequest = {
        questionText: '  Does your character have brown hair?  ',
        targetPlayerId: '  player2  ',
      };

      gameService.askQuestion.mockResolvedValue(mockQuestionResponse);
      gameService.getGameState.mockResolvedValue(mockGameStateResponse);

      await controller.askQuestion(roomCode, mockRequest, askRequest);

      expect(gameService.askQuestion).toHaveBeenCalledWith(roomCode, mockUser.id, {
        ...askRequest,
        questionText: 'Does your character have brown hair?',
        targetPlayerId: 'player2',
      });
    });

    it('should throw BadRequestException if roomCode is missing', async () => {
      const askRequest: AskQuestionRequest = {
        questionText: 'Does your character have brown hair?',
        targetPlayerId: 'player2',
      };

      await expect(controller.askQuestion('', mockRequest, askRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if questionText is missing', async () => {
      const askRequest: any = {
        targetPlayerId: 'player2',
      };

      await expect(
        controller.askQuestion('ABC12', mockRequest, askRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if targetPlayerId is missing', async () => {
      const askRequest: any = {
        questionText: 'Does your character have brown hair?',
      };

      await expect(
        controller.askQuestion('ABC12', mockRequest, askRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getGameState', () => {
    it('should get game state', async () => {
      const roomCode = 'ABC12';

      gameService.getGameState.mockResolvedValue(mockGameStateResponse);

      const result = await controller.getGameState(roomCode);

      expect(result).toEqual(mockGameStateResponse);
      expect(gameService.getGameState).toHaveBeenCalledWith(roomCode);
    });

    it('should throw BadRequestException if roomCode is missing', async () => {
      await expect(controller.getGameState('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getQuestions', () => {
    it('should get questions', async () => {
      const roomCode = 'ABC12';
      const questions = [mockQuestionResponse];

      gameService.getQuestions.mockResolvedValue(questions);

      const result = await controller.getQuestions(roomCode);

      expect(result).toEqual(questions);
      expect(gameService.getQuestions).toHaveBeenCalledWith(roomCode);
    });

    it('should throw BadRequestException if roomCode is missing', async () => {
      await expect(controller.getQuestions('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAnswers', () => {
    it('should get answers', async () => {
      const roomCode = 'ABC12';
      const answers = [mockAnswerResponse];

      gameService.getAnswers.mockResolvedValue(answers);

      const result = await controller.getAnswers(roomCode);

      expect(result).toEqual(answers);
      expect(gameService.getAnswers).toHaveBeenCalledWith(roomCode);
    });

    it('should throw BadRequestException if roomCode is missing', async () => {
      await expect(controller.getAnswers('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('submitAnswer', () => {
    it('should submit an answer successfully', async () => {
      const roomCode = 'ABC12';
      const submitRequest: SubmitAnswerRequest = {
        questionId: 'question1',
        answerValue: AnswerValue.YES,
        answerText: null,
      };

      gameService.submitAnswer.mockResolvedValue(mockAnswerResponse);
      gameService.getGameState.mockResolvedValue(mockGameStateResponse);

      const result = await controller.submitAnswer(roomCode, mockRequest, submitRequest);

      expect(result).toEqual(mockAnswerResponse);
      expect(gameService.submitAnswer).toHaveBeenCalledWith(roomCode, mockUser.id, {
        questionId: 'question1',
        answerValue: AnswerValue.YES,
        answerText: undefined,
      });
      expect(gameService.getGameState).toHaveBeenCalledWith(roomCode);
      expect(broadcastService.broadcastAnswerSubmitted).toHaveBeenCalledWith(
        roomCode,
        mockAnswerResponse,
        mockGameStateResponse,
      );
    });

    it('should trim text fields', async () => {
      const roomCode = 'ABC12';
      const submitRequest: SubmitAnswerRequest = {
        questionId: '  question1  ',
        answerValue: AnswerValue.YES,
        answerText: '  Some text  ',
      };

      gameService.submitAnswer.mockResolvedValue(mockAnswerResponse);
      gameService.getGameState.mockResolvedValue(mockGameStateResponse);

      await controller.submitAnswer(roomCode, mockRequest, submitRequest);

      expect(gameService.submitAnswer).toHaveBeenCalledWith(roomCode, mockUser.id, {
        ...submitRequest,
        questionId: 'question1',
        answerText: 'Some text',
      });
    });

    it('should throw BadRequestException if roomCode is missing', async () => {
      const submitRequest: SubmitAnswerRequest = {
        questionId: 'question1',
        answerValue: AnswerValue.YES,
      };

      await expect(controller.submitAnswer('', mockRequest, submitRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if questionId is missing', async () => {
      const submitRequest: any = {
        answerValue: AnswerValue.YES,
      };

      await expect(
        controller.submitAnswer('ABC12', mockRequest, submitRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if answerValue is missing', async () => {
      const submitRequest: any = {
        questionId: 'question1',
      };

      await expect(
        controller.submitAnswer('ABC12', mockRequest, submitRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if answerValue is invalid', async () => {
      const submitRequest: any = {
        questionId: 'question1',
        answerValue: 'INVALID',
      };

      await expect(
        controller.submitAnswer('ABC12', mockRequest, submitRequest),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.submitAnswer('ABC12', mockRequest, submitRequest),
      ).rejects.toThrow('answerValue must be one of:');
    });
  });

  describe('submitGuess', () => {
    it('should submit a guess successfully', async () => {
      const roomCode = 'ABC12';
      const guessRequest: SubmitGuessRequest = {
        targetPlayerId: 'player2',
        targetCharacterId: 'char1',
      };

      gameService.submitGuess.mockResolvedValue(mockGuessResponse);
      gameService.getGameState.mockResolvedValue(mockGameStateResponse);

      const result = await controller.submitGuess(roomCode, mockRequest, guessRequest);

      expect(result).toEqual(mockGuessResponse);
      expect(gameService.submitGuess).toHaveBeenCalledWith(
        roomCode,
        mockUser.id,
        guessRequest,
      );
      expect(gameService.getGameState).toHaveBeenCalledWith(roomCode);
      expect(broadcastService.broadcastGuessResult).toHaveBeenCalledWith(
        roomCode,
        mockGuessResponse,
        mockGameStateResponse,
      );
    });

    it('should broadcast gameOver when game is completed', async () => {
      const roomCode = 'ABC12';
      const guessRequest: SubmitGuessRequest = {
        targetPlayerId: 'player2',
        targetCharacterId: 'char1',
      };

      const completedGameState = {
        ...mockGameStateResponse,
        status: 'completed' as const,
      };

      gameService.submitGuess.mockResolvedValue(mockGuessResponse);
      gameService.getGameState.mockResolvedValue(completedGameState);

      await controller.submitGuess(roomCode, mockRequest, guessRequest);

      expect(broadcastService.broadcastGuessResult).toHaveBeenCalledWith(
        roomCode,
        mockGuessResponse,
        completedGameState,
      );
      expect(broadcastService.broadcastGameOver).toHaveBeenCalledWith(roomCode);
    });

    it('should trim text fields', async () => {
      const roomCode = 'ABC12';
      const guessRequest: SubmitGuessRequest = {
        targetPlayerId: '  player2  ',
        targetCharacterId: '  char1  ',
      };

      gameService.submitGuess.mockResolvedValue(mockGuessResponse);
      gameService.getGameState.mockResolvedValue(mockGameStateResponse);

      await controller.submitGuess(roomCode, mockRequest, guessRequest);

      expect(gameService.submitGuess).toHaveBeenCalledWith(roomCode, mockUser.id, {
        ...guessRequest,
        targetPlayerId: 'player2',
        targetCharacterId: 'char1',
      });
    });

    it('should throw BadRequestException if roomCode is missing', async () => {
      const guessRequest: SubmitGuessRequest = {
        targetCharacterId: 'char1',
        targetPlayerId: 'player2',
      };

      await expect(controller.submitGuess('', mockRequest, guessRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if targetCharacterId is missing', async () => {
      const guessRequest: any = {
        targetPlayerId: 'player2',
      };

      await expect(
        controller.submitGuess('ABC12', mockRequest, guessRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if targetPlayerId is missing', async () => {
      const guessRequest: any = {
        targetCharacterId: 'char1',
      };

      await expect(
        controller.submitGuess('ABC12', mockRequest, guessRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getGameResults', () => {
    it('should get game results', async () => {
      const roomCode = 'ABC12';

      gameService.getGameOverResult.mockResolvedValue(mockGameOverResult);

      const result = await controller.getGameResults(roomCode);

      expect(result).toEqual(mockGameOverResult);
      expect(gameService.getGameOverResult).toHaveBeenCalledWith(roomCode);
    });

    it('should throw BadRequestException if roomCode is missing', async () => {
      await expect(controller.getGameResults('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
