import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacterSet } from '../database/entities/character-set.entity';
import { Character } from '../database/entities/character.entity';
import { CharacterSetsController } from './character-sets.controller';
import { CharacterSetsService } from './character-sets.service';

@Module({
  imports: [TypeOrmModule.forFeature([CharacterSet, Character])],
  controllers: [CharacterSetsController],
  providers: [CharacterSetsService],
  exports: [CharacterSetsService],
})
export class CharacterSetsModule {}
