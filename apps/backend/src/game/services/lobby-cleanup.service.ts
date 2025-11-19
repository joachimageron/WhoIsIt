import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { GameService } from './game.service';
import { ConnectionManager } from '../gateway/connection.manager';
import { GameStatus } from '../../database/enums';
import { Game } from '../../database/entities';
import type { TypedServer } from '../gateway/types';

@Injectable()
export class LobbyCleanupService implements OnModuleDestroy {
  private readonly logger = new Logger(LobbyCleanupService.name);
  private cleanupInterval?: NodeJS.Timeout;
  private server!: TypedServer;

  // Timeout after which inactive lobbies are cleaned up (1 hour)
  private readonly LOBBY_TIMEOUT_MS = 60 * 60 * 1000;
  // Timeout after which completed/aborted games are cleaned up (7 days)
  private readonly COMPLETED_GAME_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
  // Interval for checking inactive lobbies (5 minutes)
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    private readonly gameService: GameService,
    private readonly connectionManager: ConnectionManager,
  ) { }

  /**
   * Set the Socket.IO server instance
   */
  setServer(server: TypedServer) {
    this.server = server;
  }

  /**
   * Start periodic cleanup of abandoned lobbies
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      void this.cleanupAbandonedLobbies();
      void this.cleanupCompletedGames();
    }, this.CLEANUP_INTERVAL_MS);

    this.logger.log(
      `Started lobby cleanup task (interval: ${this.CLEANUP_INTERVAL_MS / 1000}s, lobby timeout: ${this.LOBBY_TIMEOUT_MS / 1000 / 60}m, completed game timeout: ${this.COMPLETED_GAME_TIMEOUT_MS / 1000 / 60 / 60 / 24}d)`,
    );
  }

  /**
   * Clean up lobbies that have been inactive for too long
   */
  private async cleanupAbandonedLobbies() {
    try {
      const now = new Date();

      // Find lobbies that haven't had any activity (no connected users)
      const inactiveLobbyRooms = new Set<string>();

      // Check which rooms have no active connections
      this.server.sockets.adapter.rooms.forEach((sockets, roomCode) => {
        // Skip default rooms (socket IDs)
        if (sockets.has(roomCode)) {
          return;
        }

        // Check if this room has any active users
        const hasActiveUsers = Array.from(sockets).some((socketId) => {
          const connection = this.connectionManager.getConnection(socketId);
          return connection && connection.roomCode === roomCode;
        });

        if (!hasActiveUsers) {
          inactiveLobbyRooms.add(roomCode);
        }
      });

      if (inactiveLobbyRooms.size > 0) {
        this.logger.log(
          `Found ${inactiveLobbyRooms.size} potentially inactive lobbies`,
        );

        for (const roomCode of inactiveLobbyRooms) {
          try {
            // Check if the game is in lobby state and is old enough
            const game = await this.gameService.getGameByRoomCode(roomCode);

            if (!game) {
              continue;
            }

            const gameAge = now.getTime() - game.createdAt.getTime();

            // Only cleanup lobbies (not started games) that are old enough
            if (
              game.status === GameStatus.LOBBY &&
              gameAge > this.LOBBY_TIMEOUT_MS
            ) {
              this.logger.log(
                `Cleaning up abandoned lobby: ${roomCode} (age: ${Math.floor(gameAge / 1000 / 60)}m)`,
              );

              // Delete the game from the database
              // Note: Player stats are not relevant for lobby games since they never started
              await this.gameRepository.remove(game);
              this.logger.log(`Deleted abandoned lobby: ${roomCode}`);
            }
          } catch (error) {
            this.logger.error(
              `Error checking lobby ${roomCode} for cleanup:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Error in cleanupAbandonedLobbies:', error);
    }
  }

  /**
   * Clean up completed or aborted games after 7 days
   * Note: Player statistics are already saved in the player_stats table
   * when a game ends (handled by GameStatsService.updatePlayerStatistics)
   */
  private async cleanupCompletedGames() {
    try {
      const cutoffDate = new Date(Date.now() - this.COMPLETED_GAME_TIMEOUT_MS);

      // Find completed or aborted games older than 7 days
      const oldGames = await this.gameRepository.find({
        where: [
          {
            status: GameStatus.COMPLETED,
            endedAt: LessThan(cutoffDate),
          },
          {
            status: GameStatus.ABORTED,
            endedAt: LessThan(cutoffDate),
          },
        ],
      });

      if (oldGames.length > 0) {
        this.logger.log(
          `Found ${oldGames.length} completed/aborted games older than 7 days`,
        );

        for (const game of oldGames) {
          try {
            const gameAge = Math.floor(
              (Date.now() - (game.endedAt?.getTime() ?? 0)) /
              1000 /
              60 /
              60 /
              24,
            );
            this.logger.log(
              `Cleaning up completed game: ${game.roomCode} (status: ${game.status}, age: ${gameAge}d)`,
            );

            // Delete the game from the database
            // Player stats are already archived in player_stats table
            await this.gameRepository.remove(game);
            this.logger.log(`Deleted completed game: ${game.roomCode}`);
          } catch (error) {
            this.logger.error(
              `Error cleaning up game ${game.roomCode}:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Error in cleanupCompletedGames:', error);
    }
  }

  /**
   * Clean up on module destroy
   */
  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.logger.log('Stopped lobby cleanup task');
    }
  }
}
