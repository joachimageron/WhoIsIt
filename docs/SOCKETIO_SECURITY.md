# Socket.IO Security Implementation

This document describes the security features implemented for Socket.IO in the WhoIsIt application.

## Overview

The Socket.IO gateway has been enhanced with authentication, connection tracking, and automatic cleanup mechanisms to ensure secure and reliable real-time communication.

## Features

### 1. Authentication Middleware

Socket.IO connections are authenticated using JWT tokens from HTTP-only cookies or authorization headers.

#### How It Works

1. **Token Extraction**: The `WsAuthAdapter` extracts JWT tokens from:
   - HTTP-only cookies (`access_token`)
   - Authorization header (`socket.handshake.auth.token`)

2. **Token Validation**: Validates the JWT token using the same secret as the REST API

3. **User Attachment**: Attaches the authenticated user object to the socket instance

4. **Graceful Degradation**: Allows unauthenticated connections but marks them as such

#### Code Example

```typescript
// The adapter is configured in main.ts
app.useWebSocketAdapter(new WsAuthAdapter(app, configService));
```

#### Socket Object Enhancement

Every socket now has a `user` property:

```typescript
type TypedSocket = Socket & {
  user?: User | null;
};
```

- If `user` is defined: The socket is authenticated
- If `user` is null: The socket is unauthenticated (guest)

### 2. Connection Tracking

The gateway tracks all connected users and their activities for reconnection handling and monitoring.

#### Tracked Information

```typescript
interface ConnectedUser {
  socketId: string;           // Unique socket ID
  userId: string | null;      // User ID if authenticated
  roomCode: string | null;    // Current room (game lobby)
  connectedAt: Date;          // When they connected
  lastSeenAt: Date;           // Last activity timestamp
}
```

#### Reconnection Detection

When a user reconnects with a new socket:
- The system detects the previous connection
- Logs the reconnection event
- Allows seamless transition between connections
- Previous connections are cleaned up on disconnect

#### Monitoring

Two methods provide visibility into system state:

```typescript
gateway.getConnectedUsersCount(): number  // Number of active connections
gateway.getActiveRoomsCount(): number     // Number of active game rooms
```

### 3. Lobby Cleanup Mechanism

Automatically cleans up abandoned game lobbies to prevent resource waste.

#### Configuration

```typescript
// Timeout after which inactive lobbies are cleaned up
private readonly LOBBY_TIMEOUT_MS = 30 * 60 * 1000;  // 30 minutes

// Interval for checking inactive lobbies
private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000;  // 5 minutes
```

#### Cleanup Logic

Every 5 minutes, the system:
1. Identifies rooms with no active connections
2. Checks if the game is still in lobby state
3. Verifies the lobby age (created more than 30 minutes ago)
4. Logs cleanup candidates (future: could delete from database)

#### Example Log Output

```
[GameGateway] Started lobby cleanup task (interval: 300s, timeout: 1800s)
[GameGateway] Found 2 potentially inactive lobbies
[GameGateway] Cleaning up abandoned lobby: ABC12 (age: 35m)
```

### 4. Enhanced Event Handlers

All Socket.IO event handlers have been enhanced with security features:

#### joinRoom

```typescript
@SubscribeMessage('joinRoom')
async handleJoinRoom(
  @ConnectedSocket() client: TypedSocket,
  @MessageBody() data: SocketJoinRoomRequest,
): Promise<SocketJoinRoomResponse>
```

**Security Enhancements:**
- Logs username of joining user
- Updates connection tracking with room membership
- Updates last seen timestamp

#### leaveRoom

**Security Enhancements:**
- Clears room from connection tracking
- Logs user leaving with context

#### updatePlayerReady

**Security Enhancements:**
- Updates last seen timestamp on activity
- Logs player actions with username

### 5. Lifecycle Management

Proper cleanup on module shutdown:

```typescript
onModuleDestroy() {
  if (this.cleanupInterval) {
    clearInterval(this.cleanupInterval);
    this.logger.log('Stopped lobby cleanup task');
  }
}
```

## Security Best Practices

### For Frontend Developers

1. **Always send cookies**: Ensure Socket.IO client is configured to send cookies
   ```typescript
   const socket = io(SOCKET_URL, {
     withCredentials: true,  // Important!
   });
   ```

2. **Handle authentication failures**: Be prepared for unauthenticated connections
   ```typescript
   socket.on('connect_error', (error) => {
     console.error('Connection failed:', error);
   });
   ```

3. **Implement reconnection logic**: The client should handle reconnection
   ```typescript
   socket.on('disconnect', (reason) => {
     if (reason === 'io server disconnect') {
       // Server disconnected, try to reconnect
       socket.connect();
     }
   });
   ```

### For Backend Developers

1. **Check authentication when needed**: 
   ```typescript
   if (!client.user) {
     return { success: false, error: 'Authentication required' };
   }
   ```

2. **Validate ownership**: Ensure users can only modify their own data
   ```typescript
   if (client.user.id !== playerId) {
     return { success: false, error: 'Unauthorized' };
   }
   ```

3. **Rate limiting**: Consider implementing rate limits for sensitive operations

## Testing

Comprehensive test suite covers:

- ✅ Authentication flow (authenticated and unauthenticated)
- ✅ Connection tracking and reconnection detection
- ✅ Room join/leave operations
- ✅ Player ready state updates
- ✅ Error handling
- ✅ Cleanup mechanism
- ✅ Lifecycle management

Run tests:
```bash
cd apps/backend
pnpm test game.gateway.spec.ts
```

## Monitoring & Debugging

### Log Levels

The gateway uses structured logging:

```typescript
// INFO level
this.logger.log('Client connected: socket-123 (user: testuser, authenticated: true)');
this.logger.log('Started lobby cleanup task (interval: 300s, timeout: 1800s)');

// ERROR level
this.logger.error('Error in handleJoinRoom:', error);
```

### Metrics to Monitor

1. **Connection count**: Track `getConnectedUsersCount()` over time
2. **Room count**: Monitor `getActiveRoomsCount()` for capacity planning
3. **Cleanup frequency**: Check logs for abandoned lobby frequency
4. **Authentication failures**: Watch for failed authentication attempts

## Future Enhancements

Potential improvements for future iterations:

1. **Database cleanup**: Actually delete abandoned games from database
2. **Rate limiting**: Implement per-user rate limits on events
3. **IP-based tracking**: Track guest users by IP for abuse prevention
4. **Session management**: Persist sessions across server restarts
5. **Metrics export**: Export connection metrics to monitoring systems
6. **Advanced authorization**: Implement role-based access control
7. **Audit logging**: Log all user actions for compliance

## Troubleshooting

### Common Issues

**Issue**: Clients can't connect
- **Solution**: Check CORS configuration and `withCredentials: true`

**Issue**: Authentication fails but user has valid JWT
- **Solution**: Verify JWT secret matches between REST API and Socket.IO

**Issue**: Reconnection not detected
- **Solution**: Ensure user IDs are consistent across connections

**Issue**: Lobbies not being cleaned up
- **Solution**: Check that cleanup task is running (look for startup log)

### Debug Commands

Enable verbose logging:
```typescript
Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

Check active connections:
```typescript
// In NestJS controller or service
const count = this.gameGateway.getConnectedUsersCount();
const rooms = this.gameGateway.getActiveRoomsCount();
```

## Related Documentation

- [Socket.IO Flow](./SOCKETIO_FLOW.md) - Data flow diagrams
- [Socket.IO Integration](./SOCKETIO_INTEGRATION.md) - Integration guide
- [Authentication API](./authentication-api.md) - JWT authentication details
- [Games API](./games-api.md) - Game management endpoints

## Change Log

### Version 0.1.0 (October 2025)

- ✅ Implemented JWT-based authentication middleware
- ✅ Added connection tracking with reconnection detection
- ✅ Implemented automated lobby cleanup (30-minute timeout)
- ✅ Enhanced all event handlers with security logging
- ✅ Added comprehensive test suite (23 tests)
- ✅ Proper lifecycle management with cleanup
