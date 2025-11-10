# Socket.IO Events Reference

## Overview

WhoIsIt uses Socket.IO for real-time bidirectional communication between the frontend and backend. This enables instant lobby updates, game events, and player interactions without polling.

## Connection

### Establishing Connection

**Client Side**:
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  autoConnect: false,          // Manual connection control
  transports: ['websocket'],   // WebSocket only (no polling)
  withCredentials: true,       // Include cookies for auth
});

// Connect when needed
socket.connect();
```

**Authentication**:
- JWT token automatically sent via HTTP-only cookie
- Backend extracts token using custom WsAuthAdapter
- Connection allowed even without authentication (guest users)
- `socket.user` attached if authenticated

### Connection Events

**`connect`** - Client connected to server
```typescript
socket.on('connect', () => {
  console.log('Connected!', socket.id);
});
```

**`disconnect`** - Client disconnected from server
```typescript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Reason can be: 'io server disconnect', 'io client disconnect', 
  // 'ping timeout', 'transport close', etc.
});
```

**`connect_error`** - Connection error occurred
```typescript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

## Client → Server Events

Events sent from client to server with acknowledgement callbacks.

### `joinRoom`

Join a game lobby room.

**Request**:
```typescript
interface SocketJoinRoomRequest {
  roomCode: string;    // 6-character room code
  playerId?: string;   // Optional player ID (for reconnection)
}
```

**Response** (via callback):
```typescript
interface SocketJoinRoomResponse {
  success: boolean;
  lobby?: GameLobbyResponse;  // Current lobby state if successful
  error?: string;             // Error message if failed
}
```

**Example**:
```typescript
socket.emit('joinRoom', 
  { roomCode: 'ABC123' }, 
  (response) => {
    if (response.success) {
      console.log('Joined lobby:', response.lobby);
    } else {
      console.error('Failed to join:', response.error);
    }
  }
);
```

**Success Response**:
```json
{
  "success": true,
  "lobby": {
    "id": "uuid",
    "roomCode": "ABC123",
    "status": "lobby",
    "players": [...]
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Game not found"
}
```

**Side Effects**:
- Client joins Socket.IO room
- Connection tracked in ConnectionManager
- `lobbyUpdate` emitted to joining client
- `playerJoined` broadcast to other players in room

---

### `leaveRoom`

Leave a game lobby room.

**Request**:
```typescript
interface SocketLeaveRoomRequest {
  roomCode: string;    // 6-character room code
  playerId?: string;   // Optional player ID
}
```

**Response** (via callback):
```typescript
interface SocketLeaveRoomResponse {
  success: boolean;
  error?: string;
}
```

**Example**:
```typescript
socket.emit('leaveRoom',
  { roomCode: 'ABC123', playerId: 'player-uuid' },
  (response) => {
    if (response.success) {
      console.log('Left room successfully');
    } else {
      console.error('Failed to leave:', response.error);
    }
  }
);
```

**Side Effects**:
- Client leaves Socket.IO room
- Player marked as left in database (`leftAt` timestamp)
- `playerLeft` broadcast to remaining players
- `lobbyUpdate` broadcast with updated player list

---

### `updatePlayerReady`

Toggle player's ready status in lobby.

**Request**:
```typescript
interface SocketUpdatePlayerReadyRequest {
  roomCode: string;    // 6-character room code
  playerId: string;    // Player UUID
  isReady: boolean;    // New ready status
}
```

**Response** (via callback):
```typescript
interface SocketUpdatePlayerReadyResponse {
  success: boolean;
  lobby?: GameLobbyResponse;  // Updated lobby state if successful
  error?: string;             // Error message if failed
}
```

**Example**:
```typescript
socket.emit('updatePlayerReady',
  { 
    roomCode: 'ABC123',
    playerId: 'player-uuid',
    isReady: true 
  },
  (response) => {
    if (response.success) {
      console.log('Ready status updated:', response.lobby);
    }
  }
);
```

**Side Effects**:
- Player's `isReady` field updated in database
- `lobbyUpdate` broadcast to all players in room
- Host can start game when all players ready

---

## Server → Client Events

Events broadcast from server to client(s).

### `lobbyUpdate`

Broadcast whenever lobby state changes.

**Payload**:
```typescript
type LobbyUpdateEvent = GameLobbyResponse;
```

**Example**:
```typescript
socket.on('lobbyUpdate', (lobby) => {
  console.log('Lobby updated:', lobby);
  // Update UI with new lobby state
  updateLobbyDisplay(lobby);
});
```

**Full Payload Structure**:
```json
{
  "id": "uuid",
  "roomCode": "ABC123",
  "status": "lobby",
  "visibility": "private",
  "hostUserId": "uuid",
  "characterSetId": "uuid",
  "maxPlayers": 6,
  "turnTimerSeconds": 30,
  "ruleConfig": {},
  "createdAt": "2024-01-01T00:00:00Z",
  "players": [
    {
      "id": "uuid",
      "username": "Player 1",
      "avatarUrl": null,
      "role": "host",
      "isReady": true,
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Triggered By**:
- Player joins or leaves
- Player ready status changes
- Game settings change (future feature)

---

### `playerJoined`

Broadcast when a new player joins the lobby.

**Payload**:
```typescript
interface SocketPlayerJoinedEvent {
  roomCode: string;
  lobby: GameLobbyResponse;
}
```

**Example**:
```typescript
socket.on('playerJoined', (event) => {
  console.log('New player joined:', event.roomCode);
  toast.info(`${event.lobby.players[event.lobby.players.length - 1].username} joined!`);
  updateLobbyDisplay(event.lobby);
});
```

**Note**: The joining player receives `lobbyUpdate` instead of `playerJoined`.

---

### `playerLeft`

Broadcast when a player leaves the lobby.

**Payload**:
```typescript
interface SocketPlayerLeftEvent {
  roomCode: string;
  lobby: GameLobbyResponse;
}
```

**Example**:
```typescript
socket.on('playerLeft', (event) => {
  console.log('Player left:', event.roomCode);
  toast.info('A player left the game');
  updateLobbyDisplay(event.lobby);
});
```

**Note**: The leaving player does NOT receive this event.

---

### `gameStarted`

Broadcast when the host starts the game.

**Payload**:
```typescript
interface SocketGameStartedEvent {
  roomCode: string;
  lobby: GameLobbyResponse;  // Lobby with status: 'in_progress'
}
```

**Example**:
```typescript
socket.on('gameStarted', (event) => {
  console.log('Game started!', event.roomCode);
  // Navigate to game page
  router.push(`/game/play/${event.roomCode}`);
});
```

**Triggered By**:
- Host calls `POST /games/:roomCode/start` endpoint
- All players must be ready
- Exactly 2 players required

**Side Effects**:
- Secret characters assigned to players
- First round created
- Game status changed to `in_progress`

---

### `questionAsked`

Broadcast when a player asks a question.

**Payload**:
```typescript
interface SocketQuestionAskedEvent {
  roomCode: string;
  question: QuestionResponse;
  gameState: GameStateResponse;
}

interface QuestionResponse {
  id: string;
  roundId: string;
  roundNumber: number;
  askedByPlayerId: string;
  askedByPlayerUsername: string;
  targetPlayerId?: string;
  targetPlayerUsername?: string;
  questionText: string;
  askedAt: string;
}

interface GameStateResponse {
  id: string;
  roomCode: string;
  status: GameStatus;
  currentRoundNumber: number;
  currentRoundState: string;
  activePlayerId?: string;
  activePlayerUsername?: string;
  players: GamePlayerResponse[];
}
```

**Example**:
```typescript
socket.on('questionAsked', (event) => {
  console.log('Question asked:', event.question.questionText);
  displayQuestion(event.question);
  updateGameState(event.gameState);
});
```

---

### `answerSubmitted`

Broadcast when a player answers a question.

**Payload**:
```typescript
interface SocketAnswerSubmittedEvent {
  roomCode: string;
  answer: AnswerResponse;
  gameState: GameStateResponse;
}

interface AnswerResponse {
  id: string;
  questionId: string;
  answeredByPlayerId: string;
  answeredByPlayerUsername: string;
  answerValue: 'yes' | 'no' | 'unsure';
  answerText?: string;
  latencyMs?: number;
  answeredAt: string;
}
```

**Example**:
```typescript
socket.on('answerSubmitted', (event) => {
  console.log('Answer:', event.answer.answerValue);
  displayAnswer(event.answer);
  updateGameState(event.gameState);
});
```

---

### `guessResult`

Broadcast when a player makes a guess.

**Payload**:
```typescript
interface SocketGuessResultEvent {
  roomCode: string;
  guess: GuessResponse;
  gameState: GameStateResponse;
}

interface GuessResponse {
  id: string;
  roundId: string;
  roundNumber: number;
  guessedByPlayerId: string;
  guessedByPlayerUsername: string;
  targetPlayerId?: string;
  targetPlayerUsername?: string;
  targetCharacterId: string;
  targetCharacterName: string;
  isCorrect: boolean;
  latencyMs?: number;
  guessedAt: string;
}
```

**Example**:
```typescript
socket.on('guessResult', (event) => {
  if (event.guess.isCorrect) {
    toast.success(`${event.guess.guessedByPlayerUsername} guessed correctly!`);
  } else {
    toast.error(`Wrong guess!`);
  }
  updateGameState(event.gameState);
});
```

---

### `gameOver`

Broadcast when the game ends.

**Payload**:
```typescript
interface SocketGameOverEvent {
  roomCode: string;
  result: GameOverResult;
}

interface GameOverResult {
  gameId: string;
  roomCode: string;
  winnerId?: string;
  winnerUsername?: string;
  totalRounds: number;
  gameDurationSeconds: number;
  endReason: 'victory' | 'last_player_standing' | 'aborted';
  players: PlayerGameResult[];
}

interface PlayerGameResult {
  playerId: string;
  playerUsername: string;
  userId?: string;
  score: number;
  questionsAsked: number;
  questionsAnswered: number;
  correctGuesses: number;
  incorrectGuesses: number;
  timePlayedSeconds: number;
  isWinner: boolean;
  placement: number;
  leftAt?: string;
}
```

**Example**:
```typescript
socket.on('gameOver', (event) => {
  console.log('Game over!', event.result);
  // Navigate to results page
  router.push(`/game/results/${event.roomCode}`);
  displayResults(event.result);
});
```

---

## Room Pattern

Socket.IO uses **rooms** for targeted message broadcasting.

### How Rooms Work

1. **Client joins room**: `socket.join('ABC123')`
2. **Server broadcasts to room**: `server.to('ABC123').emit('event', data)`
3. **Only clients in that room** receive the event
4. **Client leaves room**: `socket.leave('ABC123')`

### Room Naming Convention

- Rooms are named after room codes: `'ABC123'`, `'XYZ789'`
- Room codes are normalized to uppercase: `abc123` → `ABC123`
- Each game has its own room

### Broadcasting Patterns

**Broadcast to all in room except sender**:
```typescript
socket.to(roomCode).emit('event', data);
```

**Broadcast to all in room including sender**:
```typescript
server.to(roomCode).emit('event', data);
```

**Send to specific client**:
```typescript
server.to(clientId).emit('event', data);
```

## Connection Management

### Connection Tracking

Backend tracks connections using `ConnectionManager`:

```typescript
interface ConnectionInfo {
  socketId: string;
  userId?: string;
  username?: string;
  roomCode: string | null;
  playerId: string | null;
  connectedAt: Date;
  lastActivity: Date;
}
```

### Disconnect Handling

When client disconnects:
1. `handleDisconnect` called in gateway
2. Connection removed from tracking
3. If in a room, cleanup may occur
4. Reconnection possible with same player ID

### Reconnection

Clients can reconnect and rejoin rooms:
```typescript
// On reconnect
socket.emit('joinRoom', { 
  roomCode: 'ABC123', 
  playerId: savedPlayerId  // Use saved player ID
}, (response) => {
  // Resume game state
});
```

## Error Handling

### Client-Side

```typescript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  // Show error to user
  toast.error('Connection failed. Retrying...');
});

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server disconnected the client
    // Manual reconnection needed
    socket.connect();
  }
  // Otherwise, socket will auto-reconnect
});
```

### Server-Side

Events return error in acknowledgement:
```typescript
socket.emit('joinRoom', { roomCode: 'INVALID' }, (response) => {
  if (!response.success) {
    console.error('Error:', response.error);
    // Handle error
  }
});
```

## Frontend Integration

### Custom Hook Pattern

```typescript
// hooks/use-game-socket.ts
import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';

export const useGameSocket = () => {
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }
    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomCode: string) => {
    return new Promise<SocketJoinRoomResponse>((resolve) => {
      socketRef.current.emit('joinRoom', { roomCode }, resolve);
    });
  }, []);

  const onLobbyUpdate = useCallback((callback: (lobby: GameLobbyResponse) => void) => {
    socketRef.current.on('lobbyUpdate', callback);
    return () => {
      socketRef.current.off('lobbyUpdate', callback);
    };
  }, []);

  return { joinRoom, onLobbyUpdate };
};
```

### Usage in Components

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useGameSocket } from '@/hooks/use-game-socket';

export default function LobbyPage({ roomCode }: { roomCode: string }) {
  const [lobby, setLobby] = useState<GameLobbyResponse | null>(null);
  const { joinRoom, onLobbyUpdate } = useGameSocket();

  useEffect(() => {
    // Join room on mount
    joinRoom(roomCode).then((response) => {
      if (response.success) {
        setLobby(response.lobby);
      }
    });

    // Listen for updates
    const cleanup = onLobbyUpdate((updatedLobby) => {
      setLobby(updatedLobby);
    });

    return cleanup;
  }, [roomCode, joinRoom, onLobbyUpdate]);

  if (!lobby) return <Spinner />;

  return <LobbyDisplay lobby={lobby} />;
}
```

## Testing WebSocket Events

### Using Socket.IO Client

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('Connected!');
  
  // Test join room
  socket.emit('joinRoom', { roomCode: 'ABC123' }, (response) => {
    console.log('Join response:', response);
  });
});

socket.on('lobbyUpdate', (lobby) => {
  console.log('Lobby update:', lobby);
});
```

### Using Browser Console

```javascript
// In browser console (after socket loaded)
window.socket = io('http://localhost:4000', { withCredentials: true });

window.socket.on('connect', () => console.log('Connected!'));

window.socket.emit('joinRoom', { roomCode: 'ABC123' }, console.log);

window.socket.on('lobbyUpdate', console.log);
```

## Performance Considerations

### Message Size

Keep payloads small:
- Use IDs instead of full objects when possible
- Avoid sending entire game state repeatedly
- Send deltas for partial updates (future enhancement)

### Broadcasting

Current implementation broadcasts full state:
```typescript
// Current: Full lobby update
server.to(roomCode).emit('lobbyUpdate', fullLobby);

// Future optimization: Delta updates
server.to(roomCode).emit('playerReadyChanged', { 
  playerId, 
  isReady 
});
```

### Connection Limits

Monitor active connections:
- Backend tracks all connections
- Cleanup abandoned connections
- Implement connection limits if needed

## Security

### Authentication

- JWT token in HTTP-only cookie
- Backend validates token for each connection
- `socket.user` contains authenticated user info
- Guest users allowed (no token required)

### Room Access Control

Currently no restrictions:
- Any client can join any room with valid code
- Future: Private room passwords
- Future: Invitation-only rooms

### Input Validation

All event payloads validated:
- Room codes normalized (uppercase, trimmed)
- Player IDs validated (UUID format)
- Required fields checked

## Debugging

### Enable Debug Logging

**Client**:
```typescript
localStorage.setItem('debug', 'socket.io-client:*');
```

**Server**:
```bash
DEBUG=socket.io:* pnpm dev:backend
```

### Common Issues

**Connection Fails**:
- Check CORS configuration
- Verify backend is running
- Check firewall rules
- Verify cookie credentials

**Events Not Received**:
- Check client is in correct room
- Verify event names match exactly
- Check server is broadcasting to room
- Use browser DevTools → Network → WS tab

**Disconnections**:
- Check network stability
- Verify server didn't crash
- Check for errors in server logs
- Implement reconnection logic

## Related Documentation

- [REST API Reference](./rest-api.md)
- [Backend WebSocket Implementation](../backend/websockets.md)
- [Frontend Real-time Client](../frontend/realtime.md)
- [Shared Types](./types.md)

---

**Last Updated**: November 2024
