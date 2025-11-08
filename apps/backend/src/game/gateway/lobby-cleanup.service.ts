import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { GameService } from '../services/game.service';
import { ConnectionManager } from './connection.manager';
import { GameStatus } from '../../database/enums';
import type { TypedServer } from './types';

@Injectable()
export class LobbyCleanupService implements OnModuleDestroy {
  private readonly logger = new Logger(LobbyCleanupService.name);
  private cleanupInterval?: NodeJS.Timeout;
  private server!: TypedServer;

  // Timeout after which inactive lobbies are cleaned up (30 minutes)
  private readonly LOBBY_TIMEOUT_MS = 30 * 60 * 1000;
  // Interval for checking inactive lobbies (5 minutes)
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

  constructor(
    private readonly gameService: GameService,
    private readonly connectionManager: ConnectionManager,
  ) {}

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
    }, this.CLEANUP_INTERVAL_MS);

    this.logger.log(
      `Started lobby cleanup task (interval: ${this.CLEANUP_INTERVAL_MS / 1000}s, timeout: ${this.LOBBY_TIMEOUT_MS / 1000}s)`,
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

              // Note: We're not deleting the game from DB, just logging
              // In a future iteration, you might want to mark it as abandoned
              // or clean it up from the database as well
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
   * Clean up on module destroy
   */
  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.logger.log('Stopped lobby cleanup task');
    }
  }
}
