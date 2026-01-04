# Game Module

This module handles all game-related functionality including lobby management, gameplay mechanics, and real-time communication for the WhoIsIt guessing game.

## Overview

The game module provides:

- Game creation and lobby management
- Real-time gameplay with Socket.IO
- Question and answer mechanics
- Guessing and win condition logic
- Character set management
- Game statistics tracking
- Automatic lobby cleanup

## Architecture

### Module Structure

- `game.controller.ts` - REST API endpoints for game operations
- `game.module.ts` - Module configuration and dependency injection
- `gateway/` - WebSocket gateway for real-time communication
  - `game.gateway.ts` - Socket.IO event handlers
  - `connection.manager.ts` - Connection state management
- `services/` - Business logic services
  - `game.service.ts` - Core game logic and orchestration
  - `game-lobby.service.ts` - Lobby management
  - `game-play.service.ts` - Gameplay mechanics
  - `game-stats.service.ts` - Player statistics
  - `broadcast.service.ts` - Real-time event broadcasting
  - `lobby-cleanup.service.ts` - Automatic lobby cleanup
- `character-sets/` - Character set management

## Game Flow

### 1. Lobby Phase

1. Host creates a game with a character set
2. Room code is generated (5 uppercase characters)
3. Players join using the room code
4. Players mark themselves as ready
5. Host starts the game when all players are ready

### 2. Setup Phase

1. Each player is assigned a secret character
2. Game panels are created for each player
3. Round 1 is initialized
4. Game state transitions to "playing"

### 3. Playing Phase

Players take turns in rounds:

1. **Ask Question**: Current player asks a yes/no question
2. **Answer**: Other player answers (yes/no/maybe)
3. **Mark Eliminated**: Players mark eliminated characters on their panel
4. **Make Guess** (optional): Player can guess the opponent's character
   - Correct guess = win immediately
   - Wrong guess = lose immediately

### 4. Game Over

- Game ends when a player guesses correctly or incorrectly
- Winner is determined
- Statistics are updated
- Results are broadcasted to all players

## Features

### Lobby Management

- Unique 5-character room codes
- Player ready status tracking
- Host designation (first player to join)
- Real-time lobby updates via WebSocket
- Automatic cleanup of stale lobbies (configurable interval)

### Real-time Communication

All game events use Socket.IO with acknowledgement callbacks:

- `joinRoom` - Join a game lobby
- `leaveRoom` - Leave a lobby
- `updatePlayerReady` - Toggle ready status
- `startGame` - Host starts the game
- `askQuestion` - Ask a question
- `submitAnswer` - Answer a question
- `submitGuess` - Guess opponent's character
- `lobbyUpdate` - Broadcast lobby state changes
- `gameStateUpdate` - Broadcast game state changes
- `questionAsked` - Notify when question is asked
- `answerSubmitted` - Notify when answer is given
- `guessSubmitted` - Notify when guess is made
- `playerJoined` - Notify when player joins
- `playerLeft` - Notify when player leaves

### Character Sets

- Predefined sets of characters (e.g., classic characters, animals)
- Each character has:
  - Name
  - Image URL
  - Attributes for filtering

### Game Rules

- 2 players required
- Turn-based gameplay
- Yes/no/maybe question system
- Character elimination tracking
- Single guess mechanic
- First to guess correctly wins

### Statistics Tracking

Player statistics include:

- Total games played
- Wins/losses
- Win rate
- Average questions per game
- Guessing accuracy
- Time spent playing

## API Endpoints

### POST /games

Create a new game.

**Authentication**: Required (JWT)

**Request body**:
```json
{
  "characterSetId": "uuid-of-character-set"
}
```

**Response**: `GameLobbyResponse` with room code

### GET /games/:roomCode

Get lobby state.

**Authentication**: Required (JWT)

**Response**: Current lobby state with players

### POST /games/:roomCode/start

Start the game (host only).

**Authentication**: Required (JWT)

**Response**: Initial game state

### GET /games/:roomCode/state

Get current game state.

**Authentication**: Required (JWT)

**Response**: Complete game state including rounds and questions

### POST /games/:roomCode/questions

Ask a question.

**Authentication**: Required (JWT)

**Request body**:
```json
{
  "questionText": "Does your character wear glasses?"
}
```

### POST /games/:roomCode/answers

Answer a question.

**Authentication**: Required (JWT)

**Request body**:
```json
{
  "questionId": "uuid",
  "answerValue": "yes"
}
```

### POST /games/:roomCode/guesses

Make a guess.

**Authentication**: Required (JWT)

**Request body**:
```json
{
  "characterId": "uuid"
}
```

### GET /games/:roomCode/character

Get your secret character.

**Authentication**: Required (JWT)

**Response**: Character details

### GET /games/:roomCode/results

Get game results (when game is over).

**Authentication**: Required (JWT)

**Response**: Winner, statistics, and final state

## WebSocket Events

### Client to Server

- `joinRoom(roomCode, callback)` - Join lobby for real-time updates
- `leaveRoom(roomCode, callback)` - Leave lobby
- `updatePlayerReady(roomCode, isReady, callback)` - Toggle ready status

### Server to Client

- `lobbyUpdate(lobby)` - Lobby state changed
- `playerJoined(player)` - New player joined
- `playerLeft(playerId)` - Player left
- `gameStarted(gameState)` - Game has started
- `gameStateUpdate(gameState)` - Game state changed
- `questionAsked(question)` - Question was asked
- `answerSubmitted(answer)` - Answer was given
- `guessSubmitted(guess)` - Guess was made
- `gameOver(result)` - Game ended

## Room Codes

- Format: 5 uppercase letters/numbers
- Generated using nanoid with custom alphabet
- Guaranteed unique
- Case-insensitive on server (normalized to uppercase)

## Database Entities Used

- `Game` - Game session data
- `GamePlayer` - Player participation and ready status
- `Round` - Game rounds
- `Question` - Questions asked during gameplay
- `Answer` - Answers to questions
- `Guess` - Character guesses
- `PlayerSecret` - Secret character assignments
- `PlayerPanel` - Eliminated character tracking
- `CharacterSet` - Available character sets
- `Character` - Individual characters
- `PlayerStats` - Player statistics

## Services

### GameService

Core orchestration service:
- Game creation
- State transitions
- Turn management
- Win condition checking

### GameLobbyService

Lobby management:
- Player joining/leaving
- Ready status
- Game starting
- Lobby validation

### GamePlayService

Gameplay mechanics:
- Question asking
- Answer submission
- Character guessing
- Panel updates

### GameStatsService

Statistics tracking:
- Update player stats after game
- Calculate win rates
- Track game history

### BroadcastService

Real-time communication:
- Emit Socket.IO events to specific rooms
- Broadcast state updates
- Handle player notifications

### LobbyCleanupService

Automatic maintenance:
- Detect stale lobbies
- Clean up abandoned games
- Scheduled cleanup task

## Testing

Run game module tests:

```bash
# Unit tests
pnpm test:backend -- game

# E2E tests
pnpm test:backend:e2e -- game
```

## Configuration

### Environment Variables

- `LOBBY_CLEANUP_INTERVAL_MS` - Interval for lobby cleanup (default: 5 minutes)
- `LOBBY_STALE_TIMEOUT_MS` - Time before lobby is considered stale (default: 30 minutes)

## Performance Considerations

- Socket.IO rooms are used for efficient broadcasting
- Database queries are optimized with proper joins
- Indexes on `roomCode` and `status` fields
- Connection state managed efficiently
- Automatic cleanup prevents memory leaks

## Security

- Room codes are case-insensitive but stored uppercase
- JWT authentication required for all endpoints
- WebSocket connections authenticated via adapter
- Players can only access their own secret characters
- Turn validation prevents out-of-turn actions
- Host validation for game start

## Future Enhancements

Potential improvements:

- Spectator mode
- Multiple rounds/best-of-3
- Ranked matchmaking
- Character set customization
- Private/public game modes
- Replay system
- Chat during gameplay
- Hints system
- Time limits per turn
