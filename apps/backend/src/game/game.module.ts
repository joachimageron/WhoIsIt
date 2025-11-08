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
import { GameController } from './controllers/game.controller';
import { GameService } from './services/game.service';
import { GameLobbyService } from './services/game-lobby.service';
import { GamePlayService } from './services/game-play.service';
import { GameStatsService } from './services/game-stats.service';
import { GameGateway } from './gateway/game.gateway';
import { ConnectionManager } from './gateway/connection.manager';
import { BroadcastService } from './gateway/broadcast.service';
import { LobbyCleanupService } from './gateway/lobby-cleanup.service';

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
