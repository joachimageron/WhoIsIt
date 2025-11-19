import { Injectable, Logger } from '@nestjs/common';
import type {
  ConnectedUser,
  TypedSocket,
  UserReconnectionHistory,
} from './types';

@Injectable()
export class ConnectionManager {
  private readonly logger = new Logger(ConnectionManager.name);
  private readonly connectedUsers = new Map<string, ConnectedUser>();
  private readonly reconnectionHistory = new Map<
    string,
    UserReconnectionHistory
  >();

  // Security configuration
  private readonly MAX_RECONNECTIONS_PER_MINUTE = 5;
  private readonly RECONNECTION_WINDOW_MS = 60 * 1000; // 1 minute
  private readonly BAN_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private readonly INACTIVITY_TIMEOUT_MS = 60 * 1000; // 60 seconds

  private inactivityCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Track a new connection
   */
  trackConnection(client: TypedSocket): {
    allowed: boolean;
    reason?: string;
    socketsToDisconnect?: string[];
  } {
    const user = client.user;
    const userId = user?.id ?? null;
    const username = user?.username ?? 'guest';

    this.logger.log(
      `Client connecting: ${client.id} (user: ${username}, authenticated: ${!!user})`,
    );

    // Check if user is temporarily banned for abuse
    if (userId && this.isUserBanned(userId)) {
      const history = this.reconnectionHistory.get(userId);
      const bannedUntil = history?.bannedUntil;
      this.logger.warn(
        `User ${username} (${userId}) is temporarily banned until ${bannedUntil?.toISOString()}`,
      );
      return {
        allowed: false,
        reason: `Temporarily banned for connection abuse. Try again later.`,
      };
    }

    // Check for abusive reconnection patterns
    if (userId && this.isReconnectionAbusive(userId)) {
      this.banUser(userId);
      this.logger.warn(
        `User ${username} (${userId}) banned for exceeding reconnection limit`,
      );
      return {
        allowed: false,
        reason: `Too many reconnection attempts. Temporarily banned.`,
      };
    }

    // Track reconnection attempt for authenticated users
    const socketsToDisconnect: string[] = [];
    if (userId) {
      this.recordReconnectionAttempt(userId);

      // Find existing connections for this user
      const existingConnections = Array.from(
        this.connectedUsers.values(),
      ).filter((conn) => conn.userId === userId);

      if (existingConnections.length > 0) {
        this.logger.log(
          `User ${username} reconnected - found ${existingConnections.length} old connection(s) to disconnect`,
        );

        // Collect socket IDs to disconnect (single connection enforcement)
        existingConnections.forEach((conn) => {
          this.logger.log(
            `Marking old socket ${conn.socketId} for disconnection for user ${username}`,
          );
          socketsToDisconnect.push(conn.socketId);
          this.connectedUsers.delete(conn.socketId);
        });
      }
    }

    this.connectedUsers.set(client.id, {
      socketId: client.id,
      userId,
      roomCode: null,
      playerId: null,
      connectedAt: new Date(),
      lastSeenAt: new Date(),
    });

    this.logger.log(
      `Client connected: ${client.id} (user: ${username}, authenticated: ${!!user})`,
    );

    return {
      allowed: true,
      socketsToDisconnect:
        socketsToDisconnect.length > 0 ? socketsToDisconnect : undefined,
    };
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

  /**
   * Check if a user is currently banned
   */
  private isUserBanned(userId: string): boolean {
    const history = this.reconnectionHistory.get(userId);
    if (!history?.bannedUntil) {
      return false;
    }

    // Check if ban has expired
    if (new Date() >= history.bannedUntil) {
      history.bannedUntil = null;
      return false;
    }

    return true;
  }

  /**
   * Check if reconnection pattern is abusive
   */
  private isReconnectionAbusive(userId: string): boolean {
    const history = this.reconnectionHistory.get(userId);
    if (!history) {
      return false;
    }

    // Clean up old attempts outside the window
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.RECONNECTION_WINDOW_MS);
    history.attempts = history.attempts.filter(
      (attempt) => attempt.timestamp >= windowStart,
    );

    // Check if exceeds limit
    return history.attempts.length > this.MAX_RECONNECTIONS_PER_MINUTE;
  }

  /**
   * Record a reconnection attempt
   */
  private recordReconnectionAttempt(userId: string): void {
    let history = this.reconnectionHistory.get(userId);

    if (!history) {
      history = {
        userId,
        attempts: [],
        bannedUntil: null,
      };
      this.reconnectionHistory.set(userId, history);
    }

    // Add new attempt
    history.attempts.push({ timestamp: new Date() });

    // Clean up old attempts
    const windowStart = new Date(Date.now() - this.RECONNECTION_WINDOW_MS);
    history.attempts = history.attempts.filter(
      (attempt) => attempt.timestamp >= windowStart,
    );
  }

  /**
   * Ban a user temporarily
   */
  private banUser(userId: string): void {
    let history = this.reconnectionHistory.get(userId);

    if (!history) {
      history = {
        userId,
        attempts: [],
        bannedUntil: null,
      };
      this.reconnectionHistory.set(userId, history);
    }

    history.bannedUntil = new Date(Date.now() + this.BAN_DURATION_MS);
    this.logger.warn(
      `User ${userId} banned until ${history.bannedUntil.toISOString()}`,
    );
  }

  /**
   * Start monitoring for inactive connections
   */
  startInactivityMonitoring(
    disconnectCallback: (socketId: string) => void,
  ): void {
    if (this.inactivityCheckInterval) {
      return; // Already running
    }

    this.logger.log('Starting inactivity monitoring');

    this.inactivityCheckInterval = setInterval(() => {
      const now = new Date();
      const inactiveConnections: string[] = [];

      this.connectedUsers.forEach((connection, socketId) => {
        const inactiveDuration =
          now.getTime() - connection.lastSeenAt.getTime();

        if (inactiveDuration > this.INACTIVITY_TIMEOUT_MS) {
          inactiveConnections.push(socketId);
        }
      });

      if (inactiveConnections.length > 0) {
        this.logger.log(
          `Found ${inactiveConnections.length} inactive connection(s)`,
        );

        inactiveConnections.forEach((socketId) => {
          const connection = this.connectedUsers.get(socketId);
          const username = connection?.userId ?? 'guest';
          this.logger.log(
            `Disconnecting inactive socket ${socketId} (user: ${username})`,
          );
          disconnectCallback(socketId);
          this.connectedUsers.delete(socketId);
        });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop monitoring for inactive connections
   */
  stopInactivityMonitoring(): void {
    if (this.inactivityCheckInterval) {
      clearInterval(this.inactivityCheckInterval);
      this.inactivityCheckInterval = null;
      this.logger.log('Stopped inactivity monitoring');
    }
  }

  /**
   * Get user ban status (for monitoring)
   */
  getUserBanStatus(userId: string): { banned: boolean; bannedUntil?: Date } {
    const history = this.reconnectionHistory.get(userId);

    if (!history?.bannedUntil) {
      return { banned: false };
    }

    const banned = new Date() < history.bannedUntil;

    return {
      banned,
      bannedUntil: banned ? history.bannedUntil : undefined,
    };
  }

  /**
   * Get reconnection history for a user (for monitoring)
   */
  getUserReconnectionHistory(userId: string): {
    attempts: number;
    recentAttempts: Date[];
  } {
    const history = this.reconnectionHistory.get(userId);

    if (!history) {
      return { attempts: 0, recentAttempts: [] };
    }

    // Clean up old attempts
    const windowStart = new Date(Date.now() - this.RECONNECTION_WINDOW_MS);
    const recentAttempts = history.attempts
      .filter((attempt) => attempt.timestamp >= windowStart)
      .map((attempt) => attempt.timestamp);

    return {
      attempts: recentAttempts.length,
      recentAttempts,
    };
  }
}
