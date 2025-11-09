import { Test, TestingModule } from '@nestjs/testing';
import { GameModule } from './game.module';
import { GameController } from './game.controller';
import { GameService } from './services/game.service';
import { GameLobbyService } from './services/game-lobby.service';
import { GamePlayService } from './services/game-play.service';
import { GameStatsService } from './services/game-stats.service';
import { GameGateway } from './gateway/game.gateway';
import { ConnectionManager } from './gateway/connection.manager';
import { BroadcastService } from './services/broadcast.service';
import { LobbyCleanupService } from './services/lobby-cleanup.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Game,
  GamePlayer,
  CharacterSet,
  User,
  Round,
  PlayerSecret,
  Character,
  Question,
  Answer,
  Guess,
  PlayerStats,
} from '../database/entities';

describe('GameModule', () => {
  let module: TestingModule;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [GameModule],
    })
      .overrideProvider(getRepositoryToken(Game))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(GamePlayer))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(CharacterSet))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(Round))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(PlayerSecret))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(Character))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(Question))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(Answer))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(Guess))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(PlayerStats))
      .useValue(mockRepository)
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide GameController', () => {
    const controller = module.get<GameController>(GameController);
    expect(controller).toBeDefined();
  });

  it('should provide GameService', () => {
    const service = module.get<GameService>(GameService);
    expect(service).toBeDefined();
  });

  it('should provide GameLobbyService', () => {
    const service = module.get<GameLobbyService>(GameLobbyService);
    expect(service).toBeDefined();
  });

  it('should provide GamePlayService', () => {
    const service = module.get<GamePlayService>(GamePlayService);
    expect(service).toBeDefined();
  });

  it('should provide GameStatsService', () => {
    const service = module.get<GameStatsService>(GameStatsService);
    expect(service).toBeDefined();
  });

  it('should provide GameGateway', () => {
    const gateway = module.get<GameGateway>(GameGateway);
    expect(gateway).toBeDefined();
  });

  it('should provide ConnectionManager', () => {
    const manager = module.get<ConnectionManager>(ConnectionManager);
    expect(manager).toBeDefined();
  });

  it('should provide BroadcastService', () => {
    const service = module.get<BroadcastService>(BroadcastService);
    expect(service).toBeDefined();
  });

  it('should provide LobbyCleanupService', () => {
    const service = module.get<LobbyCleanupService>(LobbyCleanupService);
    expect(service).toBeDefined();
  });

  it('should export GameService', () => {
    const service = module.get<GameService>(GameService);
    expect(service).toBeDefined();
  });

  it('should export BroadcastService', () => {
    const service = module.get<BroadcastService>(BroadcastService);
    expect(service).toBeDefined();
  });
});
