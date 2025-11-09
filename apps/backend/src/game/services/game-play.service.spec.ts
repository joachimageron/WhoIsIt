import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GamePlayService } from './game-play.service';
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
import { GameLobbyService } from './game-lobby.service';

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
    status: GameStatus.ACTIVE,
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
      expect(result.status).toBe(GameStatus.ACTIVE);
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
  });

  describe('submitAnswer', () => {
    it('should throw NotFoundException if game not found', async () => {
      const request = {
        playerId: 'player-1',
        questionId: 'invalid-question',
        value: AnswerValue.YES,
      };

      gameRepository.findOne.mockResolvedValue(null);

      await expect(service.submitAnswer('INVALID', request)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('submitGuess', () => {
    it('should throw NotFoundException if game not found', async () => {
      const request = {
        guessingPlayerId: 'player-1',
        targetPlayerId: 'player-2',
        characterId: 'char-1',
      };

      gameRepository.findOne.mockResolvedValue(null);

      await expect(
        service.submitGuess('INVALID', request),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPlayerCharacter', () => {
    it('should throw NotFoundException if game not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPlayerCharacter('INVALID', 'player-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getQuestions', () => {
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
});
