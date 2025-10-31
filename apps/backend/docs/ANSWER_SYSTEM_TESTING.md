# Answer System Testing Guide

## Overview

This document describes how to manually test the answer submission system implemented in Phase 3.2.

## Prerequisites

1. Start the backend server: `pnpm --filter @whois-it/backend dev`
2. Ensure PostgreSQL is running and seeded with data: `pnpm seed`

## Testing Flow

### 1. Create a Game

```bash
curl -X POST http://localhost:4000/games \
  -H "Content-Type: application/json" \
  -d '{
    "characterSetId": "<CHARACTER_SET_ID>",
    "hostUsername": "Player1",
    "maxPlayers": 4,
    "turnTimerSeconds": 60
  }'
```

Response will include `roomCode` (e.g., "ABC12")

### 2. Join the Game

```bash
curl -X POST http://localhost:4000/games/ABC12/join \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Player2"
  }'
```

Repeat for Player3, Player4, etc.

### 3. Mark All Players as Ready

For each player, use Socket.IO client or curl to update ready state:

```bash
# Via REST API (update via Socket.IO in real app)
# Players need to connect via Socket.IO and call updatePlayerReady
```

### 4. Start the Game

```bash
curl -X POST http://localhost:4000/games/ABC12/start
```

This will:
- Change game status to `in_progress`
- Create the first round
- Assign secret characters to players
- Set the first player as active

### 5. Get Game State

```bash
curl http://localhost:4000/games/ABC12/state
```

Response includes:
- `currentRoundNumber`: 1
- `currentRoundState`: "awaiting_question"
- `activePlayerId`: ID of the player whose turn it is
- `activePlayerUsername`: Username of active player

### 6. Ask a Question

```bash
curl -X POST http://localhost:4000/games/ABC12/questions \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "<ACTIVE_PLAYER_ID>",
    "targetPlayerId": "<TARGET_PLAYER_ID>",
    "questionText": "Does your character have glasses?",
    "category": "trait",
    "answerType": "boolean"
  }'
```

Response includes the question details. The round state changes to `awaiting_answer`.

### 7. Submit an Answer

```bash
curl -X POST http://localhost:4000/games/ABC12/answers \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "<TARGET_PLAYER_ID>",
    "questionId": "<QUESTION_ID>",
    "answerValue": "yes"
  }'
```

Expected Response:
```json
{
  "id": "answer-uuid",
  "questionId": "question-uuid",
  "answeredByPlayerId": "player-uuid",
  "answeredByPlayerUsername": "Player2",
  "answerValue": "yes",
  "answeredAt": "2025-10-31T14:00:00.000Z"
}
```

After submission:
- The round state changes back to `awaiting_question`
- The `activePlayer` advances to the next player in turn order

### 8. Verify Round Advancement

```bash
curl http://localhost:4000/games/ABC12/state
```

Verify:
- `currentRoundState` is now "awaiting_question"
- `activePlayerId` is the next player in the rotation
- The turn has advanced

## Socket.IO Events

When testing with a Socket.IO client:

1. **Connect to room:**
   ```javascript
   socket.emit('joinRoom', { roomCode: 'ABC12', playerId: 'player-id' }, (response) => {
     console.log(response);
   });
   ```

2. **Listen for events:**
   ```javascript
   socket.on('questionAsked', (event) => {
     console.log('Question asked:', event);
   });

   socket.on('answerSubmitted', (event) => {
     console.log('Answer submitted:', event);
     console.log('New game state:', event.gameState);
   });
   ```

## Validation Tests

### Valid Answer Submission

✅ Targeted player can answer their own question
✅ Answer value must be one of: "yes", "no", "unsure"
✅ Round state advances after answer submission
✅ Next player becomes active

### Error Cases

❌ Non-targeted player tries to answer: `400 Bad Request - Only the targeted player can answer this question`
❌ Player tries to answer their own question (no target specified): `400 Bad Request - Cannot answer your own question`
❌ Answer submitted in wrong round state: `400 Bad Request - Cannot submit answer in round state: awaiting_question`
❌ Question already answered: `400 Bad Request - Question has already been answered`
❌ Game not in progress: `400 Bad Request - Game is not in progress`
❌ Invalid answer value: `400 Bad Request - answerValue must be one of: yes, no, unsure`

## Next Steps

For production testing:
1. Set up e2e test suite with Test.createTestingModule
2. Create test database with fixtures
3. Automate the full gameplay flow
4. Add Socket.IO integration tests
5. Test reconnection scenarios
