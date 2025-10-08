import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { GameService } from './game.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? true,
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; playerId?: string },
  ) {
    try {
      const { roomCode } = data;
      const normalizedRoomCode = roomCode.trim().toUpperCase();

      // Join the Socket.IO room
      await client.join(normalizedRoomCode);

      // Get current lobby state
      const lobby =
        await this.gameService.getLobbyByRoomCode(normalizedRoomCode);

      this.logger.log(`Client ${client.id} joined room ${normalizedRoomCode}`);

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
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string },
  ) {
    try {
      const { roomCode } = data;
      const normalizedRoomCode = roomCode.trim().toUpperCase();

      await client.leave(normalizedRoomCode);

      this.logger.log(`Client ${client.id} left room ${normalizedRoomCode}`);

      return { success: true };
    } catch (error) {
      this.logger.error('Error in handleLeaveRoom:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('updatePlayerReady')
  async handleUpdatePlayerReady(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomCode: string; playerId: string; isReady: boolean },
  ) {
    try {
      const { roomCode, playerId, isReady } = data;
      const normalizedRoomCode = roomCode.trim().toUpperCase();

      // Update player ready state
      await this.gameService.updatePlayerReady(playerId, isReady);

      // Get updated lobby state
      const lobby =
        await this.gameService.getLobbyByRoomCode(normalizedRoomCode);

      // Broadcast the update to all clients in the room
      this.server.to(normalizedRoomCode).emit('lobbyUpdate', lobby);

      this.logger.log(
        `Player ${playerId} ready state updated to ${isReady} in room ${normalizedRoomCode}`,
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
}
