import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Answer,
  Character,
  CharacterSet,
  CharacterTraitValue,
  Game,
  GameConfigSnapshot,
  GameEvent,
  GameInvite,
  GamePlayer,
  Guess,
  PlayerPanel,
  PlayerSecret,
  PlayerStats,
  Question,
  Round,
  Trait,
  TraitValue,
  User,
} from './entities';

export const DATABASE_ENTITIES = [
  Answer,
  Character,
  CharacterSet,
  CharacterTraitValue,
  Game,
  GameConfigSnapshot,
  GameEvent,
  GameInvite,
  GamePlayer,
  Guess,
  PlayerPanel,
  PlayerSecret,
  PlayerStats,
  Question,
  Round,
  Trait,
  TraitValue,
  User,
];

@Module({
  imports: [TypeOrmModule.forFeature(DATABASE_ENTITIES)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
