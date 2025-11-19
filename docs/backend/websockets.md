# WebSocket Implementation

## Overview

WhoIsIt uses **Socket.IO** for real-time bidirectional communication. The backend implementation includes a custom authentication adapter, connection management, room-based broadcasting, and comprehensive error handling.

## Architecture

### WebSocket Stack

```docs
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  Socket.IO Client (Frontend) → WebSocket Transport          │
└─────────────────────────────────────────────────────────────┘
                         ▲ ▼
                   WebSocket Protocol
                         ▲ ▼
┌─────────────────────────────────────────────────────────────┐
│                   Gateway Layer                              │
│  GameGateway → @SubscribeMessage decorators                 │
│              → Connection/Disconnect handlers                │
└─────────────────────────────────────────────────────────────┘
                         ▲ ▼
┌─────────────────────────────────────────────────────────────┐
│                 Authentication Layer                         │
│  WsAuthAdapter → JWT validation → User attachment           │
└─────────────────────────────────────────────────────────────┘
                         ▲ ▼
┌─────────────────────────────────────────────────────────────┐
│                Connection Management Layer                   │
│  ConnectionManager → Track connections → Room tracking       │
└─────────────────────────────────────────────────────────────┘
                         ▲ ▼
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer                               │
│  GameService, BroadcastService, LobbyCleanupService         │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. WsAuthAdapter

Custom Socket.IO adapter that validates JWT tokens for incoming connections.

**Location**: `apps/backend/src/auth/ws-auth.adapter.ts`

**Purpose**:

- Extract JWT from cookies or auth headers
- Verify token signature
- Attach user to socket instance
- Allow unauthenticated connections (guests)

**Implementation**:

```typescript
export class WsAuthAdapter extends IoAdapter {
  private readonly logger = new Logger(WsAuthAdapter.name);

  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    const jwtService = this.app.get(JwtService);
    const authService = this.app.get(AuthService);
    const jwtSecret = this.configService.get('JWT_SECRET');

    server.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Extract token from cookie or auth header
        let token = extractTokenFromCookie(socket);
        if (!token) {
          token = socket.handshake.auth?.token;
        }

        if (!token) {
          // Allow connection without auth (guest)
          socket.user = null;
          next();
          return;
        }

        // Verify JWT
        const payload = jwtService.verify<JwtPayload>(token, {
          secret: jwtSecret,
        });

        // Get user from database
        const user = await authService.findById(payload.sub);

        if (!user) {
          socket.user = null;
          next();
          return;
        }

        // Attach user to socket
        socket.user = user;
        this.logger.log(`Socket ${socket.id} authenticated as ${user.username}`);

        next();
      } catch (error) {
        // Allow connection but mark as unauthenticated
        socket.user = null;
        next();
      }
    });

    return server;
  }
}
```

**Key Features**:

- **Token Extraction**: Tries cookie first, then auth header
- **Graceful Degradation**: Invalid/missing token doesn't prevent connection
- **User Attachment**: Authenticated user available as `socket.user`
- **Logging**: Tracks authentication success/failure

**Token Extraction from Cookie**:

```typescript
function extractTokenFromCookie(socket: Socket): string | null {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies['access_token'] || null;
}
```

### 2. GameGateway

Main WebSocket gateway handling game-related events.

**Location**: `apps/backend/src/game/gateway/game.gateway.ts`

**Decorator**: `@WebSocketGateway`

**Configuration**:

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? true,
    credentials: true,
  },
})
export class GameGateway implements 
  OnGatewayInit, 
  OnGatewayConnection, 
  OnGatewayDisconnect {
  
  @WebSocketServer()
  server!: TypedServer;

  constructor(
    private readonly gameService: GameService,
    private readonly connectionManager: ConnectionManager,
    private readonly broadcastService: BroadcastService,
  ) {}
}
```

**Lifecycle Hooks**:

**`afterInit()`** - Called after gateway initialization

```typescript
afterInit() {
  this.logger.log('WebSocket Gateway initialized');
  this.broadcastService.setServer(this.server);
  this.lobbyCleanupService.startCleanup();
  
  // Start inactivity monitoring
  this.connectionManager.startInactivityMonitoring((socketId: string) => {
    const socket = this.server.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
    }
  });
}
```

**`onModuleDestroy()`** - Called on shutdown

```typescript
onModuleDestroy() {
  this.connectionManager.stopInactivityMonitoring();
  this.logger.log('WebSocket Gateway destroyed');
}
```

**`handleConnection()`** - Called when client connects

```typescript
handleConnection(client: TypedSocket) {
  const result = this.connectionManager.trackConnection(client);

  if (!result.allowed) {
    this.logger.warn(
      `Connection rejected for ${client.id}: ${result.reason}`,
    );
    client.emit('error', { message: result.reason });
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
```

**`handleDisconnect()`** - Called when client disconnects

```typescript
handleDisconnect(client: TypedSocket) {
  this.connectionManager.handleDisconnect(client);
  this.logger.log(`Client disconnected: ${client.id}`);
}
```

**Event Handlers**:

**`@SubscribeMessage('joinRoom')`**

```typescript
@SubscribeMessage('joinRoom')
async handleJoinRoom(
  @ConnectedSocket() client: TypedSocket,
  @MessageBody() data: SocketJoinRoomRequest,
): Promise<SocketJoinRoomResponse> {
  try {
    const { roomCode, playerId } = data;
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);

    // Join Socket.IO room
    await client.join(normalizedRoomCode);

    // Update connection tracking
    this.connectionManager.updateConnectionRoom(
      client.id,
      normalizedRoomCode,
      playerId ?? null,
    );

    // Get lobby state
    const lobby = await this.gameService.getLobbyByRoomCode(normalizedRoomCode);

    // Send state to joining client
    client.emit('lobbyUpdate', lobby);

    // Notify others
    client.to(normalizedRoomCode).emit('playerJoined', {
      roomCode: normalizedRoomCode,
      lobby,
    });

    return { success: true, lobby };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

**`@SubscribeMessage('leaveRoom')`**

```typescript
@SubscribeMessage('leaveRoom')
async handleLeaveRoom(
  @ConnectedSocket() client: TypedSocket,
  @MessageBody() data: SocketLeaveRoomRequest,
): Promise<SocketLeaveRoomResponse> {
  try {
    const { roomCode, playerId } = data;
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);

    // Leave Socket.IO room
    await client.leave(normalizedRoomCode);

    // Update connection tracking
    this.connectionManager.updateConnectionRoom(client.id, null, null);

    // Mark player as left in database
    if (playerId) {
      await this.gameService.markPlayerAsLeft(playerId);
    }

    // Get updated lobby
    const updatedLobby = await this.gameService.getLobbyByRoomCode(normalizedRoomCode);

    // Notify other players
    client.to(normalizedRoomCode).emit('playerLeft', {
      roomCode: normalizedRoomCode,
      lobby: updatedLobby,
    });

    client.to(normalizedRoomCode).emit('lobbyUpdate', updatedLobby);

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

**`@SubscribeMessage('updatePlayerReady')`**

```typescript
@SubscribeMessage('updatePlayerReady')
async handleUpdatePlayerReady(
  @ConnectedSocket() client: TypedSocket,
  @MessageBody() data: SocketUpdatePlayerReadyRequest,
): Promise<SocketUpdatePlayerReadyResponse> {
  try {
    const { roomCode, playerId, isReady } = data;
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);

    // Update ready status in database
    await this.gameService.updatePlayerReady(playerId, isReady);

    // Get updated lobby
    const lobby = await this.gameService.getLobbyByRoomCode(normalizedRoomCode);

    // Broadcast to all players in room
    this.server.to(normalizedRoomCode).emit('lobbyUpdate', lobby);

    return { success: true, lobby };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

### 3. ConnectionManager

Tracks active WebSocket connections and enforces security policies.

**Location**: `apps/backend/src/game/gateway/connection.manager.ts`

**Purpose**:

- Track connected sockets
- Map sockets to rooms and players
- Handle reconnections
- Monitor connection count
- **Enforce single connection per user**
- **Detect reconnection abuse**
- **Monitor inactivity**
- **Temporarily ban abusive users**

**Connection Info**:

```typescript
interface ConnectedUser {
  socketId: string;          // Socket.IO ID
  userId: string | null;     // User ID (if authenticated)
  roomCode: string | null;   // Current room
  playerId: string | null;   // Player ID in game
  connectedAt: Date;         // Connection timestamp
  lastSeenAt: Date;          // Last activity
}

interface UserReconnectionHistory {
  userId: string;
  attempts: ReconnectionAttempt[];
  bannedUntil: Date | null;
}
```

**Security Configuration**:

```typescript
private readonly MAX_RECONNECTIONS_PER_MINUTE = 5;
private readonly RECONNECTION_WINDOW_MS = 60 * 1000; // 1 minute
private readonly BAN_DURATION_MS = 5 * 60 * 1000; // 5 minutes
private readonly INACTIVITY_TIMEOUT_MS = 60 * 1000; // 60 seconds
```

**Methods**:

**`trackConnection()`** - Track new connection with security checks

```typescript
trackConnection(client: TypedSocket): {
  allowed: boolean;
  reason?: string;
  socketsToDisconnect?: string[];
} {
  const userId = client.user?.id ?? null;

  // Check if user is banned
  if (userId && this.isUserBanned(userId)) {
    return {
      allowed: false,
      reason: 'Temporarily banned for connection abuse.'
    };
  }

  // Check for abusive reconnection pattern
  if (userId && this.isReconnectionAbusive(userId)) {
    this.banUser(userId);
    return {
      allowed: false,
      reason: 'Too many reconnection attempts.'
    };
  }

  // Find existing connections for single-connection enforcement
  const socketsToDisconnect: string[] = [];
  if (userId) {
    this.recordReconnectionAttempt(userId);
    
    const existingConnections = Array.from(this.connectedUsers.values())
      .filter(conn => conn.userId === userId);
    
    if (existingConnections.length > 0) {
      existingConnections.forEach(conn => {
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

  return {
    allowed: true,
    socketsToDisconnect: socketsToDisconnect.length > 0 
      ? socketsToDisconnect 
      : undefined
  };
}
```

**`handleDisconnect()`** - Clean up on disconnect

```typescript
handleDisconnect(client: TypedSocket) {
  const connection = this.connectedUsers.get(client.id);
  const username = client.user?.username ?? 'guest';

  this.logger.log(
    `Client disconnected: ${client.id} (user: ${username})` +
    `${connection?.roomCode ? `, was in room: ${connection.roomCode}` : ''}`
  );

  this.connectedUsers.delete(client.id);
}
```

**`updateConnectionRoom()`** - Update room assignment

```typescript
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
```

**`updateLastSeen()`** - Update activity timestamp

```typescript
updateLastSeen(socketId: string) {
  const connection = this.connectedUsers.get(socketId);
  if (connection) {
    connection.lastSeenAt = new Date();
  }
}
```

**`startInactivityMonitoring()`** - Begin monitoring for inactive connections

```typescript
startInactivityMonitoring(disconnectCallback: (socketId: string) => void) {
  this.inactivityCheckInterval = setInterval(() => {
    const now = new Date();
    const inactiveConnections: string[] = [];

    this.connectedUsers.forEach((connection, socketId) => {
      const inactiveDuration = now.getTime() - connection.lastSeenAt.getTime();
      if (inactiveDuration > this.INACTIVITY_TIMEOUT_MS) {
        inactiveConnections.push(socketId);
      }
    });

    inactiveConnections.forEach(socketId => {
      this.logger.log(`Disconnecting inactive socket ${socketId}`);
      disconnectCallback(socketId);
      this.connectedUsers.delete(socketId);
    });
  }, 30000); // Check every 30 seconds
}
```

**`stopInactivityMonitoring()`** - Stop monitoring

```typescript
stopInactivityMonitoring() {
  if (this.inactivityCheckInterval) {
    clearInterval(this.inactivityCheckInterval);
    this.inactivityCheckInterval = null;
  }
}
```

**`getUserBanStatus()`** - Check if user is banned

```typescript
getUserBanStatus(userId: string): { 
  banned: boolean; 
  bannedUntil?: Date 
} {
  const history = this.reconnectionHistory.get(userId);
  if (!history?.bannedUntil) {
    return { banned: false };
  }
  const banned = new Date() < history.bannedUntil;
  return { banned, bannedUntil: banned ? history.bannedUntil : undefined };
}
```

**`getUserReconnectionHistory()`** - Get reconnection history

```typescript
getUserReconnectionHistory(userId: string): {
  attempts: number;
  recentAttempts: Date[];
} {
  const history = this.reconnectionHistory.get(userId);
  if (!history) {
    return { attempts: 0, recentAttempts: [] };
  }
  
  const windowStart = new Date(Date.now() - this.RECONNECTION_WINDOW_MS);
  const recentAttempts = history.attempts
    .filter(attempt => attempt.timestamp >= windowStart)
    .map(attempt => attempt.timestamp);
  
  return { attempts: recentAttempts.length, recentAttempts };
}
```

**`getConnection()`** - Retrieve connection info

```typescript
getConnection(socketId: string): ConnectedUser | undefined {
  return this.connectedUsers.get(socketId);
}
```

**`getConnectedUsersCount()`** - Get connection count

```typescript
getConnectedUsersCount(): number {
  return this.connectedUsers.size;
}
```

### 4. BroadcastService

Centralized service for broadcasting events to rooms.

**Location**: `apps/backend/src/game/services/broadcast.service.ts`

**Purpose**:

- Centralize broadcasting logic
- Reduce code duplication
- Provide type-safe broadcast methods

**Methods**:

**`setServer()`** - Initialize with Socket.IO server

```typescript
setServer(server: TypedServer) {
  this.server = server;
}
```

**`broadcastGameStarted()`** - Broadcast game start

```typescript
broadcastGameStarted(roomCode: string, lobby: GameLobbyResponse) {
  if (!this.server) return;

  this.server.to(roomCode).emit('gameStarted', {
    roomCode,
    lobby,
  });

  this.logger.log(`Broadcast: gameStarted to room ${roomCode}`);
}
```

**`broadcastLobbyUpdate()`** - Broadcast lobby changes

```typescript
broadcastLobbyUpdate(roomCode: string, lobby: GameLobbyResponse) {
  if (!this.server) return;

  this.server.to(roomCode).emit('lobbyUpdate', lobby);

  this.logger.log(`Broadcast: lobbyUpdate to room ${roomCode}`);
}
```

**`broadcastQuestionAsked()`** - Broadcast question event

```typescript
broadcastQuestionAsked(
  roomCode: string,
  question: QuestionResponse,
  gameState: GameStateResponse,
) {
  if (!this.server) return;

  this.server.to(roomCode).emit('questionAsked', {
    roomCode,
    question,
    gameState,
  });
}
```

### 5. LobbyCleanupService

Scheduled task to clean up abandoned lobbies.

**Location**: `apps/backend/src/game/services/lobby-cleanup.service.ts`

**Purpose**:

- Remove empty lobbies
- Handle disconnected players
- Prevent memory leaks

**Methods**:

**`startCleanup()`** - Start periodic cleanup

```typescript
startCleanup() {
  this.cleanupInterval = setInterval(() => {
    this.performCleanup();
  }, 5 * 60 * 1000); // Every 5 minutes

  this.logger.log('Lobby cleanup service started');
}
```

**`performCleanup()`** - Execute cleanup logic

```typescript
async performCleanup() {
  // Find lobbies with no active connections
  // Mark players as left
  // Optionally delete empty lobbies
}
```

## Room Management

### Room Pattern

Socket.IO rooms enable targeted message broadcasting:

```typescript
// Client joins room
await socket.join('ABC123');

// Broadcast to all in room except sender
socket.to('ABC123').emit('event', data);

// Broadcast to all in room including sender
server.to('ABC123').emit('event', data);

// Client leaves room
await socket.leave('ABC123');
```

### Room Naming

- Rooms named after game room codes
- Room codes normalized to uppercase
- Example: `'ABC123'`, `'XYZ789'`

### Room Lifecycle

1. **Creation**: Implicit when first client joins
2. **Join**: Players join via `joinRoom` event
3. **Leave**: Players leave via `leaveRoom` event or disconnect
4. **Cleanup**: Automatic when last client leaves

## Type Safety

### Typed Socket

Custom Socket type with user property:

```typescript
interface AuthenticatedSocket extends Socket {
  user?: User | null;
}

export type TypedSocket = AuthenticatedSocket & {
  // Additional type extensions
};
```

### Typed Server

Socket.IO server with typed events:

```typescript
export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
```

### Event Types

All events typed via `@whois-it/contracts`:

```typescript
interface ClientToServerEvents {
  joinRoom: (
    data: SocketJoinRoomRequest,
    callback: (response: SocketJoinRoomResponse) => void,
  ) => void;
  // ...
}

interface ServerToClientEvents {
  lobbyUpdate: (lobby: GameLobbyResponse) => void;
  playerJoined: (event: SocketPlayerJoinedEvent) => void;
  // ...
}
```

## Error Handling

### Connection Errors

Handled gracefully in adapter:

```typescript
try {
  // Verify token
  const payload = jwtService.verify(token);
  socket.user = await authService.findById(payload.sub);
} catch (error) {
  // Allow connection as guest
  socket.user = null;
  next();
}
```

### Event Errors

Returned via acknowledgement callbacks:

```typescript
try {
  const lobby = await this.gameService.getLobbyByRoomCode(roomCode);
  return { success: true, lobby };
} catch (error) {
  this.logger.error('Error in handleJoinRoom:', error);
  return { success: false, error: (error as Error).message };
}
```

### Disconnect Handling

Cleanup on unexpected disconnects:

```typescript
handleDisconnect(client: TypedSocket) {
  const connection = this.connectedUsers.get(client.id);
  
  if (connection?.playerId) {
    // Player was in game - handle gracefully
    this.handlePlayerDisconnect(connection);
  }
  
  this.connectedUsers.delete(client.id);
}
```

## Testing WebSocket

### Unit Tests

Mock Socket.IO components:

```typescript
describe('GameGateway', () => {
  let gateway: GameGateway;
  let mockSocket: any;
  let mockServer: any;

  beforeEach(() => {
    mockSocket = {
      id: 'socket-123',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      user: { id: 'user-123', username: 'testuser' },
    };

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    gateway.server = mockServer;
  });

  it('should handle joinRoom event', async () => {
    const data = { roomCode: 'ABC123' };
    
    const response = await gateway.handleJoinRoom(mockSocket, data);
    
    expect(response.success).toBe(true);
    expect(mockSocket.join).toHaveBeenCalledWith('ABC123');
  });
});
```

### Integration Tests

Test with real Socket.IO client:

```typescript
import { io, Socket } from 'socket.io-client';

describe('WebSocket Integration', () => {
  let clientSocket: Socket;

  beforeEach((done) => {
    clientSocket = io('http://localhost:4000', {
      withCredentials: true,
    });
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.close();
  });

  it('should join room and receive lobby update', (done) => {
    clientSocket.emit('joinRoom', { roomCode: 'ABC123' }, (response) => {
      expect(response.success).toBe(true);
      expect(response.lobby).toBeDefined();
      done();
    });
  });

  it('should receive lobby updates', (done) => {
    clientSocket.on('lobbyUpdate', (lobby) => {
      expect(lobby).toBeDefined();
      expect(lobby.roomCode).toBe('ABC123');
      done();
    });

    clientSocket.emit('joinRoom', { roomCode: 'ABC123' }, () => {});
  });
});
```

## Performance Optimization

### Connection Pooling

- Reuse Socket.IO connections
- Avoid unnecessary reconnections
- Implement heartbeat mechanism

### Message Optimization

- Send deltas instead of full state (future)
- Compress large payloads
- Batch related events

### Room Optimization

- Limit room size
- Clean up empty rooms
- Use namespaces for isolation

## Monitoring

### Connection Metrics

```typescript
@Get('metrics/websocket')
getWebSocketMetrics() {
  return {
    connectedUsers: this.connectionManager.getConnectedUsersCount(),
    rooms: this.getRoomCount(),
    timestamp: new Date(),
  };
}
```

### Logging

Comprehensive logging for troubleshooting:

```typescript
this.logger.log(`Client ${client.id} joined room ${roomCode}`);
this.logger.warn(`Client ${client.id} authentication failed`);
this.logger.error(`Error in handleJoinRoom:`, error);
```

## Security

### Token Validation

- JWT verified on every connection
- Expired tokens rejected
- Invalid tokens don't prevent connection (guest mode)

### Single Connection Enforcement

**Purpose**: Prevent users from maintaining multiple simultaneous connections

**Implementation**:

- Track active connections by userId
- When user reconnects, automatically disconnect previous socket
- Guest users (no userId) can maintain multiple connections

**Benefits**:

- Prevents connection abuse
- Reduces server load
- Ensures consistent player state

**Example**:

```typescript
// When user reconnects
const result = connectionManager.trackConnection(client);
if (result.socketsToDisconnect) {
  // Disconnect old sockets for this user
  result.socketsToDisconnect.forEach(socketId => {
    const oldSocket = server.sockets.sockets.get(socketId);
    oldSocket?.disconnect(true);
  });
}
```

### Reconnection Abuse Detection

**Purpose**: Detect and prevent rapid reconnection attacks

**Configuration**:

- **Max Reconnections**: 5 per minute
- **Time Window**: 60 seconds
- **Ban Duration**: 5 minutes

**How It Works**:

1. Track reconnection attempts per user
2. Count attempts within sliding 60-second window
3. If exceeds 5 attempts, temporarily ban user
4. Ban expires after 5 minutes

**Implementation**:

```typescript
interface UserReconnectionHistory {
  userId: string;
  attempts: ReconnectionAttempt[];
  bannedUntil: Date | null;
}

// Check if user is banned
if (userId && this.isUserBanned(userId)) {
  return {
    allowed: false,
    reason: 'Temporarily banned for connection abuse.'
  };
}

// Check for abusive pattern
if (userId && this.isReconnectionAbusive(userId)) {
  this.banUser(userId);
  return {
    allowed: false,
    reason: 'Too many reconnection attempts.'
  };
}
```

**Monitoring**:

```typescript
// Check user's ban status
const banStatus = connectionManager.getUserBanStatus(userId);
// { banned: true, bannedUntil: Date }

// Check reconnection history
const history = connectionManager.getUserReconnectionHistory(userId);
// { attempts: 3, recentAttempts: [Date, Date, Date] }
```

### Inactivity Timeout

**Purpose**: Automatically disconnect idle clients to prevent resource exhaustion

**Configuration**:

- **Timeout Duration**: 60 seconds
- **Check Interval**: 30 seconds

**How It Works**:

1. Track last activity time for each connection
2. Periodically check for inactive connections (every 30s)
3. Disconnect sockets inactive for >60 seconds
4. Activity updated on:
   - Initial connection
   - Room join/leave
   - Player ready updates
   - Any game action

**Implementation**:

```typescript
// Start monitoring when gateway initializes
connectionManager.startInactivityMonitoring((socketId: string) => {
  const socket = server.sockets.sockets.get(socketId);
  if (socket) {
    socket.disconnect(true);
  }
});

// Update activity on events
connectionManager.updateLastSeen(client.id);
```

**Lifecycle**:

```typescript
// In GameGateway
afterInit() {
  // Start monitoring
  this.connectionManager.startInactivityMonitoring(
    (socketId) => this.disconnectSocket(socketId)
  );
}

onModuleDestroy() {
  // Clean up
  this.connectionManager.stopInactivityMonitoring();
}
```

### Rate Limiting

Consider implementing rate limiting for:

- Connection attempts
- Event emissions  
- Room joins

### Input Validation

All event payloads validated:

```typescript
@SubscribeMessage('joinRoom')
async handleJoinRoom(
  @ConnectedSocket() client: TypedSocket,
  @MessageBody() data: SocketJoinRoomRequest,  // Validated by pipes
): Promise<SocketJoinRoomResponse>
```

### Security Best Practices

1. **Single connection per user**: Automatically enforced
2. **Monitor reconnection patterns**: Detect abuse early
3. **Timeout inactive connections**: Prevent resource exhaustion
4. **Validate all inputs**: Use DTOs and validation pipes
5. **Log security events**: Track bans and suspicious activity
6. **Regular cleanup**: Run lobby cleanup service
7. **Monitor metrics**: Track connection counts and patterns

### Testing Security Features

Example tests for security features:

```typescript
describe('ConnectionManager Security', () => {
  it('should enforce single connection per user', () => {
    const socket1 = createMockSocket(user, 'socket-1');
    const socket2 = createMockSocket(user, 'socket-2');
    
    connectionManager.trackConnection(socket1);
    const result = connectionManager.trackConnection(socket2);
    
    expect(result.socketsToDisconnect).toEqual(['socket-1']);
  });

  it('should ban user after excessive reconnections', () => {
    for (let i = 0; i < 7; i++) {
      connectionManager.trackConnection(
        createMockSocket(user, `socket-${i}`)
      );
    }
    
    const result = connectionManager.trackConnection(
      createMockSocket(user, 'socket-new')
    );
    
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('banned');
  });

  it('should disconnect inactive connections', (done) => {
    const disconnectCallback = jest.fn();
    
    connectionManager.trackConnection(socket);
    connectionManager.startInactivityMonitoring(disconnectCallback);
    
    // Fast forward past timeout
    jest.advanceTimersByTime(91000);
    
    expect(disconnectCallback).toHaveBeenCalledWith(socket.id);
    done();
  });
});
```

## Troubleshooting

### Connection Issues

**Problem**: Client can't connect

**Solutions**:

- Check CORS configuration
- Verify backend is running
- Check firewall rules
- Verify WebSocket transport enabled

### Authentication Failures

**Problem**: User not authenticated on socket

**Solutions**:

- Check JWT token present in cookie
- Verify token not expired
- Check JWT_SECRET matches
- Review WsAuthAdapter logs

### Room Broadcast Issues

**Problem**: Events not received by clients

**Solutions**:

- Verify client joined room
- Check room code normalized correctly
- Verify server has reference
- Check event names match

### Memory Leaks

**Problem**: Memory usage grows over time

**Solutions**:

- Implement cleanup on disconnect
- Remove event listeners
- Clear intervals/timeouts
- Run lobby cleanup service

## Best Practices

1. **Always normalize room codes** before operations
2. **Use acknowledgement callbacks** for client→server events
3. **Broadcast state changes** to keep clients in sync
4. **Log connection events** for debugging
5. **Clean up on disconnect** to prevent leaks
6. **Type all events** for safety
7. **Handle errors gracefully** in event handlers
8. **Test with multiple clients** to verify broadcasting

## Related Documentation

- [Socket.IO Events Reference](../api/socket-events.md)
- [Authentication](./authentication.md)
- [Game Mechanics](./game-mechanics.md)
- [Frontend Real-time Client](../frontend/realtime.md)

---

**Last Updated**: November 2024
