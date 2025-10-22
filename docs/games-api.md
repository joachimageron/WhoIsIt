# Game API Documentation

This document describes the RESTful endpoints for managing games (lobbies and gameplay) in the WhoIsIt backend.

## Base URL

```
http://localhost:4000
```

## Endpoints

### Create a Game

Creates a new game lobby with a unique room code.

**Endpoint:** `POST /games`

**Request Body:**

```json
{
  "characterSetId": "uuid",
  "hostUsername": "Player One",
  "hostUserId": "uuid (optional)",
  "visibility": "private",
  "maxPlayers": 8,
  "turnTimerSeconds": 60,
  "ruleConfig": {}
}
```

**Required Fields:**
- `characterSetId` - UUID of the character set to use
- `hostUsername` OR `hostUserId` - The host must have either a username or a user ID

**Optional Fields:**
- `visibility` - "public" or "private" (default: "private")
- `maxPlayers` - Maximum number of players allowed (null for unlimited)
- `turnTimerSeconds` - Time limit per turn in seconds (null for no limit)
- `ruleConfig` - Custom game rules (object)

**Response:**

```json
{
  "id": "uuid",
  "roomCode": "ABC12",
  "status": "lobby",
  "visibility": "private",
  "hostUserId": "uuid",
  "characterSetId": "uuid",
  "maxPlayers": 8,
  "turnTimerSeconds": 60,
  "ruleConfig": {},
  "createdAt": "2024-01-01T00:00:00.000Z",
  "startedAt": null,
  "endedAt": null,
  "players": [
    {
      "id": "uuid",
      "username": "Player One",
      "avatarUrl": null,
      "role": "host",
      "isReady": true,
      "joinedAt": "2024-01-01T00:00:00.000Z",
      "userId": "uuid"
    }
  ]
}
```

### Join a Game

Join an existing game lobby using the room code.

**Endpoint:** `POST /games/:roomCode/join`

**Parameters:**
- `roomCode` (path parameter) - The unique room code (e.g., "ABC12")

**Request Body:**

```json
{
  "username": "Player Two",
  "userId": "uuid (optional)",
  "avatarUrl": "https://example.com/avatar.png (optional)"
}
```

**Required Fields:**
- `username` OR `userId` - Must have either a username or a user ID

**Response:** Same structure as Create Game response, but with the new player added to the players array.

**Error Responses:**
- `404 Not Found` - Game not found
- `400 Bad Request` - Game is not joinable (already started/ended)
- `400 Bad Request` - Game is full

### Get Game Lobby

Retrieve the current state of a game lobby.

**Endpoint:** `GET /games/:roomCode`

**Parameters:**
- `roomCode` (path parameter) - The unique room code

**Response:** Same structure as Create Game response

**Error Responses:**
- `404 Not Found` - Game not found

### Start Game

Start the game. All players must be ready.

**Endpoint:** `POST /games/:roomCode/start`

**Parameters:**
- `roomCode` (path parameter) - The unique room code

**Response:**

```json
{
  "id": "uuid",
  "roomCode": "ABC12",
  "status": "in_progress",
  "visibility": "private",
  "hostUserId": "uuid",
  "characterSetId": "uuid",
  "maxPlayers": 8,
  "turnTimerSeconds": 60,
  "ruleConfig": {},
  "createdAt": "2024-01-01T00:00:00.000Z",
  "startedAt": "2024-01-01T00:05:00.000Z",
  "endedAt": null,
  "players": [...]
}
```

**Error Responses:**
- `404 Not Found` - Game not found
- `400 Bad Request` - Game has already started or ended
- `400 Bad Request` - Need at least 2 players to start
- `400 Bad Request` - All players must be ready to start

## Game Status Values

- `lobby` - Game is in the lobby, players can join
- `in_progress` - Game has started
- `completed` - Game has finished normally
- `aborted` - Game was aborted/cancelled

## Player Roles

- `host` - The player who created the game
- `player` - A regular player
- `spectator` - A spectator (not implemented yet)

## Example Usage

### Using curl

**Create a game:**

```bash
curl -X POST http://localhost:4000/games \
  -H "Content-Type: application/json" \
  -d '{
    "characterSetId": "character-set-uuid",
    "hostUsername": "Player One",
    "visibility": "private",
    "maxPlayers": 8
  }'
```

**Join a game:**

```bash
curl -X POST http://localhost:4000/games/ABC12/join \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Player Two"
  }'
```

**Get game lobby:**

```bash
curl -X GET http://localhost:4000/games/ABC12
```

**Start a game:**

```bash
curl -X POST http://localhost:4000/games/ABC12/start
```

### Using fetch (JavaScript/TypeScript)

```typescript
// Create a game
const createResponse = await fetch('http://localhost:4000/games', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    characterSetId: 'uuid',
    hostUsername: 'Player One',
    visibility: 'private',
  }),
});
const game = await createResponse.json();

// Join a game
const joinResponse = await fetch(`http://localhost:4000/games/${roomCode}/join`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'Player Two',
  }),
});
const updatedGame = await joinResponse.json();

// Start the game
const startResponse = await fetch(`http://localhost:4000/games/${roomCode}/start`, {
  method: 'POST',
});
const startedGame = await startResponse.json();
```

## Notes

- Room codes are 5 characters long, using uppercase letters and numbers (excluding confusing characters like O/0, I/1)
- Room codes are unique and randomly generated
- The host is automatically marked as ready when creating a game
- New players joining a game are not marked as ready by default
- Players can update their ready status via Socket.IO (see Socket.IO documentation)
- A game requires at least 2 players to start
- All players must be ready before the game can start
