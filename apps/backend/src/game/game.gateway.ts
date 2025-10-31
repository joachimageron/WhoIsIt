import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { GameService } from './game.service';
import { User } from '../database/entities/user.entity';
import { GameStatus } from '../database/enums';
import type {
  SocketJoinRoomRequest,
  SocketJoinRoomResponse,
  SocketLeaveRoomRequest,
  SocketLeaveRoomResponse,
  SocketUpdatePlayerReadyRequest,
  SocketUpdatePlayerReadyResponse,
  ServerToClientEvents,
  ClientToServerEvents,
  GuessResultResponse,
} from '@whois-it/contracts';

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  user?: User | null;
};
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Track connected users and their socket IDs for reconnection handling
interface ConnectedUser {
  socketId: string;
  userId: string | null;
  roomCode: string | null;
  playerId: string | null; // Add playerId tracking
  connectedAt: Date;
  lastSeenAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? true,
    credentials: true,
  },
})
export class GameGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  @WebSocketServer()
  server!: TypedServer;

  private readonly logger = new Logger(GameGateway.name);
  private readonly connectedUsers = new Map<string, ConnectedUser>();
  private cleanupInterval?: NodeJS.Timeout;

  // Timeout after which inactive lobbies are cleaned up (30 minutes)
  private readonly LOBBY_TIMEOUT_MS = 30 * 60 * 1000;
  // Interval for checking inactive lobbies (5 minutes)
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

  constructor(private readonly gameService: GameService) {}

  /**
   * Normalize room code to uppercase and trimmed
   */
  private normalizeRoomCode(roomCode: string): string {
    return roomCode.trim().toUpperCase();
  }

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
    // Start periodic cleanup of abandoned lobbies
    this.startLobbyCleanup();
  }

  handleConnection(client: TypedSocket) {
    const user = client.user;
    const userId = user?.id ?? null;
    const username = user?.username ?? 'guest';

    this.logger.log(
      `Client connected: ${client.id} (user: ${username}, authenticated: ${!!user})`,
    );

    // Track this connection
    this.connectedUsers.set(client.id, {
      socketId: client.id,
      userId,
      roomCode: null,
      playerId: null, // Initialize playerId
      connectedAt: new Date(),
      lastSeenAt: new Date(),
    });

    // Check if this user was previously connected and might be reconnecting
    if (userId) {
      const previousConnections = Array.from(
        this.connectedUsers.values(),
      ).filter((conn) => conn.userId === userId && conn.socketId !== client.id);

      if (previousConnections.length > 0) {
        this.logger.log(
          `User ${username} reconnected with new socket ${client.id}`,
        );
        // Previous connections will be cleaned up when their sockets disconnect
      }
    }
  }

  handleDisconnect(client: TypedSocket) {
    const connection = this.connectedUsers.get(client.id);
    const username = client.user?.username ?? 'guest';

    this.logger.log(
      `Client disconnected: ${client.id} (user: ${username})${connection?.roomCode ? `, was in room: ${connection.roomCode}` : ''}`,
    );

    // Remove from tracking
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: SocketJoinRoomRequest,
  ): Promise<SocketJoinRoomResponse> {
    try {
      const { roomCode, playerId } = data;
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);

      // Join the Socket.IO room
      await client.join(normalizedRoomCode);

      // Update connection tracking
      const connection = this.connectedUsers.get(client.id);
      if (connection) {
        connection.roomCode = normalizedRoomCode;
        connection.playerId = playerId ?? null; // Store the playerId
        connection.lastSeenAt = new Date();
      }

      // Get current lobby state
      const lobby =
        await this.gameService.getLobbyByRoomCode(normalizedRoomCode);

      const username = client.user?.username ?? 'guest';
      this.logger.log(
        `Client ${client.id} (${username}) joined room ${normalizedRoomCode}`,
      );

      // Send current state to the joining client
      client.emit('lobbyUpdate', lobby);

      // Notify others in the room
      client.to(normalizedRoomCode).emit('playerJoined', {
        roomCode: normalizedRoomCode,
        lobby,
      });

      return { success: true, lobby };
    } catch (error) {
      this.logger.error('Error in handleJoinRoom:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: SocketLeaveRoomRequest,
  ): Promise<SocketLeaveRoomResponse> {
    try {
      const { roomCode, playerId: requestPlayerId } = data;
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);

      // Get the player ID from either the request or connection tracking
      const connection = this.connectedUsers.get(client.id);
      let playerId: string | null =
        requestPlayerId ?? connection?.playerId ?? null;

      // If we still don't have a playerId, try to find it from the lobby
      if (!playerId) {
        try {
          const lobby =
            await this.gameService.getLobbyByRoomCode(normalizedRoomCode);
          const userId = client.user?.id;

          // Try to find the player by userId (for authenticated users)
          if (userId) {
            const player = lobby.players.find((p) => p.userId === userId);
            if (player) {
              playerId = player.id;
            }
          }
        } catch {
          // If we can't get the lobby, that's okay - player might have already left
          this.logger.warn(
            `Could not get lobby for room ${normalizedRoomCode}`,
          );
        }
      }

      // Leave the Socket.IO room first
      await client.leave(normalizedRoomCode);

      // Update connection tracking
      if (connection && connection.roomCode === normalizedRoomCode) {
        connection.roomCode = null;
        connection.playerId = null; // Clear the playerId
        connection.lastSeenAt = new Date();
      }

      const username = client.user?.username ?? 'guest';
      this.logger.log(
        `Client ${client.id} (${username}) left room ${normalizedRoomCode}`,
      );

      // Mark player as left in database if we found them
      if (playerId) {
        try {
          await this.gameService.markPlayerAsLeft(playerId);
        } catch (error) {
          this.logger.warn(
            `Could not mark player ${playerId} as left: ${(error as Error).message}`,
          );
        }
      }

      // Get updated lobby state and notify other players
      try {
        const updatedLobby =
          await this.gameService.getLobbyByRoomCode(normalizedRoomCode);

        // Notify other players in the room about the player leaving
        client.to(normalizedRoomCode).emit('playerLeft', {
          roomCode: normalizedRoomCode,
          lobby: updatedLobby,
        });

        // Also broadcast a lobby update to ensure all clients are in sync
        client.to(normalizedRoomCode).emit('lobbyUpdate', updatedLobby);
      } catch (error) {
        this.logger.warn(
          `Could not broadcast player left event: ${(error as Error).message}`,
        );
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error in handleLeaveRoom:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('updatePlayerReady')
  async handleUpdatePlayerReady(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: SocketUpdatePlayerReadyRequest,
  ): Promise<SocketUpdatePlayerReadyResponse> {
    try {
      const { roomCode, playerId, isReady } = data;
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);

      // Update connection tracking
      const connection = this.connectedUsers.get(client.id);
      if (connection) {
        connection.lastSeenAt = new Date();
      }

      // Update player ready state
      await this.gameService.updatePlayerReady(playerId, isReady);

      // Get updated lobby state
      const lobby =
        await this.gameService.getLobbyByRoomCode(normalizedRoomCode);

      // Broadcast the update to all clients in the room
      this.server.to(normalizedRoomCode).emit('lobbyUpdate', lobby);

      const username = client.user?.username ?? 'guest';
      this.logger.log(
        `Player ${playerId} (${username}) ready state updated to ${isReady} in room ${normalizedRoomCode}`,
      );

      return { success: true, lobby };
    } catch (error) {
      this.logger.error('Error in handleUpdatePlayerReady:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Broadcast lobby update to all clients in a room
   */
  async broadcastLobbyUpdate(roomCode: string) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      const lobby =
        await this.gameService.getLobbyByRoomCode(normalizedRoomCode);
      this.server.to(normalizedRoomCode).emit('lobbyUpdate', lobby);
      this.logger.log(`Broadcasted lobby update to room ${normalizedRoomCode}`);
    } catch (error) {
      this.logger.error('Error broadcasting lobby update:', error);
    }
  }

  /**
   * Broadcast game started event to all clients in a room
   */
  async broadcastGameStarted(roomCode: string) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      const lobby =
        await this.gameService.getLobbyByRoomCode(normalizedRoomCode);
      this.server.to(normalizedRoomCode).emit('gameStarted', {
        roomCode: normalizedRoomCode,
        lobby,
      });
      this.logger.log(`Broadcasted game started to room ${normalizedRoomCode}`);
    } catch (error) {
      this.logger.error('Error broadcasting game started:', error);
    }
  }

  /**
   * Broadcast guess result event to all clients in a room
   */
  broadcastGuessResult(roomCode: string, guess: GuessResultResponse): void {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      this.server.to(normalizedRoomCode).emit('guessResult', {
        roomCode: normalizedRoomCode,
        guess,
      });
      this.logger.log(
        `Broadcasted guess result to room ${normalizedRoomCode}: ${guess.isCorrect ? 'CORRECT' : 'INCORRECT'}`,
      );
    } catch (error) {
      this.logger.error('Error broadcasting guess result:', error);
    }
  }

  /**
   * Start periodic cleanup of abandoned lobbies
   */
  private startLobbyCleanup() {
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
          const connection = this.connectedUsers.get(socketId);
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
   * Get number of connected users (for monitoring)
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get number of active rooms (for monitoring)
   */
  getActiveRoomsCount(): number {
    let count = 0;
    this.server.sockets.adapter.rooms.forEach((sockets, roomCode) => {
      // Skip default rooms (socket IDs)
      if (!sockets.has(roomCode)) {
        count++;
      }
    });
    return count;
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
