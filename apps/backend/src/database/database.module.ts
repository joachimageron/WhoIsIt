import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Answer,
  Character,
  CharacterSet,
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
  User,
} from './entities';

export const DATABASE_ENTITIES = [
  Answer,
  Character,
  CharacterSet,
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
  User,
];

@Module({
  imports: [TypeOrmModule.forFeature(DATABASE_ENTITIES)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
