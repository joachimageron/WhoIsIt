import { Test, TestingModule } from '@nestjs/testing';
import { CharacterSetsModule } from './character-sets.module';
import { CharacterSetsController } from './character-sets.controller';
import { CharacterSetsService } from './character-sets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CharacterSet, Character } from '../../database/entities';

describe('CharacterSetsModule', () => {
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
      imports: [CharacterSetsModule],
    })
      .overrideProvider(getRepositoryToken(CharacterSet))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(Character))
      .useValue(mockRepository)
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide CharacterSetsController', () => {
    const controller = module.get<CharacterSetsController>(
      CharacterSetsController,
    );
    expect(controller).toBeDefined();
  });

  it('should provide CharacterSetsService', () => {
    const service = module.get<CharacterSetsService>(CharacterSetsService);
    expect(service).toBeDefined();
  });

  it('should export CharacterSetsService', () => {
    const service = module.get<CharacterSetsService>(CharacterSetsService);
    expect(service).toBeDefined();
  });
});
