import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CharacterSet } from '../database/entities/character-set.entity';
import { Character } from '../database/entities/character.entity';
import {
  CharacterSetResponseDto,
  CharacterResponseDto,
  TraitValueResponseDto,
} from './dto';

@Injectable()
export class CharacterSetsService {
  constructor(
    @InjectRepository(CharacterSet)
    private characterSetRepository: Repository<CharacterSet>,
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
  ) {}

  async findAll(): Promise<CharacterSetResponseDto[]> {
    const characterSets = await this.characterSetRepository.find({
      relations: ['characters'],
      order: { isDefault: 'DESC', name: 'ASC' },
    });

    return characterSets.map((set) => ({
      id: set.id,
      name: set.name,
      slug: set.slug,
      description: set.description,
      visibility: set.visibility,
      isDefault: set.isDefault,
      metadata: set.metadata,
      characterCount: set.characters?.length ?? 0,
    }));
  }

  async findOne(id: string): Promise<CharacterSetResponseDto> {
    const characterSet = await this.characterSetRepository.findOne({
      where: { id },
      relations: ['characters'],
    });

    if (!characterSet) {
      throw new NotFoundException(`Character set with ID ${id} not found`);
    }

    return {
      id: characterSet.id,
      name: characterSet.name,
      slug: characterSet.slug,
      description: characterSet.description,
      visibility: characterSet.visibility,
      isDefault: characterSet.isDefault,
      metadata: characterSet.metadata,
      characterCount: characterSet.characters?.length ?? 0,
    };
  }

  async findCharacters(setId: string): Promise<CharacterResponseDto[]> {
    // First verify the character set exists
    const characterSet = await this.characterSetRepository.findOne({
      where: { id: setId },
    });

    if (!characterSet) {
      throw new NotFoundException(`Character set with ID ${setId} not found`);
    }

    const characters = await this.characterRepository.find({
      where: { set: { id: setId }, isActive: true },
      relations: [
        'traitValues',
        'traitValues.traitValue',
        'traitValues.traitValue.trait',
      ],
      order: { name: 'ASC' },
    });

    return characters.map((character) => ({
      id: character.id,
      name: character.name,
      slug: character.slug,
      imageUrl: character.imageUrl,
      summary: character.summary,
      metadata: character.metadata,
      isActive: character.isActive,
      traits:
        character.traitValues?.map((ctv) => ({
          id: ctv.traitValue.id,
          traitId: ctv.traitValue.trait.id,
          traitName: ctv.traitValue.trait.name,
          traitSlug: ctv.traitValue.trait.slug,
          valueText: ctv.traitValue.valueText,
        })) ?? [],
    }));
  }
}
