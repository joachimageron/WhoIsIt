# REST API Reference

## Base URL

```text
Development: http://localhost:4000
Production: [Your production URL]
```

## Authentication

Most endpoints use **JWT tokens** stored in **HTTP-only cookies**.

### Cookie Name

```text
access_token
```

### Token Format

```text
Bearer <JWT_TOKEN>
```

### Authenticated Requests

Cookies are automatically sent with requests when using `credentials: 'include'` in fetch:

```typescript
fetch('http://localhost:4000/auth/profile', {
  credentials: 'include',  // Include cookies
});
```

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Success"
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Authentication Endpoints

### Register

Create a new user account.

**POST** `/auth/register`

**Request Body**:

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePassword123",
  "avatarUrl": "https://example.com/avatar.jpg"  // Optional
}
```

**Response** (200):

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "isGuest": false,
    "emailVerified": false
  }
}
```

**Errors**:

- `400`: Email already exists
- `400`: Username already taken
- `400`: Invalid email format
- `400`: Password too weak

**Side Effects**:

- Sets `access_token` cookie
- Sends verification email (if email service configured)

---

### Login

Authenticate an existing user.

**POST** `/auth/login`

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200):

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "isGuest": false,
    "emailVerified": true
  }
}
```

**Errors**:

- `401`: Invalid credentials
- `400`: Missing email or password

**Side Effects**:

- Sets `access_token` cookie
- Updates `lastSeenAt` timestamp

---

### Get Profile

Get current user's profile.

**GET** `/auth/profile`

**Authentication**: Required (JWT in cookie)

**Response** (200):

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "isGuest": false,
  "emailVerified": true
}
```

**Errors**:

- `401`: Unauthorized (no valid token)

---

### Logout

Logout current user.

**POST** `/auth/logout`

**Authentication**: Required (JWT in cookie)

**Response** (200):

```json
{
  "message": "Logged out successfully"
}
```

**Side Effects**:

- Clears `access_token` cookie

---

### Verify Email

Verify user's email address.

**POST** `/auth/verify-email`

**Request Body**:

```json
{
  "token": "verification-token-from-email"
}
```

**Response** (200):

```json
{
  "message": "Email verified successfully"
}
```

**Errors**:

- `400`: Invalid or expired token

---

### Forgot Password

Request password reset email.

**POST** `/auth/forgot-password`

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Response** (200):

```json
{
  "message": "Password reset email sent"
}
```

**Errors**:

- `404`: User not found

**Side Effects**:

- Sends password reset email
- Generates reset token (valid 1 hour)

---

### Reset Password

Reset password using token from email.

**POST** `/auth/reset-password`

**Request Body**:

```json
{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword123"
}
```

**Response** (200):

```json
{
  "message": "Password reset successfully"
}
```

**Errors**:

- `400`: Invalid or expired token
- `400`: Password too weak

---

## Game Endpoints

### Create Game

Create a new game lobby.

**POST** `/games`

**Authentication**: Optional (guest users allowed)

**Request Body**:

```json
{
  "characterSetId": "uuid",
  "hostUsername": "Player 1",        // Required if no hostUserId
  "hostUserId": "uuid",              // Optional (from auth)
  "visibility": "private",           // Optional: "public" | "private"
  "turnTimerSeconds": 30,            // Optional
  "ruleConfig": {}                   // Optional: custom rules
}
```

**Response** (201):

```json
{
  "id": "uuid",
  "roomCode": "ABC123",
  "status": "lobby",
  "visibility": "private",
  "hostUserId": "uuid",
  "characterSetId": "uuid",
  "turnTimerSeconds": 30,
  "ruleConfig": {},
  "createdAt": "2024-01-01T00:00:00Z",
  "players": [
    {
      "id": "uuid",
      "username": "Player 1",
      "avatarUrl": null,
      "role": "host",
      "isReady": false,
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Errors**:

- `400`: Invalid character set ID
- `400`: Missing hostUsername
- `400`: Game is full (max 2 players)

---

### Join Game

Join an existing game by room code.

**POST** `/games/:roomCode/join`

**Authentication**: Optional (guest users allowed)

**URL Parameters**:

- `roomCode` (string): 6-character room code

**Request Body**:

```json
{
  "username": "Player 2",      // Required if no userId
  "userId": "uuid",            // Optional (from auth)
  "avatarUrl": "https://..."   // Optional
}
```

**Response** (200):

```json
{
  "id": "uuid",
  "roomCode": "ABC123",
  "status": "lobby",
  "players": [
    {
      "id": "uuid",
      "username": "Player 1",
      "role": "host",
      "isReady": true
    },
    {
      "id": "uuid",
      "username": "Player 2",
      "role": "player",
      "isReady": false
    }
  ]
}
```

**Errors**:

- `404`: Game not found
- `400`: Game is full
- `400`: Game already started
- `400`: Username already taken in this game

---

### Get Lobby

Get current lobby state.

**GET** `/games/:roomCode`

**Authentication**: Not required

**URL Parameters**:

- `roomCode` (string): 6-character room code

**Response** (200):

```json
{
  "id": "uuid",
  "roomCode": "ABC123",
  "status": "lobby",
  "visibility": "private",
  "characterSetId": "uuid",
  "players": [...],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Errors**:

- `404`: Game not found

---

### Start Game

Start the game (host only via WebSocket broadcast).

**POST** `/games/:roomCode/start`

**Authentication**: Optional

**URL Parameters**:

- `roomCode` (string): 6-character room code

**Response** (200):

```json
{
  "id": "uuid",
  "roomCode": "ABC123",
  "status": "in_progress",
  "startedAt": "2024-01-01T00:00:00Z",
  "players": [...]
}
```

**Errors**:

- `404`: Game not found
- `400`: Game already started
- `400`: Not enough players (minimum 2)
- `400`: Not all players ready

**Side Effects**:

- Broadcasts `gameStarted` event to all players via WebSocket
- Assigns secret characters to players
- Creates first round

---

### Get Player Character

Get the secret character assigned to a player (only visible to that player).

**GET** `/games/:roomCode/players/:playerId/character`

**Authentication**: Not required (player ID serves as authentication)

**URL Parameters**:

- `roomCode` (string): 6-character room code
- `playerId` (string): Player UUID

**Response** (200):

```json
{
  "playerId": "uuid",
  "character": {
    "id": "uuid",
    "name": "Alice",
    "slug": "alice",
    "imageUrl": "https://...",
    "summary": "A curious adventurer",
    "metadata": {},
    "isActive": true
  },
  "assignedAt": "2024-01-01T00:00:00Z"
}
```

**Errors**:

- `404`: Game not found
- `404`: Player not found
- `400`: Game not started yet

---

### Ask Question

Ask a question during gameplay.

**POST** `/games/:roomCode/questions`

**Authentication**: Not required

**URL Parameters**:

- `roomCode` (string): 6-character room code

**Request Body**:

```json
{
  "playerId": "uuid",
  "targetPlayerId": "uuid",     // Optional (null for general question)
  "questionText": "Is your character female?"
}
```

**Response** (201):

```json
{
  "id": "uuid",
  "roundId": "uuid",
  "roundNumber": 1,
  "askedByPlayerId": "uuid",
  "askedByPlayerUsername": "Player 1",
  "targetPlayerId": "uuid",
  "targetPlayerUsername": "Player 2",
  "questionText": "Is your character female?",
  "askedAt": "2024-01-01T00:00:00Z"
}
```

**Errors**:

- `404`: Game not found
- `400`: Not player's turn
- `400`: Game not in progress

**Side Effects**:

- Broadcasts `questionAsked` event via WebSocket

---

### Submit Answer

Submit an answer to a question.

**POST** `/games/:roomCode/questions/:questionId/answer`

**Authentication**: Not required

**URL Parameters**:

- `roomCode` (string): 6-character room code
- `questionId` (string): Question UUID

**Request Body**:

```json
{
  "playerId": "uuid",
  "answerValue": "yes",          // "yes" | "no" | "unsure"
  "answerText": "Additional explanation..."  // Optional
}
```

**Response** (201):

```json
{
  "id": "uuid",
  "questionId": "uuid",
  "answeredByPlayerId": "uuid",
  "answeredByPlayerUsername": "Player 2",
  "answerValue": "yes",
  "answerText": "Additional explanation...",
  "latencyMs": 1234,
  "answeredAt": "2024-01-01T00:00:01Z"
}
```

**Errors**:

- `404`: Question not found
- `400`: Invalid answer value
- `400`: Already answered

**Side Effects**:

- Broadcasts `answerSubmitted` event via WebSocket

---

### Submit Guess

Submit a guess about a character.

**POST** `/games/:roomCode/guesses`

**Authentication**: Not required

**URL Parameters**:

- `roomCode` (string): 6-character room code

**Request Body**:

```json
{
  "playerId": "uuid",
  "targetPlayerId": "uuid",        // Optional (null for own character)
  "targetCharacterId": "uuid"
}
```

**Response** (201):

```json
{
  "id": "uuid",
  "roundId": "uuid",
  "roundNumber": 1,
  "guessedByPlayerId": "uuid",
  "guessedByPlayerUsername": "Player 1",
  "targetPlayerId": "uuid",
  "targetPlayerUsername": "Player 2",
  "targetCharacterId": "uuid",
  "targetCharacterName": "Alice",
  "isCorrect": true,
  "latencyMs": 2000,
  "guessedAt": "2024-01-01T00:00:02Z"
}
```

**Errors**:

- `404`: Game not found
- `400`: Not player's turn
- `400`: Invalid character ID

**Side Effects**:

- Broadcasts `guessResult` event via WebSocket
- May trigger `gameOver` event if winning guess

---

## Character Set Endpoints

### List Character Sets

Get all available character sets.

**GET** `/character-sets`

**Authentication**: Not required

**Query Parameters**:

- `visibility` (optional): Filter by visibility ("public" | "private")

**Response** (200):

```json
[
  {
    "id": "uuid",
    "name": "Classic Characters",
    "slug": "classic-characters",
    "description": "24 classic game characters",
    "visibility": "public",
    "isDefault": true,
    "characterCount": 24
  }
]
```

---

### Get Character Set

Get a specific character set with all characters.

**GET** `/character-sets/:id`

**Authentication**: Not required

**URL Parameters**:

- `id` (string): Character set UUID

**Response** (200):

```json
{
  "id": "uuid",
  "name": "Classic Characters",
  "slug": "classic-characters",
  "description": "24 classic game characters",
  "visibility": "public",
  "isDefault": true,
  "metadata": {},
  "createdAt": "2024-01-01T00:00:00Z",
  "characters": [
    {
      "id": "uuid",
      "name": "Alice",
      "slug": "alice",
      "imageUrl": "https://...",
      "summary": "A curious adventurer",
      "metadata": {},
      "isActive": true
    }
  ]
}
```

**Errors**:

- `404`: Character set not found

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding rate limiting in production:

```typescript
// Example rate limit configuration
{
  "auth/login": "5 requests per minute",
  "auth/register": "3 requests per hour",
  "games": "30 requests per minute"
}
```

## CORS Configuration

The backend allows cross-origin requests from the frontend URL:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_ORIGIN ?? true,
  credentials: true,  // Allow cookies
});
```

**Development**: All origins allowed
**Production**: Specify `FRONTEND_ORIGIN` in environment variables

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (auth required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |

## Testing with cURL

### Registerr

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}' \
  -c cookies.txt
```

### Loginn

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

### Get Profile (with cookie)

```bash
curl http://localhost:4000/auth/profile \
  -b cookies.txt
```

### Create Gamee

```bash
curl -X POST http://localhost:4000/games \
  -H "Content-Type: application/json" \
  -d '{"characterSetId":"<uuid>","hostUsername":"Player 1"}' \
  -b cookies.txt
```

## Testing with Postman

1. Import the API endpoints
2. Set up environment variables:
   - `baseUrl`: `http://localhost:4000`
3. Enable "Send cookies with requests" in settings
4. Test authentication flow:
   - Register → Login → Get Profile → Logout

---

**Related Documentation**:

- [Socket.IO Events](./socket-events.md)
- [Shared Types](./types.md)
- [Backend Architecture](../backend/README.md)
