import { Injectable, Logger } from '@nestjs/common';
import type { ConnectedUser, TypedSocket } from './types/gateway.types';

@Injectable()
export class ConnectionManager {
  private readonly logger = new Logger(ConnectionManager.name);
  private readonly connectedUsers = new Map<string, ConnectedUser>();

  /**
   * Track a new connection
   */
  trackConnection(client: TypedSocket) {
    const user = client.user;
    const userId = user?.id ?? null;
    const username = user?.username ?? 'guest';

    this.logger.log(
      `Client connected: ${client.id} (user: ${username}, authenticated: ${!!user})`,
    );

    this.connectedUsers.set(client.id, {
      socketId: client.id,
      userId,
      roomCode: null,
      playerId: null,
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
      }
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(client: TypedSocket) {
    const connection = this.connectedUsers.get(client.id);
    const username = client.user?.username ?? 'guest';

    this.logger.log(
      `Client disconnected: ${client.id} (user: ${username})${connection?.roomCode ? `, was in room: ${connection.roomCode}` : ''}`,
    );

    this.connectedUsers.delete(client.id);
  }

  /**
   * Update connection room
   */
  updateConnectionRoom(
    socketId: string,
    roomCode: string | null,
    playerId?: string | null,
  ) {
    const connection = this.connectedUsers.get(socketId);
    if (connection) {
      connection.roomCode = roomCode;
      if (playerId !== undefined) {
        connection.playerId = playerId;
      }
      connection.lastSeenAt = new Date();
    }
  }

  /**
   * Get connection info
   */
  getConnection(socketId: string): ConnectedUser | undefined {
    return this.connectedUsers.get(socketId);
  }

  /**
   * Update last seen time
   */
  updateLastSeen(socketId: string) {
    const connection = this.connectedUsers.get(socketId);
    if (connection) {
      connection.lastSeenAt = new Date();
    }
  }

  /**
   * Get number of connected users (for monitoring)
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get all connected users
   */
  getAllConnections(): Map<string, ConnectedUser> {
    return this.connectedUsers;
  }
}
