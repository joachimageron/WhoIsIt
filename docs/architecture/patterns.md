# Design Patterns and Conventions

## Overview

WhoIsIt follows established design patterns and coding conventions to ensure maintainability, testability, and scalability. This document outlines the patterns used throughout the codebase and the rationale behind them.

## Backend Patterns (NestJS)

### Module Pattern

**Purpose**: Organize code into cohesive feature modules

**Structure**:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Game, GamePlayer])],
  controllers: [GameController],
  providers: [GameService, GameLobbyService, GamePlayService],
  exports: [GameService],
})
export class GameModule {}
```

**Conventions**:

- One module per feature (AuthModule, GameModule, etc.)
- Import related modules and TypeORM repositories
- Export services that other modules need
- Keep modules focused and cohesive

**Benefits**:

- Clear feature boundaries
- Dependency injection scope
- Lazy loading potential
- Easy to test in isolation

### Controller Pattern

**Purpose**: Handle HTTP requests and delegate to services

**Structure**:

```typescript
@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createGame(@Body() dto: CreateGameDto, @Req() req) {
    return this.gameService.createGame({
      ...dto,
      hostUserId: req.user?.sub,
    });
  }

  @Get(':roomCode')
  async getLobby(@Param('roomCode') roomCode: string) {
    return this.gameService.getLobbyByRoomCode(roomCode);
  }
}
```

**Conventions**:

- Controllers handle HTTP only (no business logic)
- Use DTOs for request validation
- Use guards for authentication
- Return service results directly
- Use proper HTTP status codes

**Benefits**:

- Thin controllers (testable)
- Clear API surface
- Automatic validation
- Swagger documentation generation

### Service Pattern (Business Logic)

**Purpose**: Contain business logic and orchestration

**Structure**:

```typescript
@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    private readonly gameLobbyService: GameLobbyService,
    private readonly gamePlayService: GamePlayService,
  ) {}

  async createGame(request: CreateGameRequest): Promise<GameLobbyResponse> {
    // Delegate to specialized service
    return this.gameLobbyService.createGame(request);
  }

  async startGame(roomCode: string): Promise<GameLobbyResponse> {
    // Business logic here
    const game = await this.gameRepository.findOne({ ... });
    
    if (game.status !== GameStatus.LOBBY) {
      throw new BadRequestException('Game already started');
    }
    
    // Validate and start
    return this.gameLobbyService.startGame(game);
  }
}
```

**Conventions**:

- Services contain business logic
- Inject repositories and other services
- Throw domain exceptions
- Return DTOs (not entities directly)
- Use transactions for multi-step operations

**Service Decomposition Pattern**:

```text
GameService (Orchestrator)
├── GameLobbyService (Lobby management)
├── GamePlayService (Gameplay logic)
├── GameStatsService (Statistics)
└── BroadcastService (WebSocket broadcasting)
```

**Benefits**:

- Single Responsibility Principle
- Easy to test
- Reusable logic
- Clear dependencies

### Repository Pattern (Data Access)

**Purpose**: Abstract database operations

**TypeORM Repositories**:

```typescript
@Injectable()
export class GameLobbyService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private readonly playerRepository: Repository<GamePlayer>,
  ) {}

  async findByRoomCode(roomCode: string): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players', 'characterSet'],
    });
  }
}
```

**Conventions**:

- Use TypeORM Repository for queries
- Define relations in findOne/findMany
- Use QueryBuilder for complex queries
- Avoid N+1 queries (eager load when needed)

**Benefits**:

- Abstracted database operations
- Type-safe queries
- Relationship loading
- Transaction support

### Guard Pattern (Authorization)

**Purpose**: Protect routes with authentication/authorization

**Structure**:

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    // Allow unauthenticated access but attach user if present
    return user;
  }
}
```

**Usage**:

```typescript
@UseGuards(JwtAuthGuard)  // Required auth
@Get('profile')
getProfile(@Req() req) {
  return req.user;
}

@UseGuards(OptionalJwtAuthGuard)  // Optional auth
@Get('public')
getPublic(@Req() req) {
  const userId = req.user?.sub;  // May be undefined
  // ...
}
```

**Conventions**:

- Guards return true/false or throw
- Attach user to request
- Use Passport strategies
- Guards are composable

**Benefits**:

- Declarative security
- Reusable guards
- Request-level user access
- Easy to test

### Gateway Pattern (WebSocket)

**Purpose**: Handle WebSocket connections and events

**Structure**:

```typescript
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_ORIGIN, credentials: true },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: SocketJoinRoomRequest,
    @ConnectedSocket() client: Socket,
  ): Promise<SocketJoinRoomResponse> {
    try {
      const lobby = await this.gameService.joinRoom(data.roomCode, client.user);
      client.join(data.roomCode);
      return { success: true, lobby };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  broadcastToRoom(roomCode: string, event: string, data: any) {
    this.server.to(roomCode).emit(event, data);
  }
}
```

**Conventions**:

- Gateways handle WebSocket only
- Use `@SubscribeMessage` for events
- Return acknowledgement responses
- Use rooms for targeted broadcasting
- Delegate business logic to services

**Custom Auth Adapter Pattern**:

```typescript
export class WsAuthAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    
    server.use(async (socket, next) => {
      // Extract JWT from cookie
      const token = socket.handshake.auth.token || 
                    socket.request.cookies?.access_token;
      
      if (token) {
        // Validate and attach user
        const user = await this.validateToken(token);
        socket.user = user;
      }
      
      next();  // Allow connection even if no auth
    });
    
    return server;
  }
}
```

**Benefits**:

- Real-time communication
- Room-based broadcasting
- Authenticated sockets
- Acknowledgement pattern

### DTO Pattern (Data Transfer Objects)

**Purpose**: Validate and transform request data

**Structure**:

```typescript
export class CreateGameDto {
  @IsUUID()
  characterSetId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  hostUsername?: string;

  @IsOptional()
  @IsEnum(GameVisibility)
  visibility?: GameVisibility;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(10)
  maxPlayers?: number;
}
```

**Conventions**:

- One DTO per request type
- Use class-validator decorators
- Make optional fields explicit
- Transform to domain models in service

**Response DTOs**:

```typescript
export function toGameLobbyResponse(game: Game): GameLobbyResponse {
  return {
    id: game.id,
    roomCode: game.roomCode,
    status: game.status,
    players: game.players.map(toPlayerResponse),
    // ...
  };
}
```

**Benefits**:

- Automatic validation
- Type safety
- Clear API contracts
- Separation from domain models

### Entity Pattern (Database Models)

**Purpose**: Define database schema with TypeORM

**Structure**:

```typescript
@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 6 })
  roomCode: string;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.LOBBY,
  })
  status: GameStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'host_user_id' })
  host?: User;

  @OneToMany(() => GamePlayer, (player) => player.game)
  players: GamePlayer[];

  @ManyToOne(() => CharacterSet)
  @JoinColumn({ name: 'character_set_id' })
  characterSet: CharacterSet;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Conventions**:

- Use `@Entity` with table name
- UUID primary keys
- Explicit column names for foreign keys
- Timestamps (createdAt, updatedAt)
- Define relationships bidirectionally

**Benefits**:

- Type-safe database operations
- Automatic migration generation
- Relationship loading
- Validation at DB level

## Frontend Patterns (Next.js + React)

### Page Component Pattern

**Purpose**: Define routes with file-based routing

**Structure** (`app/[lang]/game/create/page.tsx`):

```typescript
import { Metadata } from 'next';
import CreateGameClient from './create-game-client';

export const metadata: Metadata = {
  title: 'Create Game | WhoIsIt',
  description: 'Create a new WhoIsIt game',
};

export default function CreateGamePage() {
  return <CreateGameClient />;
}
```

**Conventions**:

- Server Components by default
- Export metadata for SEO
- Delegate to Client Components for interactivity
- Use `[param]` for dynamic routes
- Use `[lang]` for i18n

**Benefits**:

- Automatic routing
- Server-side rendering
- Type-safe navigation
- SEO-friendly

### Client Component Pattern

**Purpose**: Interactive components with state

**Structure**:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';

export default function CreateGameClient() {
  const [characterSets, setCharacterSets] = useState([]);
  const { createGame, isLoading } = useGameStore();

  useEffect(() => {
    // Fetch data
    fetchCharacterSets().then(setCharacterSets);
  }, []);

  const handleSubmit = async (data) => {
    await createGame(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

**Conventions**:

- Use `'use client'` directive
- Hooks for state and effects
- Event handlers for interactions
- Connect to stores for global state
- HeroUI components for UI

**Benefits**:

- Client-side interactivity
- React hooks
- Real-time updates
- Responsive UI

### Custom Hook Pattern

**Purpose**: Reusable stateful logic

**Structure** (`hooks/use-game-socket.ts`):

```typescript
import { useEffect, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';

export const useGameSocket = () => {
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }
    return () => {
      disconnectSocket();
    };
  }, []);

  const joinRoom = useCallback((data) => {
    return new Promise((resolve) => {
      socketRef.current.emit('joinRoom', data, resolve);
    });
  }, []);

  const onLobbyUpdate = useCallback((callback) => {
    socketRef.current.on('lobbyUpdate', callback);
    return () => {
      socketRef.current.off('lobbyUpdate', callback);
    };
  }, []);

  return { joinRoom, onLobbyUpdate };
};
```

**Conventions**:

- Prefix with `use`
- Return object with methods/values
- Use `useCallback` for functions
- Use `useEffect` for side effects
- Return cleanup functions

**Benefits**:

- Reusable logic
- Testable
- Type-safe
- Composable

### Store Pattern (Zustand)

**Purpose**: Global state management

**Structure** (`store/game-store.ts`):

```typescript
import { create } from 'zustand';

interface GameStore {
  roomCode: string | null;
  isConnected: boolean;
  players: GamePlayerResponse[];
  
  setRoomCode: (code: string) => void;
  setConnected: (connected: boolean) => void;
  updatePlayers: (players: GamePlayerResponse[]) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  roomCode: null,
  isConnected: false,
  players: [],
  
  setRoomCode: (code) => set({ roomCode: code }),
  setConnected: (connected) => set({ isConnected: connected }),
  updatePlayers: (players) => set({ players }),
  reset: () => set({ 
    roomCode: null, 
    isConnected: false, 
    players: [] 
  }),
}));
```

**Conventions**:

- Define interface for type safety
- Separate state from actions
- Use descriptive action names
- Include reset action
- Keep stores focused

**Benefits**:

- Global state
- No providers needed
- TypeScript support
- DevTools integration

### API Client Pattern

**Purpose**: Centralized API communication

**Structure** (`lib/game-api.ts`):

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createGame(data: CreateGameRequest) {
  const response = await fetch(`${API_URL}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create game');
  }
  
  return response.json();
}

export async function joinGame(roomCode: string, data: JoinGameRequest) {
  const response = await fetch(`${API_URL}/games/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to join game');
  }
  
  return response.json();
}
```

**Conventions**:

- One file per API domain
- Export async functions
- Use fetch with credentials
- Throw on errors
- Type request/response

**Benefits**:

- Centralized API logic
- Easy to mock for testing
- Consistent error handling
- Type-safe API calls

### Component Composition Pattern

**Purpose**: Build complex UIs from simple components

**Structure**:

```typescript
export default function GameLobby({ roomCode }) {
  return (
    <Card>
      <CardHeader>
        <RoomCodeDisplay code={roomCode} />
      </CardHeader>
      <CardBody>
        <PlayerList players={players} />
        <GameSettings settings={settings} />
      </CardBody>
      <CardFooter>
        <StartGameButton onStart={handleStart} />
      </CardFooter>
    </Card>
  );
}
```

**Conventions**:

- Small, focused components
- Props for configuration
- Composition over inheritance
- HeroUI components as building blocks

**Benefits**:

- Reusable components
- Easy to test
- Clear component hierarchy
- Maintainable

## Shared Patterns

### Contract-First Design

**Purpose**: Define types before implementation

**Process**:

1. Define types in `packages/contracts`
2. Implement backend controller/service
3. Implement frontend API client
4. Both sides use same types

**Example** (`packages/contracts/index.d.ts`):

```typescript
export type CreateGameRequest = {
  characterSetId: string;
  hostUsername?: string;
  visibility?: GameVisibility;
  maxPlayers?: number;
};

export type GameLobbyResponse = {
  id: string;
  roomCode: string;
  status: GameStatus;
  players: GamePlayerResponse[];
};
```

**Benefits**:

- Type safety
- Clear API contracts
- Refactoring safety
- Self-documenting

### Error Handling Pattern

**Backend**:

```typescript
// Throw domain exceptions
if (!game) {
  throw new NotFoundException('Game not found');
}

if (game.status !== GameStatus.LOBBY) {
  throw new BadRequestException('Game already started');
}
```

**Frontend**:

```typescript
// Try-catch with user feedback
try {
  await createGame(data);
  router.push(`/game/lobby/${roomCode}`);
} catch (error) {
  toast.error('Failed to create game');
  console.error(error);
}
```

**WebSocket**:

```typescript
// Acknowledgement with success flag
return {
  success: true,
  lobby: gameData,
};

// Or error
return {
  success: false,
  error: 'Room not found',
};
```

### Validation Pattern

**Backend Validation**:

```typescript
@Post()
async create(@Body() dto: CreateGameDto) {
  // DTO automatically validated by class-validator
  return this.service.create(dto);
}
```

**Frontend Validation**:

```typescript
const handleSubmit = async (data: FormData) => {
  // Client-side validation
  if (!data.characterSetId) {
    setError('Please select a character set');
    return;
  }
  
  // Submit
  await createGame(data);
};
```

### Normalization Pattern

**Room Code Normalization**:

```typescript
// Backend
function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

// Always normalize before queries
const game = await this.gameRepository.findOne({
  where: { roomCode: normalizeRoomCode(roomCode) },
});
```

**Benefits**:

- Consistent data
- Case-insensitive lookups
- Prevent duplicate rooms

## Coding Conventions

### Naming Conventions

**TypeScript/JavaScript**:

- `camelCase` for variables and functions
- `PascalCase` for classes and components
- `UPPER_CASE` for constants
- Descriptive names (no abbreviations)

**Files**:

- `kebab-case.ts` for files
- `PascalCase.tsx` for React components
- `.service.ts`, `.controller.ts` suffixes

**Database**:

- `snake_case` for table and column names
- Plural table names (`users`, `games`)
- Singular entity names (`User`, `Game`)

### Code Organization

**Import Order**:

1. External packages
2. Workspace packages
3. Internal modules
4. Types
5. Styles

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { CreateGameRequest } from '@whois-it/contracts';

import { Game } from '@/database/entities';
import { GameLobbyService } from './game-lobby.service';

import type { GameStatus } from './types';
```

**File Organization**:

- Related files in same directory
- Index files for clean imports
- Separate concerns (logic vs UI)

### Comment Conventions

**When to Comment**:

- Complex business logic
- Non-obvious algorithms
- Public API methods
- Workarounds or hacks

**When NOT to Comment**:

- Obvious code
- Self-explanatory function names
- TypeScript types (self-documenting)

**JSDoc for Public APIs**:

```typescript
/**
 * Creates a new game lobby
 * @param request - Game creation parameters
 * @returns Created game lobby data
 * @throws {BadRequestException} If character set not found
 */
async createGame(request: CreateGameRequest): Promise<GameLobbyResponse> {
  // Implementation
}
```

### TypeScript Conventions

**Use Explicit Types**:

```typescript
// ✅ Good
function getUser(id: string): Promise<User | null> {
  return this.userRepository.findOne(id);
}

// ❌ Avoid
function getUser(id) {
  return this.userRepository.findOne(id);
}
```

**Prefer Interfaces for Objects**:

```typescript
interface GameState {
  roomCode: string;
  players: Player[];
  status: GameStatus;
}
```

**Use Type for Unions/Primitives**:

```typescript
type GameStatus = 'lobby' | 'in_progress' | 'completed';
type UserId = string;
```

## Testing Patterns

### Unit Test Pattern

**Structure**:

```typescript
describe('GameService', () => {
  let service: GameService;
  let repository: Repository<Game>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: getRepositoryToken(Game),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    repository = module.get(getRepositoryToken(Game));
  });

  it('should create a game', async () => {
    const request = { characterSetId: '123' };
    const expected = { id: '1', roomCode: 'ABC123' };
    
    jest.spyOn(repository, 'save').mockResolvedValue(expected);
    
    const result = await service.createGame(request);
    
    expect(result.roomCode).toBe('ABC123');
  });
});
```

**Conventions**:

- One test file per source file
- Describe blocks for grouping
- BeforeEach for setup
- Mock dependencies
- Descriptive test names

## Conclusion

WhoIsIt follows industry-standard design patterns and conventions:

- **Backend**: NestJS patterns (modules, controllers, services, guards)
- **Frontend**: React patterns (components, hooks, stores)
- **Shared**: Contract-first design with TypeScript
- **Architecture**: Separation of concerns throughout

These patterns ensure the codebase remains maintainable, testable, and scalable as the project grows.

---

**Related Documentation**:

- [System Architecture Overview](./overview.md)
- [Technology Stack](./tech-stack.md)
- [Backend Documentation](../backend/README.md)
- [Frontend Documentation](../frontend/README.md)
