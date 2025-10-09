import { Controller, Get, Param } from '@nestjs/common';
import { CharacterSetsService } from './character-sets.service';
import {
  CharacterSetResponseDto,
  CharacterResponseDto,
} from './dto';

@Controller('character-sets')
export class CharacterSetsController {
  constructor(private readonly characterSetsService: CharacterSetsService) {}

  @Get()
  async findAll(): Promise<CharacterSetResponseDto[]> {
    return this.characterSetsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CharacterSetResponseDto> {
    return this.characterSetsService.findOne(id);
  }

  @Get(':id/characters')
  async findCharacters(
    @Param('id') id: string,
  ): Promise<CharacterResponseDto[]> {
    return this.characterSetsService.findCharacters(id);
  }
}
