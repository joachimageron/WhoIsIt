import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CharacterSetsService } from './character-sets.service';
import { CharacterSet } from '../../database/entities/character-set.entity';
import { Character } from '../../database/entities/character.entity';
import { GameVisibility } from '../../database/enums';

describe('CharacterSetsService', () => {
  let service: CharacterSetsService;

  const mockCharacterSetRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockCharacterRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterSetsService,
        {
          provide: getRepositoryToken(CharacterSet),
          useValue: mockCharacterSetRepository,
        },
        {
          provide: getRepositoryToken(Character),
          useValue: mockCharacterRepository,
        },
      ],
    }).compile();

    service = module.get<CharacterSetsService>(CharacterSetsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of character sets with character counts', async () => {
      const mockCharacterSets: Partial<CharacterSet>[] = [
        {
          id: 'uuid-1',
          name: 'Classic Characters',
          slug: 'classic-characters',
          description: 'A classic set of diverse characters',
          visibility: GameVisibility.PUBLIC,
          isDefault: true,
          metadata: { theme: 'classic' },
          characters: [{}, {}, {}, {}] as Character[], // 4 characters
        },
        {
          id: 'uuid-2',
          name: 'Fantasy Heroes',
          slug: 'fantasy-heroes',
          description: 'Fantasy themed characters',
          visibility: GameVisibility.PUBLIC,
          isDefault: false,
          metadata: { theme: 'fantasy' },
          characters: [{}, {}] as Character[], // 2 characters
        },
      ];

      mockCharacterSetRepository.find.mockResolvedValue(mockCharacterSets);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'uuid-1',
        name: 'Classic Characters',
        slug: 'classic-characters',
        description: 'A classic set of diverse characters',
        visibility: GameVisibility.PUBLIC,
        isDefault: true,
        metadata: { theme: 'classic' },
        characterCount: 4,
      });
      expect(result[1].characterCount).toBe(2);
      expect(mockCharacterSetRepository.find).toHaveBeenCalledWith({
        relations: ['characters'],
        order: { isDefault: 'DESC', name: 'ASC' },
      });
    });

    it('should return character sets ordered by isDefault DESC and name ASC', async () => {
      const mockCharacterSets: Partial<CharacterSet>[] = [
        {
          id: 'uuid-default',
          name: 'Zebra Set',
          slug: 'zebra-set',
          description: 'Default set',
          visibility: GameVisibility.PUBLIC,
          isDefault: true,
          metadata: {},
          characters: [],
        },
        {
          id: 'uuid-non-default',
          name: 'Alpha Set',
          slug: 'alpha-set',
          description: 'Non-default set',
          visibility: GameVisibility.PUBLIC,
          isDefault: false,
          metadata: {},
          characters: [],
        },
      ];

      mockCharacterSetRepository.find.mockResolvedValue(mockCharacterSets);

      await service.findAll();

      // Verify the repository was called with correct order
      expect(mockCharacterSetRepository.find).toHaveBeenCalledWith({
        relations: ['characters'],
        order: { isDefault: 'DESC', name: 'ASC' },
      });
    });

    it('should handle character sets with no characters', async () => {
      const mockCharacterSets: Partial<CharacterSet>[] = [
        {
          id: 'uuid-empty',
          name: 'Empty Set',
          slug: 'empty-set',
          description: 'Set with no characters',
          visibility: GameVisibility.PUBLIC,
          isDefault: false,
          metadata: {},
          characters: [],
        },
      ];

      mockCharacterSetRepository.find.mockResolvedValue(mockCharacterSets);

      const result = await service.findAll();

      expect(result[0].characterCount).toBe(0);
    });

    it('should handle character sets with undefined characters array', async () => {
      const mockCharacterSets: Partial<CharacterSet>[] = [
        {
          id: 'uuid-undefined',
          name: 'Set Without Characters',
          slug: 'set-without-characters',
          description: 'Set with undefined characters',
          visibility: GameVisibility.PUBLIC,
          isDefault: false,
          metadata: {},
          characters: undefined,
        },
      ];

      mockCharacterSetRepository.find.mockResolvedValue(mockCharacterSets);

      const result = await service.findAll();

      expect(result[0].characterCount).toBe(0);
    });

    it('should return an empty array when no character sets exist', async () => {
      mockCharacterSetRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a character set by id', async () => {
      const setId = 'uuid-1';
      const mockCharacterSet: Partial<CharacterSet> = {
        id: setId,
        name: 'Classic Characters',
        slug: 'classic-characters',
        description: 'A classic set',
        visibility: GameVisibility.PUBLIC,
        isDefault: true,
        metadata: { theme: 'classic' },
        characters: [{}, {}, {}] as Character[],
      };

      mockCharacterSetRepository.findOne.mockResolvedValue(mockCharacterSet);

      const result = await service.findOne(setId);

      expect(result).toEqual({
        id: setId,
        name: 'Classic Characters',
        slug: 'classic-characters',
        description: 'A classic set',
        visibility: GameVisibility.PUBLIC,
        isDefault: true,
        metadata: { theme: 'classic' },
        characterCount: 3,
      });
      expect(mockCharacterSetRepository.findOne).toHaveBeenCalledWith({
        where: { id: setId },
        relations: ['characters'],
      });
    });

    it('should throw NotFoundException when character set is not found', async () => {
      const setId = 'non-existent-uuid';
      mockCharacterSetRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(setId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(setId)).rejects.toThrow(
        `Character set with ID ${setId} not found`,
      );
    });
  });

  describe('findCharacters', () => {
    it('should return characters', async () => {
      const setId = 'uuid-1';
      const mockCharacterSet: Partial<CharacterSet> = {
        id: setId,
        name: 'Classic Characters',
      };

      const mockCharacters: Partial<Character>[] = [
        {
          id: 'char-1',
          name: 'Alice',
          slug: 'alice',
          imageUrl: null,
          summary: 'Alice is a character',
          metadata: {},
          isActive: true,
        },
        {
          id: 'char-2',
          name: 'Bob',
          slug: 'bob',
          imageUrl: null,
          summary: 'Bob is a character',
          metadata: {},
          isActive: true,
        },
      ];

      mockCharacterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      mockCharacterRepository.find.mockResolvedValue(mockCharacters);

      const result = await service.findCharacters(setId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'char-1',
        name: 'Alice',
        slug: 'alice',
        imageUrl: null,
        summary: 'Alice is a character',
        metadata: {},
        isActive: true,
      });

      expect(mockCharacterRepository.find).toHaveBeenCalledWith({
        where: { set: { id: setId }, isActive: true },
        order: { name: 'ASC' },
      });
    });

    it('should return only active characters', async () => {
      const setId = 'uuid-1';
      const mockCharacterSet: Partial<CharacterSet> = {
        id: setId,
        name: 'Classic Characters',
      };

      mockCharacterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      mockCharacterRepository.find.mockResolvedValue([]);

      await service.findCharacters(setId);

      // Verify that the query filters by isActive: true
      expect(mockCharacterRepository.find).toHaveBeenCalledWith({
        where: { set: { id: setId }, isActive: true },
        order: { name: 'ASC' },
      });
    });

    it('should return empty array when character set has no active characters', async () => {
      const setId = 'uuid-empty';
      const mockCharacterSet: Partial<CharacterSet> = {
        id: setId,
        name: 'Empty Set',
      };

      mockCharacterSetRepository.findOne.mockResolvedValue(mockCharacterSet);
      mockCharacterRepository.find.mockResolvedValue([]);

      const result = await service.findCharacters(setId);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when character set does not exist', async () => {
      const setId = 'non-existent-uuid';
      mockCharacterSetRepository.findOne.mockResolvedValue(null);

      await expect(service.findCharacters(setId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findCharacters(setId)).rejects.toThrow(
        `Character set with ID ${setId} not found`,
      );

      // Verify that we don't even try to fetch characters if the set doesn't exist
      expect(mockCharacterRepository.find).not.toHaveBeenCalled();
    });
  });
});
