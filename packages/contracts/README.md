# Contracts Package

Shared TypeScript type definitions and API contracts between the WhoIsIt frontend and backend.

## Overview

The `@whois-it/contracts` package provides:

- Type-safe API request/response types
- Socket.IO event type definitions
- Shared enums and constants
- Data transfer objects (DTOs)
- Type safety across frontend and backend

## Purpose

This package ensures:

- **Type Safety**: Compile-time checks for API calls
- **Single Source of Truth**: Types defined once, used everywhere
- **API Contract**: Clear interface between frontend and backend
- **Refactoring Safety**: Changes cascade through both apps
- **Documentation**: Types serve as API documentation

## Package Structure

```
packages/contracts/
├── package.json      # Package metadata
└── index.d.ts        # All type definitions
```

## Type Categories

### Game Types

#### GameStatus
```typescript
type GameStatus = "lobby" | "in_progress" | "completed" | "aborted";
```

#### GameVisibility
```typescript
type GameVisibility = "public" | "private";
```

#### GamePlayerRole
```typescript
type GamePlayerRole = "host" | "player";
```

---

### REST API Types

#### Game Creation

**CreateGameRequest**
```typescript
{
  characterSetId: string;
  visibility?: GameVisibility;
  turnTimerSeconds?: number | null;
  ruleConfig?: Record<string, unknown>;
}
```

**GameLobbyResponse**
```typescript
{
  id: string;
  roomCode: string;
  status: GameStatus;
  visibility: GameVisibility;
  hostUserId?: string;
  characterSetId: string;
  turnTimerSeconds?: number;
  ruleConfig: Record<string, unknown>;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  players: GamePlayerResponse[];
}
```

**GamePlayerResponse**
```typescript
{
  id: string;
  username: string;
  avatarUrl?: string;
  role: GamePlayerRole;
  isReady: boolean;
  joinedAt: string;
  leftAt?: string;
  userId?: string;
}
```

---

#### Character Sets

**CharacterSetResponseDto**
```typescript
{
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  visibility: string;
  isDefault: boolean;
  metadata: Record<string, unknown>;
  characterCount?: number;
}
```

**CharacterResponseDto**
```typescript
{
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  summary?: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
}
```

**PlayerCharacterResponse**
```typescript
{
  playerId: string;
  character: CharacterResponseDto;
  assignedAt: string;
}
```

---

#### Questions

**AskQuestionRequest**
```typescript
{
  targetPlayerId: string;
  questionText: string;
}
```

**QuestionResponse**
```typescript
{
  id: string;
  roundId: string;
  roundNumber: number;
  askedByPlayerId: string;
  askedByPlayerUsername: string;
  targetPlayerId: string;
  targetPlayerUsername: string;
  questionText: string;
  askedAt: string;
}
```

---

#### Answers

**AnswerValue**
```typescript
type AnswerValue = "yes" | "no" | "unsure";
```

**SubmitAnswerRequest**
```typescript
{
  questionId: string;
  answerValue: AnswerValue;
  answerText?: string;
}
```

**AnswerResponse**
```typescript
{
  id: string;
  questionId: string;
  answeredByPlayerId: string;
  answeredByPlayerUsername: string;
  answerValue: AnswerValue;
  answerText?: string;
  latencyMs?: number;
  answeredAt: string;
}
```

---

#### Guesses

**SubmitGuessRequest**
```typescript
{
  targetPlayerId: string;
  targetCharacterId: string;
}
```

**GuessResponse**
```typescript
{
  id: string;
  roundId: string;
  roundNumber: number;
  guessedByPlayerId: string;
  guessedByPlayerUsername: string;
  targetPlayerId: string;
  targetPlayerUsername: string;
  targetCharacterId: string;
  targetCharacterName: string;
  isCorrect: boolean;
  latencyMs?: number;
  guessedAt: string;
}
```

---

#### Game State

**GameStateResponse**
```typescript
{
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

---

#### Game Results

**PlayerGameResult**
```typescript
{
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

**GameOverResult**
```typescript
{
  gameId: string;
  roomCode: string;
  winnerId?: string;
  winnerUsername?: string;
  completedAt: string;
  playerResults: PlayerGameResult[];
}
```

---

### Socket.IO Event Types

#### Server to Client Events

**Interface**: `ServerToClientEvents`

Events the server emits to clients:

- `lobbyUpdate(lobby: GameLobbyResponse)` - Lobby state changed
- `playerJoined(event: SocketPlayerJoinedEvent)` - New player joined
- `playerLeft(event: SocketPlayerLeftEvent)` - Player left
- `gameStarted(event: SocketGameStartedEvent)` - Game started
- `questionAsked(event: SocketQuestionAskedEvent)` - Question asked
- `answerSubmitted(event: SocketAnswerSubmittedEvent)` - Answer submitted
- `guessResult(event: SocketGuessResultEvent)` - Guess result
- `gameOver(event: SocketGameOverEvent)` - Game ended

---

#### Client to Server Events

**Interface**: `ClientToServerEvents`

Events clients emit to server:

- `joinRoom(data, callback)` - Join game room
- `leaveRoom(data, callback)` - Leave game room
- `updatePlayerReady(data, callback)` - Update ready status

**Socket Request/Response Types**:

```typescript
// Join Room
type SocketJoinRoomRequest = {
  roomCode: string;
};

type SocketJoinRoomResponse = {
  success: boolean;
  lobby?: GameLobbyResponse;
  error?: string;
};

// Leave Room
type SocketLeaveRoomRequest = {
  roomCode: string;
};

type SocketLeaveRoomResponse = {
  success: boolean;
  error?: string;
};

// Update Ready Status
type SocketUpdatePlayerReadyRequest = {
  roomCode: string;
  isReady: boolean;
};

type SocketUpdatePlayerReadyResponse = {
  success: boolean;
  lobby?: GameLobbyResponse;
  error?: string;
};
```

---

#### Socket Event Payloads

**SocketPlayerJoinedEvent**
```typescript
{
  roomCode: string;
  lobby: GameLobbyResponse;
}
```

**SocketPlayerLeftEvent**
```typescript
{
  roomCode: string;
  lobby: GameLobbyResponse;
}
```

**SocketGameStartedEvent**
```typescript
{
  roomCode: string;
  lobby: GameLobbyResponse;
}
```

**SocketQuestionAskedEvent**
```typescript
{
  roomCode: string;
  question: QuestionResponse;
  gameState: GameStateResponse;
}
```

**SocketAnswerSubmittedEvent**
```typescript
{
  roomCode: string;
  answer: AnswerResponse;
  gameState: GameStateResponse;
}
```

**SocketGuessResultEvent**
```typescript
{
  roomCode: string;
  guess: GuessResponse;
  gameState: GameStateResponse;
}
```

**SocketGameOverEvent**
```typescript
{
  roomCode: string;
  gameOverResult: GameOverResult;
}
```

---

## Usage

### In Backend (NestJS)

```typescript
import type {
  CreateGameRequest,
  GameLobbyResponse,
  QuestionResponse,
} from '@whois-it/contracts';

@Controller('games')
export class GameController {
  @Post()
  async createGame(
    @Body() body: CreateGameRequest
  ): Promise<GameLobbyResponse> {
    // Implementation
  }

  @Post(':roomCode/questions')
  async askQuestion(
    @Param('roomCode') roomCode: string,
    @Body() body: AskQuestionRequest
  ): Promise<QuestionResponse> {
    // Implementation
  }
}
```

### In Frontend (Next.js/React)

```typescript
import type {
  CreateGameRequest,
  GameLobbyResponse,
  ServerToClientEvents,
  ClientToServerEvents,
} from '@whois-it/contracts';
import type { Socket } from 'socket.io-client';

// API call
const createGame = async (
  characterSetId: string
): Promise<GameLobbyResponse> => {
  const request: CreateGameRequest = { characterSetId };
  const response = await fetch('/games', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.json();
};

// Socket.IO typed client
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const socket: TypedSocket = io();

socket.on('lobbyUpdate', (lobby: GameLobbyResponse) => {
  console.log('Lobby updated:', lobby);
});

socket.emit('joinRoom', { roomCode: 'ABC12' }, (response) => {
  if (response.success) {
    console.log('Joined:', response.lobby);
  }
});
```

---

## Benefits

### Type Safety

```typescript
// ✅ Correct usage
const request: CreateGameRequest = {
  characterSetId: 'abc-123',
};

// ❌ TypeScript error - missing required field
const badRequest: CreateGameRequest = {};

// ❌ TypeScript error - wrong type
const badRequest2: CreateGameRequest = {
  characterSetId: 123, // Should be string
};
```

### Refactoring Safety

When you change a type definition:

```typescript
// Before
type QuestionResponse = {
  questionText: string;
};

// After - added new field
type QuestionResponse = {
  questionText: string;
  askedAt: string; // New required field
};
```

TypeScript will show errors everywhere this type is used, ensuring you update both frontend and backend.

### Auto-completion

IDEs provide auto-completion for all fields:

```typescript
const lobby: GameLobbyResponse = await getLobby(roomCode);
lobby. // Auto-complete shows: id, roomCode, status, players, etc.
```

---

## Best Practices

### Naming Conventions

- **Request types**: End with `Request` (e.g., `CreateGameRequest`)
- **Response types**: End with `Response` or `Dto` (e.g., `GameLobbyResponse`)
- **Event types**: End with `Event` (e.g., `SocketPlayerJoinedEvent`)
- **Enums**: Use union types (e.g., `type GameStatus = "lobby" | "in_progress"`)

### Required vs Optional

- Use `?` for optional fields: `turnTimerSeconds?: number`
- Use `| null` when null is explicit: `description: string | null`
- Use `| undefined` when field may not exist: `winnerId?: string`

### Versioning

When making breaking changes:

1. Create new types with version suffix
2. Support both old and new in backend
3. Migrate frontend
4. Remove old types

Example:
```typescript
type CreateGameRequestV2 = {
  // New structure
};
```

## Maintenance

### Adding New Types

1. Add type definition to `index.d.ts`
2. Export the type
3. Use in both frontend and backend
4. Test compilation in both apps

### Modifying Existing Types

1. **Non-breaking changes** (adding optional fields):
   - Add new optional field
   - Update both apps to use it

2. **Breaking changes** (changing required fields):
   - Version the type
   - Support both versions temporarily
   - Migrate code
   - Remove old version

### Removing Types

1. Ensure no code uses the type
2. Remove from `index.d.ts`
3. Verify both apps compile

---

## Future Enhancements

Potential improvements:

- Runtime validation with Zod or similar
- API documentation generation from types
- OpenAPI spec generation
- GraphQL schema generation
- Contract testing
- Type guards for runtime checks
- Branded types for IDs
- Discriminated unions for better type narrowing
