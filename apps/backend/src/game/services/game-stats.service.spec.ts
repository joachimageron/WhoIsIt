import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GameStatsService } from './game-stats.service';
import { GameLobbyService } from './game-lobby.service';
import {
  Game,
  GamePlayer,
  PlayerStats,
  PlayerSecret,
  Round,
} from '../../database/entities';
import { GameStatus } from '../../database/enums';

describe('GameStatsService', () => {
  let service: GameStatsService;
  let gameRepository: any;
  let playerRepository: any;
  let playerStatsRepository: any;
  let playerSecretRepository: any;
  let roundRepository: any;

  const mockPlayer = {
    id: 'player-1',
    username: 'testplayer',
    user: { id: 'user-1' },
  } as GamePlayer;

  const mockGame = {
    id: 'game-1',
    roomCode: 'ABC12',
    status: GameStatus.ACTIVE,
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
      createQueryBuilder: jest.fn(() => ({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getOne: jest.fn().mockResolvedValue(null),
      })),
    };

    roundRepository = {
      find: jest.fn(),
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
        status: GameStatus.ACTIVE,
      };

      const result = await service.checkAndHandleGameEnd(game);

      expect(result).toBe(false);
    });
  });

  describe('getGameOverResult', () => {
    it('should throw NotFoundException if game not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getGameOverResult('invalid-room-code'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
