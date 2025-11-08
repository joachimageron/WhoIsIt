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
import { GameLobbyService } from './game-lobby.service';
import { GamePlayService } from './game-play.service';
import { GameStatsService } from './game-stats.service';
import { GameGateway } from './game.gateway';
import { ConnectionManager } from './connection.manager';
import { BroadcastService } from './broadcast.service';
import { LobbyCleanupService } from './lobby-cleanup.service';

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
    ConnectionManager,
    BroadcastService,
    LobbyCleanupService,
  ],
  exports: [GameService, BroadcastService],
})
export class GameModule {}
