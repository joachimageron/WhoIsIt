# Guesses API Documentation

This document describes the API endpoints for the guess system in the WhoIsIt game.

## Overview

The guess system allows players to make guesses about other players' secret characters during an active game. Players can make correct or incorrect guesses:

- **Correct guess**: The game is completed, and the guessing player wins
- **Incorrect guess**: The guessing player is eliminated from the game
  - If only one player remains after elimination, they win by default

## Endpoint

### POST /games/:roomCode/guesses

Make a guess about another player's secret character.

**Authentication**: Not required (game validation is based on playerId)

**URL Parameters**:
- `roomCode` (string, required): The room code of the game

**Request Body**:
```json
{
  "playerId": "uuid",           // ID of the player making the guess
  "targetPlayerId": "uuid",     // ID of the player being guessed about
  "targetCharacterId": "uuid"   // ID of the character being guessed
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",                 // ID of the guess record
  "guessedBy": {
    "id": "uuid",
    "username": "Player 1"
  },
  "targetPlayer": {
    "id": "uuid",
    "username": "Player 2"
  },
  "targetCharacter": {
    "id": "uuid",
    "name": "Sherlock Holmes"
  },
  "isCorrect": true,            // Whether the guess was correct
  "guessedAt": "2025-10-31T09:00:00.000Z",
  "gameStatus": "completed",    // Current game status after the guess
  "winnerId": "uuid"            // ID of the winner (only if game completed)
}
```

**Error Responses**:

- `400 Bad Request`: Invalid request parameters or game state
  - `roomCode is required`
  - `playerId is required`
  - `targetPlayerId is required`
  - `targetCharacterId is required`
  - `Game is not in progress`
  - `Player has left the game`
  - `Target player has left the game`
  - `Cannot guess your own character`
  - `Character does not belong to the game character set`

- `404 Not Found`: Resource not found
  - `Game not found`
  - `Guessing player not found`
  - `Target player not found`
  - `Target character not found`

- `500 Internal Server Error`: Server error
  - `Target player has no secret character assigned`
  - `No active round found`

## Socket.IO Event

After a guess is made, a `guessResult` event is broadcast to all players in the game room.

**Event**: `guessResult`

**Payload**:
```typescript
{
  roomCode: string,
  guess: {
    id: string,
    guessedBy: {
      id: string,
      username: string
    },
    targetPlayer: {
      id: string,
      username: string
    },
    targetCharacter: {
      id: string,
      name: string
    },
    isCorrect: boolean,
    guessedAt: string,
    gameStatus: GameStatus,
    winnerId?: string
  }
}
```

## Validation Rules

1. Game must be in `in_progress` status
2. Guessing player must exist and not have left the game
3. Target player must exist and not have left the game
4. Players cannot guess their own character
5. Target character must belong to the game's character set
6. Target player must have a secret character assigned
7. An active round must exist

## Game Flow

1. Player makes a guess via POST /games/:roomCode/guesses
2. Server validates the guess
3. Server checks if the guess is correct by comparing with target player's secret character
4. Server saves the guess record
5. If correct:
   - Game status is updated to `completed`
   - Target player's secret is revealed
   - Winner is recorded
6. If incorrect:
   - Guessing player is marked as left
   - If only one player remains, game is completed
7. Socket.IO `guessResult` event is broadcast to all players
8. Response is returned to the guessing player

## Example Usage

### Making a Correct Guess

**Request**:
```bash
POST /games/ABC12/guesses
Content-Type: application/json

{
  "playerId": "player-1-uuid",
  "targetPlayerId": "player-2-uuid",
  "targetCharacterId": "character-uuid"
}
```

**Response** (if correct):
```json
{
  "id": "guess-uuid",
  "guessedBy": {
    "id": "player-1-uuid",
    "username": "Alice"
  },
  "targetPlayer": {
    "id": "player-2-uuid",
    "username": "Bob"
  },
  "targetCharacter": {
    "id": "character-uuid",
    "name": "Sherlock Holmes"
  },
  "isCorrect": true,
  "guessedAt": "2025-10-31T09:30:00.000Z",
  "gameStatus": "completed",
  "winnerId": "player-1-uuid"
}
```

### Making an Incorrect Guess

**Response** (if incorrect):
```json
{
  "id": "guess-uuid",
  "guessedBy": {
    "id": "player-1-uuid",
    "username": "Alice"
  },
  "targetPlayer": {
    "id": "player-2-uuid",
    "username": "Bob"
  },
  "targetCharacter": {
    "id": "wrong-character-uuid",
    "name": "Dr. Watson"
  },
  "isCorrect": false,
  "guessedAt": "2025-10-31T09:30:00.000Z",
  "gameStatus": "in_progress"
}
```

Note: The guessing player (Alice) will be eliminated from the game after this incorrect guess.
