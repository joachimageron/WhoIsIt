# Shared Types Documentation

## Overview

The `@whois-it/contracts` package contains **shared TypeScript types** used by both frontend and backend. This ensures type safety across the entire stack and prevents API contract mismatches.

## Package Structure

```
packages/contracts/
├── package.json
└── index.d.ts       # All shared types
```

## Why Shared Types?

### Benefits

- ✅ **Type Safety**: Compiler catches API mismatches
- ✅ **Single Source of Truth**: One definition for both ends
- ✅ **Refactoring Safety**: Changes propagate automatically
- ✅ **Documentation**: Types serve as API documentation
- ✅ **IntelliSense**: Auto-completion in IDEs

### Example

```typescript
// Backend
import { GameLobbyResponse } from '@whois-it/contracts';

@Get(':roomCode')
async getLobby(@Param('roomCode') roomCode: string): Promise<GameLobbyResponse> {
  return this.gameService.getLobby(roomCode);
}

// Frontend
import { GameLobbyResponse } from '@whois-it/contracts';

const [lobby, setLobby] = useState<GameLobbyResponse | null>(null);

useEffect(() => {
  fetch(`${API_URL}/games/${roomCode}`)
    .then(res => res.json())
    .then((data: GameLobbyResponse) => setLobby(data));
}, [roomCode]);
```

## Core Types

### Game Types

**GameStatus**:
```typescript
type GameStatus = 'lobby' | 'in_progress' | 'completed' | 'aborted';
```

**GameVisibility**:
```typescript
type GameVisibility = 'public' | 'private';
```

**GamePlayerRole**:
```typescript
type GamePlayerRole = 'host' | 'player' | 'spectator';
```

### Request DTOs

**CreateGameRequest**:
```typescript
type CreateGameRequest = {
  characterSetId: string;
  hostUsername?: string;
  hostUserId?: string;
  visibility?: GameVisibility;
  turnTimerSeconds?: number | null;
  ruleConfig?: Record<string, unknown>;
};
```

**JoinGameRequest**:
```typescript
type JoinGameRequest = {
  username?: string;
  userId?: string;
  avatarUrl?: string;
};
```

### Response DTOs

**GamePlayerResponse**:
```typescript
type GamePlayerResponse = {
  id: string;
  username: string;
  avatarUrl?: string;
  role: GamePlayerRole;
  isReady: boolean;
  joinedAt: string;
  leftAt?: string;
  userId?: string;
};
```

**GameLobbyResponse**:
```typescript
type GameLobbyResponse = {
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
};
```

## Socket.IO Types

### Client → Server Events

**SocketJoinRoomRequest**:
```typescript
type SocketJoinRoomRequest = {
  roomCode: string;
  playerId?: string;
};
```

**SocketJoinRoomResponse**:
```typescript
type SocketJoinRoomResponse = {
  success: boolean;
  lobby?: GameLobbyResponse;
  error?: string;
};
```

**SocketLeaveRoomRequest**:
```typescript
type SocketLeaveRoomRequest = {
  roomCode: string;
  playerId?: string;
};
```

**SocketUpdatePlayerReadyRequest**:
```typescript
type SocketUpdatePlayerReadyRequest = {
  roomCode: string;
  playerId: string;
  isReady: boolean;
};
```

### Server → Client Events

**SocketPlayerJoinedEvent**:
```typescript
type SocketPlayerJoinedEvent = {
  roomCode: string;
  lobby: GameLobbyResponse;
};
```

**SocketPlayerLeftEvent**:
```typescript
type SocketPlayerLeftEvent = {
  roomCode: string;
  lobby: GameLobbyResponse;
};
```

**SocketGameStartedEvent**:
```typescript
type SocketGameStartedEvent = {
  roomCode: string;
  lobby: GameLobbyResponse;
};
```

### Typed Socket.IO Interfaces

**ServerToClientEvents**:
```typescript
interface ServerToClientEvents {
  lobbyUpdate: (lobby: GameLobbyResponse) => void;
  playerJoined: (event: SocketPlayerJoinedEvent) => void;
  playerLeft: (event: SocketPlayerLeftEvent) => void;
  gameStarted: (event: SocketGameStartedEvent) => void;
  questionAsked: (event: SocketQuestionAskedEvent) => void;
  answerSubmitted: (event: SocketAnswerSubmittedEvent) => void;
  guessResult: (event: SocketGuessResultEvent) => void;
  gameOver: (event: SocketGameOverEvent) => void;
}
```

**ClientToServerEvents**:
```typescript
interface ClientToServerEvents {
  joinRoom: (
    data: SocketJoinRoomRequest,
    callback: (response: SocketJoinRoomResponse) => void
  ) => void;
  leaveRoom: (
    data: SocketLeaveRoomRequest,
    callback: (response: SocketLeaveRoomResponse) => void
  ) => void;
  updatePlayerReady: (
    data: SocketUpdatePlayerReadyRequest,
    callback: (response: SocketUpdatePlayerReadyResponse) => void
  ) => void;
}
```

## Character Types

**CharacterResponseDto**:
```typescript
type CharacterResponseDto = {
  id: string;
  name: string;
  imageUrl?: string;
  attributes: Record<string, unknown>;
};
```

**CharacterSetResponseDto**:
```typescript
type CharacterSetResponseDto = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isPublic: boolean;
  createdByUserId?: string;
  characters: CharacterResponseDto[];
};
```

## Authentication Types

**AuthResponseDto**:
```typescript
type AuthResponseDto = {
  user: UserResponseDto;
};

type UserResponseDto = {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
};
```

**RegisterDto**:
```typescript
type RegisterDto = {
  email: string;
  username: string;
  password: string;
  avatarUrl?: string;
};
```

**LoginDto**:
```typescript
type LoginDto = {
  email: string;
  password: string;
};
```

## Usage Patterns

### Backend Controller

```typescript
import { CreateGameRequest, GameLobbyResponse } from '@whois-it/contracts';

@Controller('games')
export class GameController {
  @Post()
  async createGame(
    @Body() dto: CreateGameRequest
  ): Promise<GameLobbyResponse> {
    return this.gameService.createGame(dto);
  }

  @Get(':roomCode')
  async getLobby(
    @Param('roomCode') roomCode: string
  ): Promise<GameLobbyResponse> {
    return this.gameService.getLobby(roomCode);
  }
}
```

### Backend Service

```typescript
import { GameLobbyResponse, GamePlayerResponse } from '@whois-it/contracts';

@Injectable()
export class GameService {
  async createGame(dto: CreateGameRequest): Promise<GameLobbyResponse> {
    const game = await this.gameRepository.save({
      characterSetId: dto.characterSetId,
      // ...
    });

    return this.mapToLobbyResponse(game);
  }

  private mapToLobbyResponse(game: Game): GameLobbyResponse {
    return {
      id: game.id,
      roomCode: game.roomCode,
      status: game.status,
      // ...
    };
  }
}
```

### Frontend API Calls

```typescript
import { CreateGameRequest, GameLobbyResponse } from '@whois-it/contracts';

async function createGame(
  data: CreateGameRequest
): Promise<GameLobbyResponse> {
  const response = await fetch(`${API_URL}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return response.json();
}
```

### Frontend State

```typescript
import { GameLobbyResponse } from '@whois-it/contracts';

interface GameState {
  lobby: GameLobbyResponse | null;
  setLobby: (lobby: GameLobbyResponse | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  lobby: null,
  setLobby: (lobby) => set({ lobby }),
}));
```

### WebSocket Events

```typescript
import { SocketJoinRoomRequest, SocketJoinRoomResponse } from '@whois-it/contracts';

// Backend
@SubscribeMessage('joinRoom')
async handleJoinRoom(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: SocketJoinRoomRequest
): Promise<SocketJoinRoomResponse> {
  // ...
  return { success: true, lobby };
}

// Frontend
const joinRoom = (data: SocketJoinRoomRequest): Promise<SocketJoinRoomResponse> => {
  return new Promise((resolve) => {
    socket.emit('joinRoom', data, resolve);
  });
};
```

## Adding New Types

### Process

1. **Define in contracts**:
```typescript
// packages/contracts/index.d.ts
export type NewFeatureRequest = {
  field1: string;
  field2: number;
};

export type NewFeatureResponse = {
  id: string;
  result: string;
};
```

2. **Use in backend**:
```typescript
import { NewFeatureRequest, NewFeatureResponse } from '@whois-it/contracts';

@Post('feature')
async newFeature(@Body() dto: NewFeatureRequest): Promise<NewFeatureResponse> {
  // Implementation
}
```

3. **Use in frontend**:
```typescript
import { NewFeatureRequest, NewFeatureResponse } from '@whois-it/contracts';

async function callNewFeature(data: NewFeatureRequest): Promise<NewFeatureResponse> {
  // API call
}
```

## Type Conventions

### Naming

- **Requests**: `*Request` (e.g., `CreateGameRequest`)
- **Responses**: `*Response` (e.g., `GameLobbyResponse`)
- **DTOs**: `*Dto` (e.g., `CharacterResponseDto`)
- **Events**: `Socket*Event` (e.g., `SocketPlayerJoinedEvent`)
- **Enums**: PascalCase (e.g., `GameStatus`)

### Optional Fields

Use `?` for optional fields:
```typescript
type MyType = {
  required: string;
  optional?: string;
  nullable: string | null;
};
```

### Dates

Use ISO string format for dates:
```typescript
type MyType = {
  createdAt: string;  // ISO 8601 string
  updatedAt: string;
};
```

## Best Practices

### 1. Keep Contracts Minimal

Only shared types, not implementation details:
```typescript
// ✅ Good - API contract
export type CreateGameRequest = {
  characterSetId: string;
};

// ❌ Bad - Implementation detail
export type GameRepositoryOptions = {
  include: string[];
  cache: boolean;
};
```

### 2. Use Semantic Names

```typescript
// ✅ Good - Clear purpose
export type GameLobbyResponse = { ... };

// ❌ Bad - Generic name
export type GameData = { ... };
```

### 3. Document Complex Types

```typescript
/**
 * Represents a player in a game lobby
 */
export type GamePlayerResponse = {
  /** Unique player identifier */
  id: string;
  
  /** Display name */
  username: string;
  
  /** Whether player is ready to start */
  isReady: boolean;
};
```

### 4. Avoid Circular Dependencies

```typescript
// ❌ Bad - Circular
export type Game = {
  players: Player[];
};

export type Player = {
  game: Game;  // Circular!
};

// ✅ Good - Use IDs
export type Game = {
  id: string;
  players: Player[];
};

export type Player = {
  id: string;
  gameId: string;  // Reference by ID
};
```

## Related Documentation

- [REST API Reference](./rest-api.md)
- [Socket.IO Events](./socket-events.md)
- [Backend Documentation](../backend/README.md)
- [Frontend Documentation](../frontend/README.md)

---

**Last Updated**: November 2024
