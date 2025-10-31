# Phase 4 Implementation: Backend - Système de Rounds et Scoring

**Date**: October 31, 2025  
**Status**: ✅ Complete

## Overview

This document describes the implementation of Phase 4 (Backend - Système de Rounds et Scoring) from the project roadmap. This phase implements the core gameplay mechanics including questions, answers, guesses, round advancement, and scoring.

## Implemented Features

### 1. Socket.IO Event Types for Gameplay

Added comprehensive type definitions in `packages/contracts/index.d.ts`:

#### New Request/Response Types
- `AskQuestionRequest` / `QuestionResponse`
- `SubmitAnswerRequest` / `AnswerResponse`
- `MakeGuessRequest` / `GuessResponse`
- `RoundResponse`
- `PlayerScore`
- `GameOverResult`

#### New Socket.IO Events
- `questionAsked` - Broadcasted when a player asks a question
- `answerSubmitted` - Broadcasted when a player submits an answer
- `guessResult` - Broadcasted when a player makes a guess
- `roundEnded` - Broadcasted when a round ends
- `gameOver` - Broadcasted when the game ends with final results

### 2. REST API Endpoints

Added three new endpoints in `GameController`:

#### POST /games/:roomCode/questions
Ask a question during gameplay.
- Validates it's the player's turn
- Validates round state is awaiting question
- Creates and saves the question
- Updates round state to awaiting answer
- Broadcasts `questionAsked` event

**Request Body:**
```typescript
{
  playerId: string;
  targetPlayerId?: string;
  questionText: string;
  category: "trait" | "direct" | "meta";
  answerType: "boolean" | "text";
}
```

#### POST /games/:roomCode/answers
Submit an answer to a question.
- Validates the player is authorized to answer
- Creates and saves the answer
- Advances to the next player's turn
- Broadcasts `answerSubmitted` event

**Request Body:**
```typescript
{
  playerId: string;
  questionId: string;
  answerValue: "yes" | "no" | "unsure";
  answerText?: string;
  latencyMs?: number;
}
```

#### POST /games/:roomCode/guesses
Make a guess about a character.
- Validates it's the player's turn
- Checks if the guess is correct
- Eliminates player if incorrect
- Ends game if correct
- Broadcasts `guessResult` event
- Broadcasts `gameOver` event if game ends

**Request Body:**
```typescript
{
  playerId: string;
  targetPlayerId?: string;
  targetCharacterId: string;
  latencyMs?: number;
}
```

### 3. Game Service Methods

Added comprehensive gameplay logic in `GameService`:

#### askQuestion()
- Validates game state and player turn
- Creates question entity
- Updates round state

#### submitAnswer()
- Validates authorization
- Creates answer entity based on player's secret character
- Calls `advanceRound()` to move to next turn

#### makeGuess()
- Validates player turn
- Checks guess correctness against player's secret
- Handles player elimination or victory
- Calls `advanceRound()` or ends game

#### checkGameOver()
- Calculates scores for all players
- Score formula: `correctGuesses * 100 - incorrectGuesses * 50`
- Returns winner and detailed statistics

#### advanceRound() (private)
- Determines next active player
- Closes current round
- Creates new round with next player
- Handles end-game scenarios (1 player left, no players)

### 4. Round Management

Enhanced round system with proper state machine:
- `AWAITING_QUESTION` - Waiting for active player to ask a question
- `AWAITING_ANSWER` - Waiting for target player to answer
- `AWAITING_GUESS` - Waiting for a guess (optional state)
- `CLOSED` - Round is complete

Rounds automatically advance after each answer or incorrect guess.

### 5. Scoring System

Implemented comprehensive scoring:
- Tracks questions asked per player
- Tracks correct and incorrect guesses
- Calculates final scores based on performance
- Determines winner by highest score
- Tracks game duration and total rounds

### 6. GameGateway Broadcast Methods

Added real-time event broadcasting:
- `broadcastQuestionAsked()` - Notifies all players of new question
- `broadcastAnswerSubmitted()` - Notifies all players of answer
- `broadcastGuessResult()` - Notifies all players of guess result
- `broadcastGameOver()` - Notifies all players of game end and results

### 7. Database Entities Updated

Enhanced module dependencies in `game.module.ts`:
- Added `Question` repository
- Added `Answer` repository  
- Added `Guess` repository

All entities properly configured with TypeORM relationships.

## Testing

### Test Coverage

Added comprehensive test suite in `game.service.spec.ts`:

#### askQuestion Tests (3 tests)
- ✅ Should successfully ask a question
- ✅ Should throw NotFoundException if game not found
- ✅ Should throw BadRequestException if not player turn

#### submitAnswer Tests (2 tests)
- ✅ Should successfully submit an answer
- ✅ Should throw NotFoundException if question not found

#### makeGuess Tests (3 tests)
- ✅ Should successfully make a correct guess
- ✅ Should eliminate player on incorrect guess
- ✅ Should throw NotFoundException if character not found

#### checkGameOver Tests (2 tests)
- ✅ Should return null if game not completed
- ✅ Should return game over result with scores

### Test Results

**Total Tests**: 133/133 passing ✅
- Previous tests: 123
- New tests: 10
- All tests passing with no regressions

### Build & Lint

- ✅ Backend builds successfully
- ✅ All ESLint rules pass
- ✅ No TypeScript compilation errors

## API Usage Examples

### Starting a Game and Playing

```typescript
// 1. Start the game (triggers gameStarted event)
POST /games/ABC12/start

// 2. Player 1 asks a question
POST /games/ABC12/questions
{
  "playerId": "player-1",
  "targetPlayerId": "player-2",
  "questionText": "Does your character have brown hair?",
  "category": "trait",
  "answerType": "boolean"
}
// Broadcasts: questionAsked event

// 3. Player 2 answers the question
POST /games/ABC12/answers
{
  "playerId": "player-2",
  "questionId": "question-1",
  "answerValue": "yes"
}
// Broadcasts: answerSubmitted event
// Automatically advances to next player's turn

// 4. Player 1 makes a guess
POST /games/ABC12/guesses
{
  "playerId": "player-1",
  "targetPlayerId": "player-2",
  "targetCharacterId": "char-5"
}
// Broadcasts: guessResult event
// If correct: broadcasts gameOver event with results
// If incorrect: player is eliminated, game continues
```

## Game Flow

```
Game Started
     ↓
Player Turn (AWAITING_QUESTION)
     ↓
Player Asks Question
     ↓
Round State → AWAITING_ANSWER
     ↓
Target Player Answers
     ↓
Round Advances → Next Player's Turn
     ↓
[Repeat until someone guesses correctly or only 1 player remains]
     ↓
Game Over (COMPLETED)
     ↓
Calculate & Broadcast Scores
```

## Changes to Existing Code

### Modified Files
1. `packages/contracts/index.d.ts` - Added gameplay types and Socket events
2. `apps/backend/src/game/game.module.ts` - Added Question, Answer, Guess repositories
3. `apps/backend/src/game/game.controller.ts` - Added 3 new endpoints
4. `apps/backend/src/game/game.service.ts` - Added gameplay methods
5. `apps/backend/src/game/game.gateway.ts` - Added broadcast methods
6. `apps/backend/src/game/game.service.spec.ts` - Added comprehensive tests

### No Breaking Changes
All existing functionality remains intact. New features are additive only.

## Future Enhancements

Potential improvements for future phases:

1. **Timer System**: Implement turn timers with automatic forfeit
2. **Question History**: Add endpoint to retrieve question/answer history
3. **Player Statistics**: Track long-term player stats across games
4. **Rematch**: Allow players to start a new game with same settings
5. **Spectator Mode**: Allow users to watch ongoing games
6. **Question Validation**: Validate questions against character traits
7. **Answer AI**: Auto-answer questions for AI-controlled players

## Conclusion

Phase 4 successfully implements the core gameplay mechanics for the WhoIsIt game. The system now supports:
- ✅ Complete question/answer flow
- ✅ Guessing and victory/elimination logic
- ✅ Automatic round advancement
- ✅ Score calculation and game over detection
- ✅ Real-time Socket.IO event broadcasting
- ✅ Comprehensive test coverage

The game is now playable from start to finish with proper state management, scoring, and real-time updates.
