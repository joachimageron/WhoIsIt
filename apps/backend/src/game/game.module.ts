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
import { GameLobbyService } from './game-lobby.service';
import { GamePlayService } from './game-play.service';
import { GameStatsService } from './game-stats.service';

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
  providers: [
    GameService,
    GameLobbyService,
    GamePlayService,
    GameStatsService,
    GameGateway,
  ],
  exports: [GameService],
})
export class GameModule {}
