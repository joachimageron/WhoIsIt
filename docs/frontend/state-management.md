# State Management with Zustand

## Overview

WhoIsIt uses **Zustand** for global state management. Zustand is a lightweight, unopinionated state management library that provides a simple API without the boilerplate of Redux.

**✨ State Persistence**: Both stores use Zustand's persist middleware to save state to localStorage, ensuring user sessions and gameplay choices survive page reloads. See [Middleware → Persist Middleware](#persist-middleware) for implementation details.

## Why Zustand?

### Advantages

- ✅ **Minimal boilerplate** - No providers, actions, or reducers required
- ✅ **TypeScript-friendly** - Excellent type inference
- ✅ **React hooks-based** - Natural integration with React
- ✅ **Lightweight** - ~1KB gzipped
- ✅ **No context wrapping** - Direct store access
- ✅ **Devtools support** - Redux DevTools integration
- ✅ **Middleware** - Persist, immer, devtools
- ✅ **SSR compatible** - Works with Next.js server-side rendering

### Comparison to Alternatives

**vs Redux**:

- Less boilerplate
- No need for actions/reducers
- Simpler learning curve
- Similar performance

**vs Context API**:

- Better performance (no unnecessary re-renders)
- Cleaner syntax
- Built-in selectors

**vs Jotai/Recoil**:

- Simpler mental model
- Less atomic
- More centralized

## Store Architecture

### Store Files

```docs
store/
├── game-store.ts                        # Game state (lobby, gameplay)
├── auth-store.ts                        # Authentication state
└── __tests__/
    ├── game-store.test.ts               # Game store unit tests
    ├── game-store-persistence.test.ts   # Game store persistence tests
    ├── auth-store.test.ts               # Auth store unit tests
    └── auth-store-persistence.test.ts   # Auth store persistence tests
```

### Persistence Strategy

**Synchronous Persistence (localStorage):**

- ✅ Fast, immediate writes
- ✅ Works offline
- ✅ Simple implementation
- ✅ Suitable for small state sizes
- ✅ Guest sessions already use localStorage

**What's persisted:**

- **Auth Store**: User profile, authentication status
- **Game Store**: Player choices (eliminated/flipped characters)

**What's NOT persisted:**

- Real-time server state (lobby, game state, characters)
- Connection states (socket status)
- Transient UI state (loading, errors)

## Game Store

### State Structure

```typescript
interface GameState {
  // Lobby state
  lobby: GameLobbyResponse | null;
  isConnected: boolean;
  
  // Gameplay state
  playState: GamePlayState | null;
  
  // Actions
  setLobby: (lobby: GameLobbyResponse | null) => void;
  setConnected: (connected: boolean) => void;
  setGameState: (gameState: GameStateResponse | null) => void;
  setCharacters: (characters: CharacterResponseDto[]) => void;
  setMyCharacter: (myCharacter: PlayerCharacterResponse | null) => void;
  addQuestion: (question: QuestionResponse) => void;
  addAnswer: (answer: AnswerResponse) => void;
  eliminateCharacter: (characterId: string) => void;
  toggleFlipCharacter: (characterId: string) => void;
  resetPlayState: () => void;
  reset: () => void;
}

interface GamePlayState {
  gameState: GameStateResponse | null;
  characters: CharacterResponseDto[];
  questions: QuestionResponse[];
  answers: Map<string, AnswerResponse>;
  eliminatedCharacterIds: Set<string>;
  flippedCharacterIds: Set<string>;
  myCharacter: PlayerCharacterResponse | null;
}
```

### Implementation

```typescript
import { create } from 'zustand';

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  lobby: null,
  isConnected: false,
  playState: null,
  
  // Lobby actions
  setLobby: (lobby) => set({ lobby }),
  setConnected: (isConnected) => set({ isConnected }),
  
  // Gameplay actions
  setGameState: (gameState) =>
    set((state) => ({
      playState: state.playState
        ? { ...state.playState, gameState }
        : {
            gameState,
            characters: [],
            questions: [],
            answers: new Map(),
            eliminatedCharacterIds: new Set(),
            flippedCharacterIds: new Set(),
            myCharacter: null,
          },
    })),
  
  addQuestion: (question) =>
    set((state) => ({
      playState: state.playState
        ? {
            ...state.playState,
            questions: [...state.playState.questions, question],
          }
        : null,
    })),
  
  addAnswer: (answer) =>
    set((state) => {
      if (!state.playState) return state;
      const newAnswers = new Map(state.playState.answers);
      newAnswers.set(answer.questionId, answer);
      return {
        playState: { ...state.playState, answers: newAnswers },
      };
    }),
  
  eliminateCharacter: (characterId) =>
    set((state) => {
      if (!state.playState) return state;
      const newSet = new Set(state.playState.eliminatedCharacterIds);
      newSet.add(characterId);
      return {
        playState: { ...state.playState, eliminatedCharacterIds: newSet },
      };
    }),
  
  toggleFlipCharacter: (characterId) =>
    set((state) => {
      if (!state.playState) return state;
      const newSet = new Set(state.playState.flippedCharacterIds);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return {
        playState: { ...state.playState, flippedCharacterIds: newSet },
      };
    }),
  
  // Reset actions
  resetPlayState: () => set({ playState: null }),
  reset: () => set({ lobby: null, isConnected: false, playState: null }),
}));
```

### Usage

**Basic Selection**:

```tsx
'use client';
import { useGameStore } from '@/store/game-store';

export function LobbyDisplay() {
  const lobby = useGameStore((state) => state.lobby);
  const isConnected = useGameStore((state) => state.isConnected);
  
  return (
    <div>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      <h1>{lobby?.roomCode}</h1>
    </div>
  );
}
```

**Selecting Multiple Values**:

```tsx
const { lobby, setLobby, isConnected } = useGameStore((state) => ({
  lobby: state.lobby,
  setLobby: state.setLobby,
  isConnected: state.isConnected,
}));
```

**Calling Actions**:

```tsx
const setLobby = useGameStore((state) => state.setLobby);

// In event handler
const handleLobbyUpdate = (newLobby: GameLobbyResponse) => {
  setLobby(newLobby);
};
```

**Accessing Outside Components**:

```tsx
import { useGameStore } from '@/store/game-store';

// Direct access (no hook)
const currentLobby = useGameStore.getState().lobby;

// Subscribe to changes
const unsubscribe = useGameStore.subscribe((state) => {
  console.log('Lobby changed:', state.lobby);
});
```

## Auth Store

### State Structure >

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}
```

### Implementation >

```typescript
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
```

### Usage >

```tsx
'use client';
import { useAuthStore } from '@/store/auth-store';

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  if (!user) {
    return <Link href="/auth/login">Login</Link>;
  }
  
  return (
    <div>
      <Avatar src={user.avatarUrl} />
      <span>{user.username}</span>
      <Button onClick={logout}>Logout</Button>
    </div>
  );
}
```

## Selectors

### Custom Selectors

Create reusable selectors:

```typescript
// store/game-store.ts
export const selectLobbyPlayers = (state: GameState) => 
  state.lobby?.players ?? [];

export const selectIsHost = (state: GameState, userId?: string) =>
  state.lobby?.hostUserId === userId;

export const selectAllPlayersReady = (state: GameState) =>
  state.lobby?.players.every((p) => p.isReady) ?? false;

// Usage
const players = useGameStore(selectLobbyPlayers);
const isHost = useGameStore((state) => selectIsHost(state, user?.id));
const allReady = useGameStore(selectAllPlayersReady);
```

### Derived State

Compute values from state:

```typescript
export function CharacterGrid() {
  const characters = useGameStore((state) => state.playState?.characters ?? []);
  const eliminated = useGameStore((state) => state.playState?.eliminatedCharacterIds ?? new Set());
  const flipped = useGameStore((state) => state.playState?.flippedCharacterIds ?? new Set());
  
  // Derived state
  const activeCharacters = characters.filter(
    (c) => !eliminated.has(c.id) && !flipped.has(c.id)
  );
  
  return (
    <div className="grid grid-cols-6 gap-2">
      {activeCharacters.map((character) => (
        <CharacterCard key={character.id} character={character} />
      ))}
    </div>
  );
}
```

## Performance Optimization

### Shallow Comparison

Prevent unnecessary re-renders:

```typescript
import { shallow } from 'zustand/shallow';

const { lobby, players } = useGameStore(
  (state) => ({
    lobby: state.lobby,
    players: state.lobby?.players ?? [],
  }),
  shallow // Only re-render if values change (shallow comparison)
);
```

### Selector Memoization

Use selectors to avoid re-renders:

```tsx
// ❌ Bad - Re-renders on ANY state change
const store = useGameStore();

// ✅ Good - Only re-renders when lobby changes
const lobby = useGameStore((state) => state.lobby);

// ✅ Better - Only re-renders when room code changes
const roomCode = useGameStore((state) => state.lobby?.roomCode);
```

### Split Stores

Separate concerns to reduce re-renders:

```typescript
// ❌ Bad - One giant store
interface AppState {
  user: User;
  lobby: Lobby;
  theme: Theme;
  settings: Settings;
}

// ✅ Good - Multiple focused stores
useAuthStore();   // User state
useGameStore();   // Game state
useThemeStore();  // UI theme
```

## Middleware

### Persist Middleware

**WhoIsIt uses persist middleware to maintain state across page reloads.** Both stores are configured with persistence:

#### Auth Store Persistence

The auth store persists user authentication state to maintain login sessions:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      error: null,
      setUser: (user) => set({ 
        user,
        isAuthenticated: !!user && !user.isGuest,
        isGuest: !!user?.isGuest,
      }),
      // ... other actions
    }),
    {
      name: 'whoisit-auth-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        // Don't persist loading and error states
      }),
    }
  )
);
```

**What's persisted:**

- ✅ `user` - User profile data
- ✅ `isAuthenticated` - Authentication status
- ✅ `isGuest` - Guest user flag
- ❌ `isLoading` - Transient loading state
- ❌ `error` - Transient error messages

#### Game Store Persistence

The game store selectively persists only player choices, not real-time game state:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Type for serialized state (arrays instead of Sets for JSON)
type SerializedGamePlayState = {
  gameState: null;
  characters: [];
  questions: [];
  answers: [];
  eliminatedCharacterIds: string[];
  flippedCharacterIds: string[];
  myCharacter: null;
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      lobby: null,
      isConnected: false,
      playState: null,
      // ... actions
    }),
    {
      name: 'whoisit-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state): { playState: SerializedGamePlayState | null } => {
        if (!state.playState) {
          return { playState: null };
        }

        // Convert Sets to arrays for JSON serialization
        return {
          playState: {
            gameState: null,
            characters: [],
            questions: [],
            answers: [],
            eliminatedCharacterIds: Array.from(
              state.playState.eliminatedCharacterIds
            ),
            flippedCharacterIds: Array.from(
              state.playState.flippedCharacterIds
            ),
            myCharacter: null,
          },
        };
      },
      merge: (persistedState, currentState) => {
        // Custom merge to restore arrays as Sets
        const persisted = persistedState as {
          playState: SerializedGamePlayState | null;
        };

        if (!persisted.playState) {
          return currentState;
        }

        return {
          ...currentState,
          playState: {
            gameState: null,
            characters: [],
            questions: [],
            answers: new Map(),
            eliminatedCharacterIds: new Set(
              persisted.playState.eliminatedCharacterIds
            ),
            flippedCharacterIds: new Set(
              persisted.playState.flippedCharacterIds
            ),
            myCharacter: null,
          },
        };
      },
    }
  )
);
```

**What's persisted:**

- ✅ `eliminatedCharacterIds` - Characters player marked as eliminated
- ✅ `flippedCharacterIds` - Characters player manually flipped down
- ❌ `lobby` - Real-time lobby state (comes from server)
- ❌ `isConnected` - Socket connection state
- ❌ `gameState` - Server-managed game state
- ❌ `characters` - Character data (comes from server)
- ❌ `questions` - Question history (comes from server)
- ❌ `answers` - Answer history (comes from server)
- ❌ `myCharacter` - Assigned character (comes from server)

**Why selective persistence?**

- Player choices should persist across page reloads during a game
- Server state should always be fetched fresh to stay synchronized
- Connection state is transient and should not be persisted
- Reduces localStorage size and prevents stale data issues

#### Handling Map and Set Serialization

Since `Map` and `Set` cannot be directly serialized to JSON, we use custom `partialize` and `merge` functions:

1. **partialize**: Converts Sets to arrays before storing
2. **merge**: Converts arrays back to Sets when hydrating

```typescript
// Example: Converting Set to Array
eliminatedCharacterIds: Array.from(state.playState.eliminatedCharacterIds)

// Example: Converting Array back to Set
eliminatedCharacterIds: new Set(persisted.playState.eliminatedCharacterIds)
```

### DevTools Middleware

Debug state changes:

```typescript
import { devtools } from 'zustand/middleware';

export const useGameStore = create<GameState>()(
  devtools(
    (set) => ({
      lobby: null,
      setLobby: (lobby) => set({ lobby }, false, 'setLobby'),
    }),
    { name: 'GameStore' }
  )
);
```

### Immer Middleware

Simpler state updates:

```typescript
import { immer } from 'zustand/middleware/immer';

export const useGameStore = create<GameState>()(
  immer((set) => ({
    playState: null,
    addQuestion: (question) =>
      set((state) => {
        // Direct mutation with Immer
        state.playState?.questions.push(question);
      }),
  }))
);
```

### Combining Middleware

You can combine multiple middleware:

```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        setUser: (user) => set({ user }),
      }),
      {
        name: 'auth-storage',
      }
    ),
    { name: 'AuthStore' }
  )
);
```

## Testing

### Testing Stores

```typescript
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '@/store/game-store';

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.setState({ lobby: null, isConnected: false });
  });

  it('should set lobby', () => {
    const { result } = renderHook(() => useGameStore());
    
    act(() => {
      result.current.setLobby({
        roomCode: 'ABC123',
        players: [],
      });
    });
    
    expect(result.current.lobby?.roomCode).toBe('ABC123');
  });
  
  it('should add question', () => {
    const { result } = renderHook(() => useGameStore());
    
    act(() => {
      result.current.addQuestion({
        id: '1',
        questionText: 'Test?',
      });
    });
    
    expect(result.current.playState?.questions).toHaveLength(1);
  });
});
```

### Mocking Stores

```typescript
import { useGameStore } from '@/store/game-store';

jest.mock('@/store/game-store');

const mockUseGameStore = useGameStore as jest.MockedFunction<typeof useGameStore>;

describe('LobbyDisplay', () => {
  it('should display room code', () => {
    mockUseGameStore.mockReturnValue({
      lobby: { roomCode: 'ABC123', players: [] },
      isConnected: true,
      // ... other store values
    });
    
    const { getByText } = render(<LobbyDisplay />);
    expect(getByText('ABC123')).toBeInTheDocument();
  });
});
```

## Best Practices

### 1. Keep State Minimal

Only store what's needed:

```typescript
// ❌ Bad - Storing derived state
interface State {
  characters: Character[];
  eliminatedCharacters: Character[]; // Can be derived
}

// ✅ Good - Store only necessary data
interface State {
  characters: Character[];
  eliminatedCharacterIds: Set<string>; // Derive list when needed
}
```

### 2. Use Selectors

Extract common selections:

```typescript
// selectors.ts
export const selectActivePlayers = (state: GameState) =>
  state.lobby?.players.filter((p) => !p.leftAt) ?? [];

// Usage
const activePlayers = useGameStore(selectActivePlayers);
```

### 3. Actions Over Direct Mutations

Encapsulate state changes:

```typescript
// ❌ Bad
useGameStore.setState({ lobby: newLobby });

// ✅ Good
setLobby(newLobby);
```

### 4. Type Everything

Strong typing prevents bugs:

```typescript
interface GameState {
  lobby: GameLobbyResponse | null;
  setLobby: (lobby: GameLobbyResponse | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  // TypeScript ensures correct types
}));
```

### 5. Reset State Appropriately

Clean up when needed:

```tsx
useEffect(() => {
  return () => {
    resetPlayState(); // Clean up on unmount
  };
}, [resetPlayState]);
```

### 6. Avoid Storing Complex Objects

Keep state serializable:

```typescript
// ❌ Bad - Non-serializable
interface State {
  socket: Socket; // Can't be serialized
}

// ✅ Good - Store connection state
interface State {
  isConnected: boolean;
}
```

## Common Patterns

### Loading States

```typescript
interface State {
  isLoading: boolean;
  error: string | null;
  data: Data | null;
  
  fetchData: () => Promise<void>;
}

fetchData: async () => {
  set({ isLoading: true, error: null });
  try {
    const data = await api.getData();
    set({ data, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
}
```

### Optimistic Updates

```typescript
addPlayer: async (player: Player) => {
  // Optimistic update
  set((state) => ({
    lobby: {
      ...state.lobby,
      players: [...state.lobby.players, player],
    },
  }));
  
  try {
    await api.addPlayer(player);
  } catch (error) {
    // Revert on error
    set((state) => ({
      lobby: {
        ...state.lobby,
        players: state.lobby.players.filter((p) => p.id !== player.id),
      },
    }));
  }
}
```

### Undo/Redo

```typescript
interface State {
  history: GameState[];
  currentIndex: number;
  
  undo: () => void;
  redo: () => void;
}

undo: () =>
  set((state) => {
    if (state.currentIndex > 0) {
      return {
        ...state.history[state.currentIndex - 1],
        currentIndex: state.currentIndex - 1,
      };
    }
    return state;
  }),
```

## Related Documentation

- [Application Structure](./application-structure.md)
- [Real-time Communication](./realtime.md)
- [UI Components](./ui-components.md)

---

**Last Updated**: November 2024
