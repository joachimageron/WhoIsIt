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
import type {
  SocketJoinRoomRequest,
  SocketJoinRoomResponse,
  SocketLeaveRoomRequest,
  SocketLeaveRoomResponse,
  SocketUpdatePlayerReadyRequest,
  SocketUpdatePlayerReadyResponse,
  ServerToClientEvents,
  ClientToServerEvents,
} from '@whois-it/contracts';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  user?: User | null;
};
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Track connected users and their socket IDs for reconnection handling
interface ConnectedUser {
  socketId: string;
  userId: string | null;
  roomCode: string | null;
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
      const { roomCode } = data;
      const normalizedRoomCode = roomCode.trim().toUpperCase();

      // Join the Socket.IO room
      await client.join(normalizedRoomCode);

      // Update connection tracking
      const connection = this.connectedUsers.get(client.id);
      if (connection) {
        connection.roomCode = normalizedRoomCode;
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
      const { roomCode } = data;
      const normalizedRoomCode = roomCode.trim().toUpperCase();

      await client.leave(normalizedRoomCode);

      // Update connection tracking
      const connection = this.connectedUsers.get(client.id);
      if (connection && connection.roomCode === normalizedRoomCode) {
        connection.roomCode = null;
        connection.lastSeenAt = new Date();
      }

      const username = client.user?.username ?? 'guest';
      this.logger.log(
        `Client ${client.id} (${username}) left room ${normalizedRoomCode}`,
      );

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
      const normalizedRoomCode = roomCode.trim().toUpperCase();

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
      const normalizedRoomCode = roomCode.trim().toUpperCase();
      const lobby =
        await this.gameService.getLobbyByRoomCode(normalizedRoomCode);
      this.server.to(normalizedRoomCode).emit('lobbyUpdate', lobby);
      this.logger.log(`Broadcasted lobby update to room ${normalizedRoomCode}`);
    } catch (error) {
      this.logger.error('Error broadcasting lobby update:', error);
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
      const cutoffTime = new Date(now.getTime() - this.LOBBY_TIMEOUT_MS);

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
            if (game.status === 'lobby' && gameAge > this.LOBBY_TIMEOUT_MS) {
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
