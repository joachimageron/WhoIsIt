import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CharacterSet,
  Game,
  GamePlayer,
  User,
  Round,
  PlayerSecret,
  Character,
  Question,
  Answer,
  Guess,
  PlayerStats,
} from '../database/entities';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
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
    ]),
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}
