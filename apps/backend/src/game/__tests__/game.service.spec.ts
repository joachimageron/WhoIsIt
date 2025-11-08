import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameService } from '../services/game.service';
import { GameLobbyService } from '../services/game-lobby.service';
import { GamePlayService } from '../services/game-play.service';
import { GameStatsService } from '../services/game-stats.service';
import { Game } from '../../database/entities';
import { GameStatus } from '../../database/enums';

describe('GameService', () => {
  let service: GameService;
  let gameLobbyService: GameLobbyService;
  let gamePlayService: GamePlayService;
  let gameStatsService: GameStatsService;

  const mockGameRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    manager: {
      findOne: jest.fn(),
    },
  };

  const mockGameLobbyService = {
    normalizeRoomCode: jest.fn((code: string) => code.trim().toUpperCase()),
    createGame: jest.fn(),
    joinGame: jest.fn(),
    getLobbyByRoomCode: jest.fn(),
    updatePlayerReady: jest.fn(),
    markPlayerAsLeft: jest.fn(),
  };

  const mockGamePlayService = {
    initializeFirstRound: jest.fn(),
    assignSecretCharacters: jest.fn(),
    getGameState: jest.fn(),
    askQuestion: jest.fn(),
    getQuestions: jest.fn(),
    getAnswers: jest.fn(),
    submitAnswer: jest.fn(),
    submitGuess: jest.fn(),
    getPlayerCharacter: jest.fn(),
    handleGuessResult: jest.fn(),
    advanceToNextTurn: jest.fn(),
  };

  const mockGameStatsService = {
    checkAndHandleGameEnd: jest.fn(),
    getGameOverResult: jest.fn(),
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
          provide: GameLobbyService,
          useValue: mockGameLobbyService,
        },
        {
          provide: GamePlayService,
          useValue: mockGamePlayService,
        },
        {
          provide: GameStatsService,
          useValue: mockGameStatsService,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    gameLobbyService = module.get<GameLobbyService>(GameLobbyService);
    gamePlayService = module.get<GamePlayService>(GamePlayService);
    gameStatsService = module.get<GameStatsService>(GameStatsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGame', () => {
    it('should delegate to GameLobbyService', async () => {
      const createRequest = {
        characterSetId: 'char-set-123',
        hostUsername: 'Test User',
      };

      const expectedResult = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
      };

      mockGameLobbyService.createGame.mockResolvedValue(expectedResult);

      const result = await service.createGame(createRequest);

      expect(result).toBe(expectedResult);
      expect(mockGameLobbyService.createGame).toHaveBeenCalledWith(
        createRequest,
      );
    });
  });

  describe('joinGame', () => {
    it('should delegate to GameLobbyService', async () => {
      const roomCode = 'ABC12';
      const joinRequest = { username: 'Player' };
      const expectedResult = { id: 'game-123' };

      mockGameLobbyService.joinGame.mockResolvedValue(expectedResult);

      const result = await service.joinGame(roomCode, joinRequest);

      expect(result).toBe(expectedResult);
      expect(mockGameLobbyService.joinGame).toHaveBeenCalledWith(
        roomCode,
        joinRequest,
      );
    });
  });

  describe('getLobbyByRoomCode', () => {
    it('should delegate to GameLobbyService', async () => {
      const roomCode = 'ABC12';
      const expectedResult = { id: 'game-123' };

      mockGameLobbyService.getLobbyByRoomCode.mockResolvedValue(expectedResult);

      const result = await service.getLobbyByRoomCode(roomCode);

      expect(result).toBe(expectedResult);
      expect(mockGameLobbyService.getLobbyByRoomCode).toHaveBeenCalledWith(
        roomCode,
      );
    });
  });

  describe('getGameByRoomCode', () => {
    it('should get game from repository with normalized room code', async () => {
      const roomCode = 'abc12';
      const expectedGame = { id: 'game-123', roomCode: 'ABC12' };

      mockGameLobbyService.normalizeRoomCode.mockReturnValue('ABC12');
      mockGameRepository.findOne.mockResolvedValue(expectedGame);

      const result = await service.getGameByRoomCode(roomCode);

      expect(result).toBe(expectedGame);
      expect(mockGameLobbyService.normalizeRoomCode).toHaveBeenCalledWith(
        roomCode,
      );
      expect(mockGameRepository.findOne).toHaveBeenCalledWith({
        where: { roomCode: 'ABC12' },
        relations: {
          characterSet: true,
          host: true,
          players: { user: true },
        },
      });
    });
  });

  describe('updatePlayerReady', () => {
    it('should delegate to GameLobbyService', async () => {
      const playerId = 'player-123';
      const isReady = true;
      const expectedResult = { id: playerId, isReady };

      mockGameLobbyService.updatePlayerReady.mockResolvedValue(expectedResult);

      const result = await service.updatePlayerReady(playerId, isReady);

      expect(result).toBe(expectedResult);
      expect(mockGameLobbyService.updatePlayerReady).toHaveBeenCalledWith(
        playerId,
        isReady,
      );
    });
  });

  describe('markPlayerAsLeft', () => {
    it('should delegate to GameLobbyService', async () => {
      const playerId = 'player-123';
      const expectedResult = { id: playerId, leftAt: new Date() };

      mockGameLobbyService.markPlayerAsLeft.mockResolvedValue(expectedResult);

      const result = await service.markPlayerAsLeft(playerId);

      expect(result).toBe(expectedResult);
      expect(mockGameLobbyService.markPlayerAsLeft).toHaveBeenCalledWith(
        playerId,
      );
    });
  });

  describe('startGame', () => {
    it('should start game and initialize gameplay', async () => {
      const roomCode = 'ABC12';
      const mockGame = {
        id: 'game-123',
        roomCode: 'ABC12',
        status: GameStatus.LOBBY,
        players: [
          { id: 'p1', isReady: true },
          { id: 'p2', isReady: true },
        ],
        characterSet: { id: 'cs-123' },
      };

      mockGameLobbyService.normalizeRoomCode.mockReturnValue('ABC12');
      mockGameRepository.findOne.mockResolvedValue(mockGame);
      mockGameRepository.save.mockResolvedValue({
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
      });
      mockGamePlayService.initializeFirstRound.mockResolvedValue({});
      mockGamePlayService.assignSecretCharacters.mockResolvedValue(undefined);
      mockGameLobbyService.getLobbyByRoomCode.mockResolvedValue({
        ...mockGame,
        status: GameStatus.IN_PROGRESS,
      });

      const result = await service.startGame(roomCode);

      expect(result.status).toBe(GameStatus.IN_PROGRESS);
      expect(mockGamePlayService.initializeFirstRound).toHaveBeenCalledWith(
        mockGame,
      );
      expect(mockGamePlayService.assignSecretCharacters).toHaveBeenCalledWith(
        mockGame,
      );
    });
  });

  describe('getGameState', () => {
    it('should delegate to GamePlayService', async () => {
      const roomCode = 'ABC12';
      const expectedResult = { id: 'game-123', status: GameStatus.IN_PROGRESS };

      mockGamePlayService.getGameState.mockResolvedValue(expectedResult);

      const result = await service.getGameState(roomCode);

      expect(result).toBe(expectedResult);
      expect(mockGamePlayService.getGameState).toHaveBeenCalledWith(roomCode);
    });
  });

  describe('askQuestion', () => {
    it('should delegate to GamePlayService', async () => {
      const roomCode = 'ABC12';
      const request = { playerId: 'p1', questionText: 'Is it red?' };
      const expectedResult = { id: 'q-123' };

      mockGamePlayService.askQuestion.mockResolvedValue(expectedResult);

      const result = await service.askQuestion(roomCode, request);

      expect(result).toBe(expectedResult);
      expect(mockGamePlayService.askQuestion).toHaveBeenCalledWith(
        roomCode,
        request,
      );
    });
  });

  describe('getQuestions', () => {
    it('should delegate to GamePlayService', async () => {
      const roomCode = 'ABC12';
      const expectedResult = [{ id: 'q-123' }];

      mockGamePlayService.getQuestions.mockResolvedValue(expectedResult);

      const result = await service.getQuestions(roomCode);

      expect(result).toBe(expectedResult);
      expect(mockGamePlayService.getQuestions).toHaveBeenCalledWith(roomCode);
    });
  });

  describe('getAnswers', () => {
    it('should delegate to GamePlayService', async () => {
      const roomCode = 'ABC12';
      const expectedResult = [{ id: 'a-123' }];

      mockGamePlayService.getAnswers.mockResolvedValue(expectedResult);

      const result = await service.getAnswers(roomCode);

      expect(result).toBe(expectedResult);
      expect(mockGamePlayService.getAnswers).toHaveBeenCalledWith(roomCode);
    });
  });

  describe('submitAnswer', () => {
    it('should delegate to GamePlayService', async () => {
      const roomCode = 'ABC12';
      const request = { playerId: 'p1', questionId: 'q1', answerValue: 'yes' };
      const expectedResult = { id: 'a-123' };

      mockGamePlayService.submitAnswer.mockResolvedValue(expectedResult);

      const result = await service.submitAnswer(roomCode, request);

      expect(result).toBe(expectedResult);
      expect(mockGamePlayService.submitAnswer).toHaveBeenCalledWith(
        roomCode,
        request,
      );
    });
  });

  describe('getPlayerCharacter', () => {
    it('should delegate to GamePlayService', async () => {
      const roomCode = 'ABC12';
      const playerId = 'p1';
      const expectedResult = { playerId: 'p1', character: { id: 'c1' } };

      mockGamePlayService.getPlayerCharacter.mockResolvedValue(expectedResult);

      const result = await service.getPlayerCharacter(roomCode, playerId);

      expect(result).toBe(expectedResult);
      expect(mockGamePlayService.getPlayerCharacter).toHaveBeenCalledWith(
        roomCode,
        playerId,
      );
    });
  });

  describe('getGameOverResult', () => {
    it('should delegate to GameStatsService', async () => {
      const roomCode = 'ABC12';
      const expectedResult = { gameId: 'game-123', winnerId: 'p1' };

      mockGameStatsService.getGameOverResult.mockResolvedValue(expectedResult);

      const result = await service.getGameOverResult(roomCode);

      expect(result).toBe(expectedResult);
      expect(mockGameStatsService.getGameOverResult).toHaveBeenCalledWith(
        roomCode,
      );
    });
  });
});
