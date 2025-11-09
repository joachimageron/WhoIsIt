# API Documentation

## Overview

This section contains comprehensive documentation for the WhoIsIt API, including REST endpoints, WebSocket events, and shared type contracts.

## Contents

### [REST API Reference](./rest-api.md)

Complete HTTP endpoint documentation:

- **Authentication**: Register, login, logout, password reset
- **Game Management**: Create, join, lobby, start game
- **Gameplay**: Questions, answers, guesses
- **Character Sets**: List and retrieve character sets
- **Request/Response formats** with examples
- **Error codes** and handling
- **Testing with cURL and Postman**

### [Socket.IO Events](./socket-events.md)

Real-time WebSocket event documentation:

- **Client → Server events**: joinRoom, leaveRoom, updatePlayerReady
- **Server → Client events**: lobbyUpdate, playerJoined, gameStarted
- **Event payloads** and acknowledgements
- **Connection management and tracking**
- **Room patterns and broadcasting**
- **Error handling and debugging**
- **Testing WebSocket events**

### [Shared Types](./types)

TypeScript type contracts from `@whois-it/contracts`:

- Request/Response DTOs
- Game state types
- Socket.IO event types
- Enums and constants
- Usage examples

## Quick Reference

### Base URLs

```bash
# Development
REST API: http://localhost:4000
WebSocket: ws://localhost:4000

# Production
REST API: https://api.whoisit.com
WebSocket: wss://api.whoisit.com
```

### Authentication

**Method**: JWT tokens in HTTP-only cookies

**Cookie Name**: `access_token`

**Request Example**:

```typescript
fetch('http://localhost:4000/auth/profile', {
  credentials: 'include',  // Include cookies
})
```

**Socket.IO Connection**:

```typescript
const socket = io('http://localhost:4000', {
  withCredentials: true,  // Include cookies
});
```

### Common Response Formats

**Success**:

```json
{
  "data": { ... },
  "message": "Success"
}
```

**Error**:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Auth required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error |

## API Sections

### Authentication Endpoints

```text
POST   /auth/register          # Create account
POST   /auth/login             # Login
GET    /auth/profile           # Get current user
POST   /auth/logout            # Logout
POST   /auth/verify-email      # Verify email
POST   /auth/forgot-password   # Request reset
POST   /auth/reset-password    # Reset password
```

### Game Endpoints

```text
POST   /games                  # Create game
POST   /games/:roomCode/join   # Join game
GET    /games/:roomCode        # Get lobby state
POST   /games/:roomCode/start  # Start game
GET    /games/:roomCode/players/:playerId/character  # Get secret
```

### Gameplay Endpoints

```text
POST   /games/:roomCode/questions            # Ask question
POST   /games/:roomCode/questions/:id/answer # Submit answer
POST   /games/:roomCode/guesses              # Make guess
```

### Character Set Endpoints

```text
GET    /character-sets         # List all sets
GET    /character-sets/:id     # Get set with characters
```

## WebSocket Events Overview

### Client → Server

| Event | Purpose |
|-------|---------|
| `joinRoom` | Join game lobby |
| `leaveRoom` | Leave game lobby |
| `updatePlayerReady` | Toggle ready status |

### Server → Client

| Event | Purpose |
|-------|---------|
| `lobbyUpdate` | Lobby state changed |
| `playerJoined` | Player joined lobby |
| `playerLeft` | Player left lobby |
| `gameStarted` | Game has started |
| `questionAsked` | Question was asked |
| `answerSubmitted` | Answer was submitted |
| `guessResult` | Guess result available |
| `gameOver` | Game completed |

## Type Contracts

All types are defined in `packages/contracts/index.d.ts` and shared between frontend and backend.

### Example Types

```typescript
// Game creation request
export type CreateGameRequest = {
  characterSetId: string;
  hostUsername?: string;
  hostUserId?: string;
  visibility?: GameVisibility;
  maxPlayers?: number | null;
  turnTimerSeconds?: number | null;
  ruleConfig?: Record<string, unknown>;
};

// Game lobby response
export type GameLobbyResponse = {
  id: string;
  roomCode: string;
  status: GameStatus;
  visibility: GameVisibility;
  players: GamePlayerResponse[];
  // ...
};

// Socket.IO events
export interface ClientToServerEvents {
  joinRoom: (
    data: SocketJoinRoomRequest,
    callback: (response: SocketJoinRoomResponse) => void,
  ) => void;
  // ...
}
```

## Testing the API

### Using cURL

**Register**:

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"password123"}' \
  -c cookies.txt
```

**Create Game**:

```bash
curl -X POST http://localhost:4000/games \
  -H "Content-Type: application/json" \
  -d '{"characterSetId":"<uuid>","hostUsername":"Player1"}' \
  -b cookies.txt
```

### Using Postman

1. Import API endpoints
2. Set base URL: `http://localhost:4000`
3. Enable "Send cookies" in settings
4. Test authentication flow

### Using Socket.IO Client

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('Connected!');
});

socket.emit('joinRoom', { roomCode: 'ABC123' }, (response) => {
  console.log('Joined:', response);
});

socket.on('lobbyUpdate', (lobby) => {
  console.log('Lobby updated:', lobby);
});
```

## API Design Principles

### RESTful Design

- Resources identified by URLs
- HTTP methods for actions (GET, POST, PUT, DELETE)
- Stateless requests (state in token)
- Standard status codes

### WebSocket Patterns

- Event-driven communication
- Acknowledgement callbacks for request-response
- Broadcast events for updates
- Room-based targeting

### Type Safety

- Shared TypeScript types
- Compile-time validation
- Runtime validation (class-validator)
- Auto-completion in IDEs

### Error Handling

- Consistent error format
- Descriptive error messages
- Appropriate status codes
- Validation errors detailed

## Rate Limiting

**Current**: No rate limiting implemented

**Recommended for Production**:

```text
/auth/login       - 5 requests per minute
/auth/register    - 3 requests per hour
/games            - 30 requests per minute
/games/*/join     - 10 requests per minute
```

## CORS Configuration

```typescript
// Backend configuration
app.enableCors({
  origin: process.env.FRONTEND_ORIGIN ?? true,
  credentials: true,  // Allow cookies
});
```

**Development**: All origins allowed
**Production**: Whitelist specific origins

## Versioning

**Current Version**: v1 (implicit)

**Future Versioning Strategy**:

- URL-based: `/api/v2/games`
- Header-based: `Accept: application/vnd.whoisit.v2+json`
- Maintain backward compatibility

## Security Considerations

### Authenticationn

- JWT tokens in HTTP-only cookies (XSS protection)
- Secure flag in production (HTTPS only)
- SameSite attribute (CSRF protection)
- Short expiration times

### Input Validation

- All inputs validated with class-validator
- SQL injection prevention (parameterized queries)
- XSS prevention (React escaping)
- File upload restrictions

### Rate Limitingg

- Implement in production
- Protect against brute force
- DDoS mitigation

## Performance Tips

### REST API

- Use pagination for lists
- Implement caching (Redis)
- Optimize database queries
- Use HTTP compression

### WebSocket

- Minimize payload sizes
- Use rooms for targeted broadcasts
- Implement reconnection logic
- Monitor connection count

## Monitoring

### Metrics to Track

- Request latency
- Error rates
- WebSocket connections
- Database query performance

### Logging

- Request/response logs
- Error logs with stack traces
- WebSocket event logs
- Database query logs

## Documentation Tools

### Future Enhancements

- **Swagger/OpenAPI**: Auto-generated REST API docs
- **AsyncAPI**: WebSocket event documentation
- **Postman Collection**: Importable API collection
- **GraphQL Schema**: Alternative to REST

## Getting Help

1. **REST API**: See [REST API Reference](./rest-api.md)
2. **WebSocket**: See Socket.IO Events (Coming Soon)
3. **Types**: Check `packages/contracts/index.d.ts`
4. **Examples**: Review frontend API clients in `apps/frontend/lib/`

## Examples and Tutorials

### Complete Game Flow

1. **Register/Login**

   ```typescript
   const response = await fetch('/auth/login', {
     method: 'POST',
     body: JSON.stringify({ email, password }),
     credentials: 'include',
   });
   ```

2. **Create Game**

   ```typescript
   const game = await fetch('/games', {
     method: 'POST',
     body: JSON.stringify({ characterSetId, hostUsername }),
     credentials: 'include',
   });
   const { roomCode } = await game.json();
   ```

3. **Connect WebSocket**

   ```typescript
   const socket = io('http://localhost:4000', {
     withCredentials: true,
   });
   
   socket.emit('joinRoom', { roomCode }, (response) => {
     if (response.success) {
       console.log('Joined lobby!');
     }
   });
   ```

4. **Listen for Updates**

   ```typescript
   socket.on('lobbyUpdate', (lobby) => {
     updateUI(lobby);
   });
   
   socket.on('gameStarted', (event) => {
     navigateToGame(event.roomCode);
   });
   ```

## Related Documentation

- [Backend Documentation](../backend/README.md)
- [Frontend Documentation](../frontend/README.md)
- [Architecture Overview](../architecture/overview.md)
- [Getting Started Guide](../development/getting-started.md)

---

**API Version**: 1.0.0  
**Last Updated**: November 2024
