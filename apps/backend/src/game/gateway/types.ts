import { Socket, Server } from 'socket.io';
import { User } from '../../database/entities/user.entity';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@whois-it/contracts';

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  user?: User | null;
};

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Track connected users and their socket IDs for reconnection handling
export interface ConnectedUser {
  socketId: string;
  userId: string | null;
  roomCode: string | null;
  playerId: string | null;
  connectedAt: Date;
  lastSeenAt: Date;
}

// Track reconnection attempts for abuse detection
export interface ReconnectionAttempt {
  timestamp: Date;
}

// Track user reconnection history for rate limiting
export interface UserReconnectionHistory {
  userId: string;
  attempts: ReconnectionAttempt[];
  bannedUntil: Date | null;
}
