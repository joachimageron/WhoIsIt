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
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { GameService } from '../services/game.service';
import type {
  SocketJoinRoomRequest,
  SocketJoinRoomResponse,
  SocketLeaveRoomRequest,
  SocketLeaveRoomResponse,
  SocketUpdatePlayerReadyRequest,
  SocketUpdatePlayerReadyResponse,
} from '@whois-it/contracts';
import { ConnectionManager } from './connection.manager';
import { BroadcastService } from '../services/broadcast.service';
import { LobbyCleanupService } from '../services/lobby-cleanup.service';
import type { TypedSocket, TypedServer } from './types';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN || false, // Changed from true to false for security
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

  constructor(
    private readonly gameService: GameService,
    private readonly connectionManager: ConnectionManager,
    private readonly broadcastService: BroadcastService,
    private readonly lobbyCleanupService: LobbyCleanupService,
  ) {}

  /**
   * Normalize room code to uppercase and trimmed
   */
  private normalizeRoomCode(roomCode: string): string {
    return roomCode.trim().toUpperCase();
  }

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');

    // Initialize services with the server instance
    this.broadcastService.setServer(this.server);
    this.lobbyCleanupService.setServer(this.server);

    // Start periodic cleanup of abandoned lobbies
    this.lobbyCleanupService.startCleanup();

    // Start inactivity monitoring
    this.connectionManager.startInactivityMonitoring((socketId: string) => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
    });
  }

  handleConnection(client: TypedSocket) {
    const result = this.connectionManager.trackConnection(client);

    if (!result.allowed) {
      this.logger.warn(
        `Connection rejected for ${client.id}: ${result.reason}`,
      );
      // Disconnect immediately without emitting error event (not in contract)
      client.disconnect(true);
      return;
    }

    // Disconnect old sockets if this is a reconnection
    if (result.socketsToDisconnect && result.socketsToDisconnect.length > 0) {
      result.socketsToDisconnect.forEach((socketId) => {
        const oldSocket = this.server?.sockets?.sockets?.get(socketId);
        if (oldSocket) {
          this.logger.log(`Disconnecting old socket ${socketId}`);
          oldSocket.disconnect(true);
        }
      });
    }
  }

  handleDisconnect(client: TypedSocket) {
    this.connectionManager.handleDisconnect(client);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: SocketJoinRoomRequest,
  ): Promise<SocketJoinRoomResponse> {
    try {
      const { roomCode } = data;
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);

      // Verify that the user is authenticated
      const userId = client.user?.id;
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const authenticatedPlayerId = await this.gameService.getPlayerIdByUserId(
        normalizedRoomCode,
        userId,
      );

      // Join the Socket.IO room
      await client.join(normalizedRoomCode);

      // Update connection tracking
      this.connectionManager.updateConnectionRoom(
        client.id,
        normalizedRoomCode,
        authenticatedPlayerId ?? null,
      );

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
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);

      // Get the player ID from either the request or connection tracking
      const connection = this.connectionManager.getConnection(client.id);
      let playerId: string | null = connection?.playerId ?? null;

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
      this.connectionManager.updateConnectionRoom(client.id, null, null);

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
      const { roomCode, isReady } = data;
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);

      // Verify that the user owns the player ID
      const userId = client.user?.id;
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const authenticatedPlayerId = await this.gameService.getPlayerIdByUserId(
        normalizedRoomCode,
        userId,
      );

      if (!authenticatedPlayerId) {
        return {
          success: false,
          error: 'You are not a player in this game',
        };
      }

      // Update last seen time
      this.connectionManager.updateLastSeen(client.id);

      // Update player ready state
      await this.gameService.updatePlayerReady(authenticatedPlayerId, isReady);

      // Get updated lobby state
      const lobby =
        await this.gameService.getLobbyByRoomCode(normalizedRoomCode);

      // Broadcast the update to all clients in the room
      this.server.to(normalizedRoomCode).emit('lobbyUpdate', lobby);

      const username = client.user?.username ?? 'guest';
      this.logger.log(
        `Player ${authenticatedPlayerId} (${username}) ready state updated to ${isReady} in room ${normalizedRoomCode}`,
      );

      return { success: true, lobby };
    } catch (error) {
      this.logger.error('Error in handleUpdatePlayerReady:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get number of connected users (for monitoring)
   */
  getConnectedUsersCount(): number {
    return this.connectionManager.getConnectedUsersCount();
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
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    this.connectionManager.stopInactivityMonitoring();
    this.logger.log('WebSocket Gateway destroyed');
  }
}
