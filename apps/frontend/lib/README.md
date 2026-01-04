# Library (lib)

This directory contains utility functions, API clients, custom hooks, and shared logic for the WhoIsIt frontend application.

## Overview

The lib directory provides:

- API client functions for backend communication
- Custom React hooks for common functionality
- Socket.IO client configuration
- Utility functions and helpers
- Type-safe API wrappers

## Structure

```
lib/
├── auth-api.ts           # Authentication API client
├── game-api.ts           # Game API client
├── socket.ts             # Socket.IO client configuration
├── hooks/                # Custom React hooks
│   ├── use-auth.ts
│   ├── use-game-socket.ts
│   ├── use-game-access.ts
│   ├── use-game-actions.ts
│   ├── use-game-events.ts
│   └── use-game-initialization.ts
└── utils/                # Utility functions
    ├── validation.ts
    └── reset-game-store.ts
```

## API Clients

### auth-api.ts

Authentication and user management API client.

**Functions**:

- `register(data)` - Register new user account
- `login(data)` - Login with email/password
- `logout()` - Logout current user
- `getProfile()` - Get current user profile
- `updateProfile(data)` - Update user profile
- `changePassword(data)` - Change user password
- `verifyEmail(token)` - Verify email address
- `resendVerification()` - Resend verification email
- `forgotPassword(email)` - Request password reset
- `resetPassword(token, password)` - Reset password with token

**Usage**:
```typescript
import { login, register, getProfile } from '@/lib/auth-api';

// Register
const user = await register({
  email: 'user@example.com',
  username: 'username',
  password: 'password123',
});

// Login
const user = await login({
  emailOrUsername: 'user@example.com',
  password: 'password123',
});

// Get profile
const profile = await getProfile();
```

**Features**:
- Automatic cookie handling
- Error handling with typed responses
- TypeScript types for all requests/responses
- Credentials included in requests

---

### game-api.ts

Game-related API client.

**Functions**:

- `getCharacterSets()` - Get all character sets
- `getCharacters(characterSetId)` - Get characters in set
- `createGame(characterSetId)` - Create new game
- `getLobby(roomCode)` - Get lobby state
- `startGame(roomCode)` - Start game (host only)
- `getGameState(roomCode)` - Get current game state
- `getPlayerCharacter(roomCode)` - Get your secret character
- `askQuestion(roomCode, questionText)` - Ask a question
- `submitAnswer(roomCode, questionId, answerValue)` - Answer question
- `submitGuess(roomCode, characterId)` - Make a guess
- `getGameResults(roomCode)` - Get game results

**Usage**:
```typescript
import { createGame, getLobby, startGame } from '@/lib/game-api';

// Create game
const lobby = await createGame('character-set-id');

// Get lobby state
const lobbyState = await getLobby('ABC12');

// Start game
const gameState = await startGame('ABC12');
```

**Features**:
- Type-safe with @whois-it/contracts
- Error handling
- Credentials included
- Consistent error messages

---

### socket.ts

Socket.IO client configuration and initialization.

**Exports**:

- `getSocket()` - Get or create Socket.IO client instance
- Singleton pattern for socket connection
- Automatic reconnection
- Credential handling

**Usage**:
```typescript
import { getSocket } from '@/lib/socket';

const socket = getSocket();

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.emit('joinRoom', roomCode, (response) => {
  console.log('Joined room:', response);
});
```

**Features**:
- Singleton instance (one connection per client)
- Auto-reconnect on disconnect
- Cookie authentication
- Error handling

---

## Custom Hooks

### use-auth.ts

Hook for authentication state and actions.

**Returns**:
- `user` - Current user object or null
- `isAuthenticated` - Boolean authentication status
- `isLoading` - Loading state
- `login(data)` - Login function
- `logout()` - Logout function
- `register(data)` - Register function
- `updateProfile(data)` - Update profile function

**Usage**:
```typescript
import { useAuth } from '@/lib/hooks/use-auth';

const { user, isAuthenticated, login, logout } = useAuth();

if (isAuthenticated) {
  return <div>Welcome, {user.username}!</div>;
}
```

**Features**:
- Integrates with auth store
- Automatic profile loading
- Error handling
- Loading states

---

### use-game-socket.ts

Hook for Socket.IO game connection.

**Parameters**:
- `roomCode` - Game room code (optional)

**Returns**:
- `socket` - Socket.IO instance or null
- `isConnected` - Connection status
- `joinRoom(roomCode, callback)` - Join room function
- `leaveRoom(roomCode, callback)` - Leave room function

**Usage**:
```typescript
import { useGameSocket } from '@/lib/hooks/use-game-socket';

const { socket, isConnected, joinRoom } = useGameSocket();

useEffect(() => {
  if (socket && isConnected) {
    joinRoom('ABC12', (response) => {
      console.log('Joined:', response);
    });
  }
}, [socket, isConnected]);
```

**Features**:
- Automatic connection management
- Connection state tracking
- Cleanup on unmount
- Reconnection handling

---

### use-game-access.ts

Hook for managing game access and navigation.

**Parameters**:
- `roomCode` - Game room code
- `lang` - Current language

**Returns**:
- `canAccess` - Whether user can access game
- `isLoading` - Loading state
- `error` - Error message if any
- `navigateToLobby()` - Navigate to lobby
- `navigateToPlay()` - Navigate to play page

**Usage**:
```typescript
import { useGameAccess } from '@/lib/hooks/use-game-access';

const { canAccess, isLoading, error } = useGameAccess(roomCode, lang);

if (isLoading) return <Loading />;
if (!canAccess) return <Redirect to="/home" />;
```

**Features**:
- Access validation
- Automatic redirects
- Error handling
- Loading states

---

### use-game-actions.ts

Hook for game actions (questions, answers, guesses).

**Parameters**:
- `roomCode` - Game room code

**Returns**:
- `askQuestion(text)` - Ask question function
- `submitAnswer(questionId, value)` - Submit answer function
- `submitGuess(characterId)` - Make guess function
- `isLoading` - Loading state
- `error` - Error state

**Usage**:
```typescript
import { useGameActions } from '@/lib/hooks/use-game-actions';

const { askQuestion, submitAnswer, submitGuess } = useGameActions(roomCode);

const handleAskQuestion = async () => {
  await askQuestion('Does your character wear glasses?');
};
```

**Features**:
- Type-safe actions
- Error handling
- Loading states
- Automatic state updates

---

### use-game-events.ts

Hook for listening to game Socket.IO events.

**Parameters**:
- `socket` - Socket.IO instance
- `roomCode` - Game room code

**Returns**:
- Automatically updates game store with events
- No direct return value (side effects only)

**Usage**:
```typescript
import { useGameEvents } from '@/lib/hooks/use-game-events';

const socket = getSocket();
useGameEvents(socket, roomCode);
// Store is automatically updated with events
```

**Events Handled**:
- `lobbyUpdate` - Lobby state changes
- `gameStateUpdate` - Game state changes
- `questionAsked` - New question
- `answerSubmitted` - New answer
- `guessSubmitted` - New guess
- `playerJoined` - Player joined
- `playerLeft` - Player left
- `gameOver` - Game ended

---

### use-game-initialization.ts

Hook for initializing game state from API.

**Parameters**:
- `roomCode` - Game room code

**Returns**:
- `isInitialized` - Whether initialization is complete
- `isLoading` - Loading state
- `error` - Error state

**Usage**:
```typescript
import { useGameInitialization } from '@/lib/hooks/use-game-initialization';

const { isInitialized, isLoading } = useGameInitialization(roomCode);

if (!isInitialized) return <Loading />;
```

**Features**:
- Fetches initial game state
- Updates game store
- Error handling
- Loading states

---

## Utilities

### validation.ts

Form validation utilities.

**Functions**:
- `validateEmail(email)` - Email format validation
- `validatePassword(password)` - Password strength validation
- `validateUsername(username)` - Username validation
- `validateRoomCode(code)` - Room code validation

**Usage**:
```typescript
import { validateEmail, validatePassword } from '@/lib/utils/validation';

const emailError = validateEmail('user@example.com');
const passwordError = validatePassword('password123');
```

**Features**:
- Consistent validation rules
- Clear error messages
- Client-side validation
- Type-safe

---

### reset-game-store.ts

Utility for resetting game store state.

**Function**:
- `resetGameStore()` - Clear all game state

**Usage**:
```typescript
import { resetGameStore } from '@/lib/utils/reset-game-store';

// When leaving game
resetGameStore();
```

**Use Cases**:
- Leaving a game
- Starting new game
- Cleaning up after game over
- Error recovery

---

## Best Practices

### API Calls

- Always include credentials for authenticated endpoints
- Handle errors with try-catch
- Provide clear error messages
- Use TypeScript types from @whois-it/contracts

### Custom Hooks

- Follow React hooks rules
- Clean up side effects
- Handle loading states
- Provide error states
- Use TypeScript for type safety

### Socket.IO

- Use singleton pattern
- Clean up listeners
- Handle reconnection
- Use acknowledgement callbacks
- Type event payloads

## Error Handling

All API functions and hooks handle errors:

```typescript
try {
  const result = await apiFunction();
  // Success
} catch (error) {
  // Error object with message
  console.error(error.message);
}
```

## TypeScript

All modules are fully typed:

- Request/response types
- Hook return types
- Function parameters
- Error types

## Testing

Test files in `__tests__/` directories:

- Unit tests for API functions
- Hook tests with React Testing Library
- Mock API responses
- Test error cases

## Dependencies

- `@whois-it/contracts` - Shared types
- `socket.io-client` - WebSocket client
- `react` - React hooks
- `next/navigation` - Routing

## Future Enhancements

- Retry logic for failed requests
- Request caching
- Optimistic updates
- Request queuing
- Better error types
- API versioning support
- Request cancellation
- Rate limiting helpers
