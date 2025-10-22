import { Test, TestingModule } from '@nestjs/testing';
import { CharacterSetsController } from './character-sets.controller';
import { CharacterSetsService } from './character-sets.service';
import { NotFoundException } from '@nestjs/common';
import { CharacterSetResponseDto, CharacterResponseDto } from './dto';

describe('CharacterSetsController', () => {
  let controller: CharacterSetsController;

  const mockCharacterSetsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findCharacters: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharacterSetsController],
      providers: [
        {
          provide: CharacterSetsService,
          useValue: mockCharacterSetsService,
        },
      ],
    }).compile();

    controller = module.get<CharacterSetsController>(CharacterSetsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of character sets', async () => {
      const expectedResult: CharacterSetResponseDto[] = [
        {
          id: 'uuid-1',
          name: 'Classic Characters',
          slug: 'classic-characters',
          description: 'A classic set of diverse characters',
          visibility: 'public',
          isDefault: true,
          metadata: { theme: 'classic' },
          characterCount: 24,
        },
        {
          id: 'uuid-2',
          name: 'Fantasy Heroes',
          slug: 'fantasy-heroes',
          description: 'Fantasy themed characters',
          visibility: 'public',
          isDefault: false,
          metadata: { theme: 'fantasy' },
          characterCount: 12,
        },
      ];

      mockCharacterSetsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockCharacterSetsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no character sets exist', async () => {
      mockCharacterSetsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(mockCharacterSetsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single character set', async () => {
      const setId = 'uuid-1';
      const expectedResult: CharacterSetResponseDto = {
        id: setId,
        name: 'Classic Characters',
        slug: 'classic-characters',
        description: 'A classic set of diverse characters',
        visibility: 'public',
        isDefault: true,
        metadata: { theme: 'classic' },
        characterCount: 24,
      };

      mockCharacterSetsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(setId);

      expect(result).toEqual(expectedResult);
      expect(mockCharacterSetsService.findOne).toHaveBeenCalledWith(setId);
      expect(mockCharacterSetsService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when character set is not found', async () => {
      const setId = 'non-existent-uuid';
      mockCharacterSetsService.findOne.mockRejectedValue(
        new NotFoundException(`Character set with ID ${setId} not found`),
      );

      await expect(controller.findOne(setId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCharacterSetsService.findOne).toHaveBeenCalledWith(setId);
    });
  });

  describe('findCharacters', () => {
    it('should return an array of characters with their traits', async () => {
      const setId = 'uuid-1';
      const expectedResult: CharacterResponseDto[] = [
        {
          id: 'char-1',
          name: 'Alice',
          slug: 'alice',
          imageUrl: null,
          summary: 'Alice is a character in the classic set',
          metadata: {},
          isActive: true,
          traits: [
            {
              id: 'trait-val-1',
              traitId: 'trait-1',
              traitName: 'Gender',
              traitSlug: 'gender',
              valueText: 'Female',
            },
            {
              id: 'trait-val-2',
              traitId: 'trait-2',
              traitName: 'Hair Color',
              traitSlug: 'hair-color',
              valueText: 'Blond',
            },
          ],
        },
        {
          id: 'char-2',
          name: 'Bob',
          slug: 'bob',
          imageUrl: null,
          summary: 'Bob is a character in the classic set',
          metadata: {},
          isActive: true,
          traits: [
            {
              id: 'trait-val-3',
              traitId: 'trait-1',
              traitName: 'Gender',
              traitSlug: 'gender',
              valueText: 'Male',
            },
            {
              id: 'trait-val-4',
              traitId: 'trait-2',
              traitName: 'Hair Color',
              traitSlug: 'hair-color',
              valueText: 'Brown',
            },
          ],
        },
      ];

      mockCharacterSetsService.findCharacters.mockResolvedValue(expectedResult);

      const result = await controller.findCharacters(setId);

      expect(result).toEqual(expectedResult);
      expect(mockCharacterSetsService.findCharacters).toHaveBeenCalledWith(
        setId,
      );
      expect(mockCharacterSetsService.findCharacters).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when character set has no characters', async () => {
      const setId = 'uuid-empty';
      mockCharacterSetsService.findCharacters.mockResolvedValue([]);

      const result = await controller.findCharacters(setId);

      expect(result).toEqual([]);
      expect(mockCharacterSetsService.findCharacters).toHaveBeenCalledWith(
        setId,
      );
    });

    it('should throw NotFoundException when character set is not found', async () => {
      const setId = 'non-existent-uuid';
      mockCharacterSetsService.findCharacters.mockRejectedValue(
        new NotFoundException(`Character set with ID ${setId} not found`),
      );

      await expect(controller.findCharacters(setId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCharacterSetsService.findCharacters).toHaveBeenCalledWith(
        setId,
      );
    });
  });
});
