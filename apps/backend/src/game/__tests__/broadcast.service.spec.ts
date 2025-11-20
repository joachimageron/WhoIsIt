import { Test, TestingModule } from '@nestjs/testing';
import { BroadcastService } from '../services/broadcast.service';
import { GameService } from '../services/game.service';
import { GamePlayService } from '../services/game-play.service';
import { ConnectionManager } from '../gateway/connection.manager';
import { Logger } from '@nestjs/common';
import type {
  GameLobbyResponse,
  QuestionResponse,
  GameStateResponse,
  AnswerResponse,
  GuessResponse,
  GameOverResult,
} from '@whois-it/contracts';
import { AnswerValue } from '../../database/enums';

describe('BroadcastService', () => {
  let service: BroadcastService;
  let gameService: jest.Mocked<GameService>;
  let gamePlayService: jest.Mocked<GamePlayService>;
  let connectionManager: jest.Mocked<ConnectionManager>;
  let mockServer: any;

  const mockLobbyResponse: GameLobbyResponse = {
    id: 'game-1',
    roomCode: 'ABC12',
    status: 'lobby',
    visibility: 'public',
    characterSetId: 'charset-1',
    ruleConfig: {},
    createdAt: new Date().toISOString(),
    players: [
      {
        id: 'player1',
        username: 'Host',
        role: 'host',
        isReady: true,
        avatarUrl: undefined,
        joinedAt: new Date().toISOString(),
      },
      {
        id: 'player2',
        username: 'Player2',
        role: 'player',
        isReady: false,
        avatarUrl: undefined,
        joinedAt: new Date().toISOString(),
      },
    ],
  };

  const mockGameState: GameStateResponse = {
    id: 'game-1',
    roomCode: 'ABC12',
    status: 'in_progress',
    currentRoundNumber: 1,
    currentRoundState: 'awaiting_question',
    players: [],
  };

  const mockQuestion: QuestionResponse = {
    id: 'q1',
    roundId: 'round-1',
    questionText: 'Test question?',
    roundNumber: 1,
    askedByPlayerId: 'player1',
    askedByPlayerUsername: 'Host',
    targetPlayerId: 'player2',
    targetPlayerUsername: 'Player2',
    askedAt: new Date().toISOString(),
  };

  const mockAnswer: AnswerResponse = {
    id: 'a1',
    questionId: 'q1',
    answeredByPlayerId: 'player2',
    answeredByPlayerUsername: 'Player2',
    answerValue: AnswerValue.YES,
    answerText: undefined,
    answeredAt: new Date().toISOString(),
  };

  const mockGuess: GuessResponse = {
    id: 'g1',
    roundId: 'round-1',
    roundNumber: 1,
    guessedByPlayerId: 'player1',
    guessedByPlayerUsername: 'Host',
    targetPlayerId: 'player2',
    targetPlayerUsername: 'Player2',
    targetCharacterId: 'char1',
    targetCharacterName: 'Character 1',
    isCorrect: true,
    guessedAt: new Date().toISOString(),
  };

  const mockGameOverResult: GameOverResult = {
    gameId: 'game-1',
    roomCode: 'ABC12',
    winnerId: 'player1',
    winnerUsername: 'Host',
    totalRounds: 5,
    gameDurationSeconds: 300,
    endReason: 'victory',
    players: [],
  };

  beforeEach(async () => {
    // Create mock server
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const mockGameService = {
      getLobbyByRoomCode: jest.fn(),
      getGameOverResult: jest.fn(),
    };

    const mockGamePlayService = {
      getPlayerCharacter: jest.fn(),
    };

    const mockConnectionManager = {
      getAllConnections: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BroadcastService,
        {
          provide: GameService,
          useValue: mockGameService,
        },
        {
          provide: GamePlayService,
          useValue: mockGamePlayService,
        },
        {
          provide: ConnectionManager,
          useValue: mockConnectionManager,
        },
      ],
    }).compile();

    service = module.get<BroadcastService>(BroadcastService);
    gameService = module.get(GameService);
    gamePlayService = module.get(GamePlayService);
    connectionManager = module.get(ConnectionManager);

    // Set the mock server
    service.setServer(mockServer);

    // Mock the logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setServer', () => {
    it('should set the server instance', async () => {
      const newMockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      service.setServer(newMockServer as any);

      // Test that the server was set by using it
      gameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);
      await service.broadcastLobbyUpdate('ABC12');

      // The new server should be used
      expect(newMockServer.to).toHaveBeenCalled();
    });
  });

  describe('broadcastLobbyUpdate', () => {
    it('should broadcast lobby update to room', async () => {
      gameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);

      await service.broadcastLobbyUpdate('abc12');

      expect(gameService.getLobbyByRoomCode).toHaveBeenCalledWith('ABC12');
      expect(mockServer.to).toHaveBeenCalledWith('ABC12');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'lobbyUpdate',
        mockLobbyResponse,
      );
    });

    it('should normalize room code to uppercase', async () => {
      gameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);

      await service.broadcastLobbyUpdate('  abc12  ');

      expect(gameService.getLobbyByRoomCode).toHaveBeenCalledWith('ABC12');
      expect(mockServer.to).toHaveBeenCalledWith('ABC12');
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Test error');
      gameService.getLobbyByRoomCode.mockRejectedValue(error);

      await service.broadcastLobbyUpdate('ABC12');

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error broadcasting lobby update:',
        error,
      );
    });
  });

  describe('broadcastGameStarted', () => {
    it('should broadcast game started event', async () => {
      gameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);

      await service.broadcastGameStarted('abc12');

      expect(gameService.getLobbyByRoomCode).toHaveBeenCalledWith('ABC12');
      expect(mockServer.to).toHaveBeenCalledWith('ABC12');
      expect(mockServer.emit).toHaveBeenCalledWith('gameStarted', {
        roomCode: 'ABC12',
        lobby: mockLobbyResponse,
      });
    });

    it('should normalize room code', async () => {
      gameService.getLobbyByRoomCode.mockResolvedValue(mockLobbyResponse);

      await service.broadcastGameStarted('  abc12  ');

      expect(gameService.getLobbyByRoomCode).toHaveBeenCalledWith('ABC12');
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Test error');
      gameService.getLobbyByRoomCode.mockRejectedValue(error);

      await service.broadcastGameStarted('ABC12');

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error broadcasting game started:',
        error,
      );
    });
  });

  describe('broadcastQuestionAsked', () => {
    it('should broadcast question asked event', () => {
      service.broadcastQuestionAsked('abc12', mockQuestion, mockGameState);

      expect(mockServer.to).toHaveBeenCalledWith('ABC12');
      expect(mockServer.emit).toHaveBeenCalledWith('questionAsked', {
        roomCode: 'ABC12',
        question: mockQuestion,
        gameState: mockGameState,
      });
    });

    it('should normalize room code', () => {
      service.broadcastQuestionAsked('  abc12  ', mockQuestion, mockGameState);

      expect(mockServer.to).toHaveBeenCalledWith('ABC12');
    });

    it('should handle errors gracefully', () => {
      mockServer.to.mockImplementation(() => {
        throw new Error('Test error');
      });

      service.broadcastQuestionAsked('ABC12', mockQuestion, mockGameState);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error broadcasting question asked:',
        expect.any(Error),
      );
    });
  });

  describe('broadcastAnswerSubmitted', () => {
    it('should broadcast answer submitted event', () => {
      service.broadcastAnswerSubmitted('abc12', mockAnswer, mockGameState);

      expect(mockServer.to).toHaveBeenCalledWith('ABC12');
      expect(mockServer.emit).toHaveBeenCalledWith('answerSubmitted', {
        roomCode: 'ABC12',
        answer: mockAnswer,
        gameState: mockGameState,
      });
    });

    it('should normalize room code', () => {
      service.broadcastAnswerSubmitted('  abc12  ', mockAnswer, mockGameState);

      expect(mockServer.to).toHaveBeenCalledWith('ABC12');
    });

    it('should handle errors gracefully', () => {
      mockServer.to.mockImplementation(() => {
        throw new Error('Test error');
      });

      service.broadcastAnswerSubmitted('ABC12', mockAnswer, mockGameState);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error broadcasting answer submitted:',
        expect.any(Error),
      );
    });
  });

  describe('broadcastGuessResult', () => {
    it('should broadcast guess result event', () => {
      service.broadcastGuessResult('abc12', mockGuess, mockGameState);

      expect(mockServer.to).toHaveBeenCalledWith('ABC12');
      expect(mockServer.emit).toHaveBeenCalledWith('guessResult', {
        roomCode: 'ABC12',
        guess: mockGuess,
        gameState: mockGameState,
      });
    });

    it('should normalize room code', () => {
      service.broadcastGuessResult('  abc12  ', mockGuess, mockGameState);

      expect(mockServer.to).toHaveBeenCalledWith('ABC12');
    });

    it('should log guess result event without sensitive data', () => {
      service.broadcastGuessResult('ABC12', mockGuess, mockGameState);

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Broadcasted guess result to room ABC12',
      );
      expect(Logger.prototype.log).not.toHaveBeenCalledWith(
        expect.stringContaining('correct'),
      );
    });

    it('should handle errors gracefully', () => {
      mockServer.to.mockImplementation(() => {
        throw new Error('Test error');
      });

      service.broadcastGuessResult('ABC12', mockGuess, mockGameState);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error broadcasting guess result:',
        expect.any(Error),
      );
    });
  });

  describe('broadcastGameOver', () => {
    it('should broadcast game over event', async () => {
      gameService.getGameOverResult.mockResolvedValue(mockGameOverResult);

      await service.broadcastGameOver('abc12');

      expect(gameService.getGameOverResult).toHaveBeenCalledWith('ABC12');
      expect(mockServer.to).toHaveBeenCalledWith('ABC12');
      expect(mockServer.emit).toHaveBeenCalledWith('gameOver', {
        roomCode: 'ABC12',
        result: mockGameOverResult,
      });
    });

    it('should normalize room code', async () => {
      gameService.getGameOverResult.mockResolvedValue(mockGameOverResult);

      await service.broadcastGameOver('  abc12  ');

      expect(gameService.getGameOverResult).toHaveBeenCalledWith('ABC12');
    });

    it('should log game over event without sensitive data', async () => {
      gameService.getGameOverResult.mockResolvedValue(mockGameOverResult);

      await service.broadcastGameOver('ABC12');

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Broadcasted game over to room ABC12',
      );
      expect(Logger.prototype.log).not.toHaveBeenCalledWith(
        expect.stringContaining('winner'),
      );
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Test error');
      gameService.getGameOverResult.mockRejectedValue(error);

      await service.broadcastGameOver('ABC12');

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error broadcasting game over:',
        error,
      );
    });
  });
});
