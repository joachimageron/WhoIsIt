# State Management (store)

This directory contains Zustand stores for global state management in the WhoIsIt frontend application.

## Overview

The store directory provides:

- Centralized state management using Zustand
- Persistent state with localStorage
- Type-safe state and actions
- Reactive state updates
- Simple API without boilerplate

## Stores

### auth-store.ts

Authentication state management.

**State**:
```typescript
{
  user: User | null;              // Current user object
  isAuthenticated: boolean;       // Authentication status
  isGuest: boolean;               // Guest user flag
  isLoading: boolean;             // Loading state
  error: string | null;           // Error message
}
```

**Actions**:
- `setUser(user)` - Set current user
- `setLoading(loading)` - Set loading state
- `setError(error)` - Set error message
- `clearError()` - Clear error message
- `logout()` - Clear user and auth state
- `reset()` - Reset all state

**Usage**:
```typescript
import { useAuthStore } from '@/store/auth-store';

const MyComponent = () => {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

**Persistence**:
- Stored in localStorage under key `auth-storage`
- Automatically hydrates on app load
- Cleared on logout

**User Type**:
```typescript
type User = {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  isGuest?: boolean;
  emailVerified?: boolean;
};
```

**Features**:
- Automatic persistence across sessions
- Type-safe state and actions
- Guest user support
- Error state management
- Loading state for async operations

---

### game-store.ts

Game state management for lobby and active gameplay.

**State Structure**:
```typescript
{
  lobby: GameLobbyResponse | null;        // Lobby state
  isConnected: boolean;                   // Socket.IO connection status
  playState: GamePlayState | null;        // Active gameplay state
}
```

**Lobby State** (`GameLobbyResponse`):
- `roomCode` - Game room code
- `players` - List of players with ready status
- `hostId` - Host user ID
- `characterSet` - Selected character set
- `status` - Game status (lobby/playing/finished)

**Play State** (`GamePlayState`):
```typescript
{
  roomCode: string | null;
  gameState: GameStateResponse | null;    // Full game state
  characters: CharacterResponseDto[];     // Available characters
  questions: QuestionResponse[];          // Questions asked
  answers: Map<string, AnswerResponse>;   // Answers by question ID
  eliminatedCharacterIds: Set<string>;    // Eliminated characters
  flippedCharacterIds: Set<string>;       // Manually flipped characters
  myCharacter: PlayerCharacterResponse | null; // Player's secret character
}
```

**Actions**:

**Lobby Actions**:
- `setLobby(lobby)` - Update lobby state
- `setConnected(connected)` - Update connection status

**Play State Actions**:
- `setGameState(gameState)` - Set game state
- `setCharacters(characters)` - Set available characters
- `setMyCharacter(myCharacter)` - Set player's secret character
- `addQuestion(question)` - Add new question to history
- `addAnswer(answer)` - Add answer for question
- `eliminateCharacter(characterId)` - Mark character as eliminated
- `toggleFlipCharacter(characterId)` - Toggle character flip state
- `resetPlayState()` - Reset play state only
- `reset()` - Reset all state

**Usage**:

```typescript
import { useGameStore } from '@/store/game-store';

// Lobby component
const LobbyComponent = () => {
  const { lobby, setLobby, isConnected } = useGameStore();

  return (
    <div>
      <h1>Room: {lobby?.roomCode}</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <PlayerList players={lobby?.players} />
    </div>
  );
};

// Play component
const PlayComponent = () => {
  const {
    playState,
    eliminateCharacter,
    toggleFlipCharacter,
    addQuestion,
    addAnswer,
  } = useGameStore();

  const handleFlipCharacter = (characterId: string) => {
    toggleFlipCharacter(characterId);
  };

  return (
    <div>
      <CharacterGrid
        characters={playState?.characters}
        eliminatedIds={playState?.eliminatedCharacterIds}
        flippedIds={playState?.flippedCharacterIds}
        onFlip={handleFlipCharacter}
      />
      <QuestionHistory questions={playState?.questions} />
    </div>
  );
};
```

**Persistence**:
- Stored in localStorage under key `game-storage`
- Automatically hydrates on app load
- Serializes Sets and Maps to arrays for storage
- Deserializes on load

**Data Structures**:

The play state uses efficient data structures:

- **Map for answers**: O(1) lookup by question ID
- **Set for eliminated characters**: O(1) check and add
- **Set for flipped characters**: O(1) toggle operation
- **Array for questions**: Ordered history

**Features**:
- Real-time state updates from Socket.IO
- Optimistic UI updates
- Automatic persistence
- Type-safe from @whois-it/contracts
- Efficient data structures
- Character elimination tracking
- Question/answer history

---

## Zustand Best Practices

### Store Structure

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create<StoreType>()(
  persist(
    (set, get) => ({
      // State
      value: null,

      // Actions
      setValue: (newValue) => set({ value: newValue }),
      reset: () => set({ value: null }),
    }),
    {
      name: 'store-name',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### Using Stores

#### Select specific state
```typescript
const user = useAuthStore((state) => state.user);
const setUser = useAuthStore((state) => state.setUser);
```

#### Select multiple values
```typescript
const { user, isAuthenticated, logout } = useAuthStore();
```

#### Avoid unnecessary re-renders
```typescript
// Only re-render when username changes
const username = useAuthStore((state) => state.user?.username);
```

### Actions Pattern

Actions should:
- Use `set()` to update state
- Be synchronous (async logic in components/hooks)
- Update related state together
- Clear errors on success

```typescript
setUser: (user) => set({
  user,
  isAuthenticated: !!user,
  isGuest: !!user?.isGuest,
  error: null, // Clear error on success
}),
```

## Persistence

### Configuration

```typescript
persist(
  (set, get) => ({
    // State and actions
  }),
  {
    name: 'storage-key',
    storage: createJSONStorage(() => localStorage),
  }
)
```

### Custom Serialization

For complex data types like Maps and Sets:

```typescript
{
  name: 'game-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    // Serialize Sets/Maps to arrays
    playState: state.playState ? {
      ...state.playState,
      eliminatedCharacterIds: Array.from(state.playState.eliminatedCharacterIds),
      flippedCharacterIds: Array.from(state.playState.flippedCharacterIds),
    } : null,
  }),
  onRehydrateStorage: () => (state) => {
    // Deserialize arrays back to Sets
    if (state?.playState) {
      state.playState.eliminatedCharacterIds = new Set(
        state.playState.eliminatedCharacterIds
      );
    }
  },
}
```

## State Lifecycle

### Initialization

Stores are created on first use:
```typescript
const store = useStore(); // Creates store if not exists
```

### Hydration

Persisted state is restored from localStorage:
1. Store created with default values
2. localStorage checked for saved state
3. State hydrated if found
4. `onRehydrateStorage` callback runs

### Updates

State updates trigger re-renders:
```typescript
setUser(newUser); // All components using user re-render
```

### Cleanup

Reset state when appropriate:
```typescript
// On logout
authStore.reset();

// When leaving game
gameStore.resetPlayState();
```

## TypeScript Integration

### Type-safe state
```typescript
export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  // ... other fields
};

export const useAuthStore = create<AuthState>()(/* ... */);
```

### Type-safe selectors
```typescript
const user = useAuthStore((state: AuthState) => state.user);
```

### Typed actions
```typescript
setUser: (user: User | null) => void;
```

## Testing

Test stores with:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store/auth-store';

test('setUser updates state', () => {
  const { result } = renderHook(() => useAuthStore());

  act(() => {
    result.current.setUser({
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      avatarUrl: null,
    });
  });

  expect(result.current.isAuthenticated).toBe(true);
  expect(result.current.user?.username).toBe('testuser');
});
```

## Performance

### Optimize selectors

```typescript
// Bad - re-renders on any state change
const store = useStore();

// Good - only re-renders when username changes
const username = useStore((state) => state.user?.username);
```

### Batch updates

```typescript
// Combine related updates
set({
  user: newUser,
  isAuthenticated: true,
  error: null,
});
```

## Common Patterns

### Conditional state

```typescript
const isHost = useGameStore(
  (state) => state.lobby?.hostId === state.user?.id
);
```

### Derived state

```typescript
const canStartGame = useGameStore((state) =>
  state.lobby?.players.every((p) => p.isReady)
);
```

### Reset on unmount

```typescript
useEffect(() => {
  return () => {
    gameStore.resetPlayState();
  };
}, []);
```

## Future Enhancements

Potential improvements:

- DevTools integration
- Time-travel debugging
- State snapshots
- Undo/redo functionality
- State validation
- Migration between versions
- Multiple storage backends
- State synchronization across tabs
