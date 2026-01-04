# Game Pages

This directory contains all game-related pages for the WhoIsIt frontend application.

## Overview

The game pages handle the complete game flow from creation to results:

1. **Create** - Host creates a new game
2. **Join** - Players join an existing game via room code
3. **Lobby** - Pre-game waiting room
4. **Play** - Active gameplay
5. **Results** - Post-game results and statistics

## Pages

### Create Game (`create/`)

**Route**: `/[lang]/game/create`

Allows authenticated users to create a new game session.

**Features**:
- Character set selection
- Game creation
- Automatic redirect to lobby as host
- Guest user support

**Components**:
- `page.tsx` - Server component for dictionary
- `create-game-form.tsx` - Client component with form logic

**Flow**:
1. User selects a character set
2. Submits creation request to `/games` API
3. Receives room code
4. Redirects to lobby page

**Authentication**: Required (JWT or guest session)

**API Endpoints Used**:
- `POST /games` - Create new game

---

### Join Game (`join/`)

**Route**: `/[lang]/game/join`

Allows players to join an existing game using a room code.

**Features**:
- Room code input (5 characters)
- Case-insensitive room code
- Guest user support
- Error handling for invalid codes

**Components**:
- `page.tsx` - Server component for dictionary
- `join-form.tsx` - Client component with form logic

**Flow**:
1. User enters 5-character room code
2. Submits join request to `/games/:roomCode` API
3. Validates room code exists and is joinable
4. Redirects to lobby page

**Authentication**: Required (JWT or guest session)

**API Endpoints Used**:
- `GET /games/:roomCode` - Validate and join game

**Error Handling**:
- Invalid room code format
- Game not found
- Game already started
- Game full

---

### Lobby (`lobby/[roomCode]/`)

**Route**: `/[lang]/game/lobby/[roomCode]`

Pre-game waiting room where players prepare to start the game.

**Features**:
- Display room code
- Show all players with ready status
- Toggle ready status (non-host players)
- Start game button (host only, when all ready)
- Real-time updates via Socket.IO
- Leave lobby functionality
- Connection status indicator

**Components**:
- `page.tsx` - Server component for dictionary
- `lobby-client.tsx` - Client component with Socket.IO
- `README.md` - Detailed documentation (already exists)

**Real-time Events**:
- `joinRoom` - Join for updates
- `leaveRoom` - Leave lobby
- `updatePlayerReady` - Toggle ready status
- `lobbyUpdate` - Receive lobby changes
- `playerJoined` - New player joined
- `playerLeft` - Player left

**Flow**:
1. Player joins lobby (via create or join)
2. Players mark themselves as ready
3. Host waits for all players to be ready
4. Host starts game
5. All players redirect to play page

**Authentication**: Required (JWT or guest session)

**API Endpoints Used**:
- `GET /games/:roomCode` - Get lobby state
- `POST /games/:roomCode/start` - Start game (host only)

**See**: `lobby/[roomCode]/README.md` for complete documentation

---

### Play Game (`play/[roomCode]/`)

**Route**: `/[lang]/game/play/[roomCode]`

Active gameplay page where players ask questions, answer, and make guesses.

**Features**:
- Display secret character (own character to guess)
- Character grid with elimination tracking
- Ask yes/no questions (on your turn)
- Answer questions (opponent's turn)
- Make guesses
- Real-time game state updates
- Turn indicator
- Question/answer history
- Round tracking

**Components**:
- `page.tsx` - Server component for dictionary
- Client component with game logic (to be documented)

**Real-time Events**:
- `gameStateUpdate` - Game state changed
- `questionAsked` - New question asked
- `answerSubmitted` - Question answered
- `guessSubmitted` - Guess made
- `gameOver` - Game ended

**Game Mechanics**:
- **Your Turn**: Ask a question or make a guess
- **Opponent's Turn**: Answer their question
- **Question**: Yes/no questions about character attributes
- **Answer**: Yes, No, or Maybe
- **Guess**: Select a character from the grid
  - Correct = You win
  - Incorrect = You lose

**Flow**:
1. Game starts with both players assigned secret characters
2. Players take turns asking questions
3. Opponent answers each question
4. Players eliminate characters based on answers
5. When confident, player makes a guess
6. Game ends when guess is made
7. Redirect to results page

**Authentication**: Required (JWT or guest session)

**API Endpoints Used**:
- `GET /games/:roomCode/state` - Get game state
- `GET /games/:roomCode/character` - Get your secret character
- `POST /games/:roomCode/questions` - Ask question
- `POST /games/:roomCode/answers` - Answer question
- `POST /games/:roomCode/guesses` - Make guess

---

### Results (`results/[roomCode]/`)

**Route**: `/[lang]/game/results/[roomCode]`

Post-game results page showing winner and game statistics.

**Features**:
- Display winner
- Show game statistics
- Question/answer history
- Play again option
- Return to home option
- Player performance metrics

**Components**:
- `page.tsx` - Server/client component for results display

**Statistics Shown**:
- Winner/loser
- Total questions asked
- Total rounds played
- Guess accuracy
- Time played
- Questions per round

**Flow**:
1. Game ends (after guess)
2. Redirect to results page
3. Display winner and stats
4. Options to play again or return home

**Authentication**: Required (JWT or guest session)

**API Endpoints Used**:
- `GET /games/:roomCode/results` - Get game results

---

## Common Features

### Internationalization

All pages use the dictionary system for translations:

```typescript
const dict = await getDictionary(lang);
```

**Language Parameter**: `[lang]` in URL (e.g., `en`, `fr`)

### Authentication

All game pages require authentication:
- Authenticated users (JWT token)
- Guest sessions (temporary player)

Handled by `JwtAuthGuard` or guest session middleware.

### Real-time Communication

Pages use Socket.IO for real-time updates:

```typescript
import { useGameSocket } from '@/lib/hooks/use-game-socket';

const socket = useGameSocket(roomCode);
```

### State Management

Pages use Zustand stores:

```typescript
import { useGameStore } from '@/store/game-store';
import { useAuthStore } from '@/store/auth-store';
```

### Navigation

**Next.js App Router**:
- Server components for initial data
- Client components for interactivity
- Programmatic navigation with `useRouter`

**Protected Routes**:
- All routes require authentication
- Redirects handled by middleware

## Error Handling

Common error scenarios:

- **Invalid room code**: Redirect to home with error toast
- **Game not found**: Show error message
- **Connection lost**: Show disconnected indicator
- **Unauthorized**: Redirect to login
- **Game already started**: Prevent joining
- **Not your turn**: Disable actions

## Testing

Game pages should be tested for:

- Rendering with correct props
- Form submission handling
- Navigation flows
- Error states
- Real-time event handling
- State updates

## Dependencies

- `@heroui/*` - UI components
- `socket.io-client` - Real-time communication
- `@whois-it/contracts` - Shared TypeScript types
- `zustand` - State management
- `next/navigation` - Routing

## Future Enhancements

Potential improvements:

- Game replay functionality
- Spectator mode
- Tournament mode
- Multiple rounds/best-of-3
- Character set previews
- Game statistics graphs
- Social features (friends, challenges)
- Mobile app versions
- Tutorial/practice mode
