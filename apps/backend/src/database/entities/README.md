# Database Entities

This directory contains all TypeORM entity definitions for the WhoIsIt application. Each entity represents a database table and defines the schema, relationships, and constraints.

## Entity Overview

### Core Entities

#### User (`user.entity.ts`)

Represents a registered user account.

**Key Fields**:
- `id` (UUID) - Primary key
- `email` (string) - Unique, required
- `username` (string) - Required
- `password` (string) - Hashed with bcrypt
- `isEmailVerified` (boolean) - Default false
- `emailVerificationToken` (string) - Nullable
- `passwordResetToken` (string) - Nullable
- `passwordResetExpires` (Date) - Nullable

**Relationships**:
- One-to-one with `PlayerStats`
- One-to-many with `Game` (as host)
- One-to-many with `GamePlayer` (through PlayerStats)

**Indexes**:
- Unique index on `email`

**Use Cases**:
- User authentication and authorization
- Profile management
- Game hosting
- Email verification and password reset

---

#### PlayerStats (`player-stats.entity.ts`)

Stores player statistics and game history. Can be linked to a User or represent a guest player.

**Key Fields**:
- `id` (UUID) - Primary key
- `userId` (UUID) - Foreign key, nullable (null for guests)
- `gamesPlayed` (number) - Default 0
- `gamesWon` (number) - Default 0
- `totalQuestionsAsked` (number) - Default 0
- `totalGuesses` (number) - Default 0
- `correctGuesses` (number) - Default 0

**Relationships**:
- Many-to-one with `User` (nullable for guests)
- One-to-many with `GamePlayer`

**Use Cases**:
- Track player performance metrics
- Support both authenticated users and guests
- Leaderboards and rankings
- Player profile statistics

---

#### Game (`game.entity.ts`)

Represents a game session from creation to completion.

**Key Fields**:
- `id` (UUID) - Primary key
- `roomCode` (string) - Unique 5-character code
- `status` (GameStatus enum) - lobby/playing/finished/cancelled
- `hostId` (UUID) - Foreign key to User
- `characterSetId` (UUID) - Foreign key to CharacterSet
- `winnerId` (UUID) - Foreign key to User, nullable
- `startedAt` (Date) - Nullable
- `finishedAt` (Date) - Nullable

**Relationships**:
- Many-to-one with `User` (as host)
- Many-to-one with `User` (as winner)
- Many-to-one with `CharacterSet`
- One-to-many with `GamePlayer`
- One-to-many with `Round`
- One-to-many with `GameEvent`
- One-to-many with `Guess`
- One-to-one with `GameConfigSnapshot`

**Indexes**:
- Unique index on `roomCode`
- Index on `status` for filtering

**Use Cases**:
- Game lifecycle management
- Room code-based game joining
- Track game progress and outcomes
- Query active/completed games

---

### Character Management

#### CharacterSet (`character-set.entity.ts`)

Defines a collection of characters for use in games.

**Key Fields**:
- `id` (UUID) - Primary key
- `name` (string) - Required
- `description` (string) - Nullable
- `imageUrl` (string) - Nullable
- `isActive` (boolean) - Default true

**Relationships**:
- One-to-many with `Character`
- One-to-many with `Game`

**Use Cases**:
- Define themed character collections
- Enable/disable character sets
- Display character set options in lobby

---

#### Character (`character.entity.ts`)

Individual character within a character set.

**Key Fields**:
- `id` (UUID) - Primary key
- `characterSetId` (UUID) - Foreign key
- `name` (string) - Required
- `imageUrl` (string) - Required
- `attributes` (JSON) - Character traits/properties

**Relationships**:
- Many-to-one with `CharacterSet`
- One-to-many with `PlayerSecret`
- One-to-many with `Guess`

**Use Cases**:
- Store character details and images
- Assign secret characters to players
- Validate guesses
- Display character grid in UI

---

### Gameplay Entities

#### Round (`round.entity.ts`)

Represents a single round of gameplay within a game.

**Key Fields**:
- `id` (UUID) - Primary key
- `gameId` (UUID) - Foreign key
- `roundNumber` (number) - Sequential
- `currentTurnPlayerId` (UUID) - Foreign key to GamePlayer
- `status` (RoundStatus enum) - active/completed

**Relationships**:
- Many-to-one with `Game`
- Many-to-one with `GamePlayer` (current turn)
- One-to-many with `Question`

**Use Cases**:
- Track whose turn it is
- Organize questions by round
- Manage turn rotation
- Track round completion

---

#### Question (`question.entity.ts`)

A yes/no question asked by a player during their turn.

**Key Fields**:
- `id` (UUID) - Primary key
- `roundId` (UUID) - Foreign key
- `askedByPlayerId` (UUID) - Foreign key to GamePlayer
- `questionText` (string) - Required
- `askedAt` (Date) - Timestamp

**Relationships**:
- Many-to-one with `Round`
- Many-to-one with `GamePlayer` (asker)
- One-to-one with `Answer`

**Use Cases**:
- Store question history
- Display asked questions
- Link to corresponding answers
- Calculate statistics

---

#### Answer (`answer.entity.ts`)

The answer to a question (yes/no/maybe).

**Key Fields**:
- `id` (UUID) - Primary key
- `questionId` (UUID) - Foreign key
- `answeredByPlayerId` (UUID) - Foreign key to GamePlayer
- `answerValue` (AnswerValue enum) - yes/no/maybe
- `answeredAt` (Date) - Timestamp

**Relationships**:
- One-to-one with `Question`
- Many-to-one with `GamePlayer` (answerer)

**Use Cases**:
- Record answer to question
- Display question-answer pairs
- Track answer patterns

---

#### Guess (`guess.entity.ts`)

A player's guess of their opponent's secret character.

**Key Fields**:
- `id` (UUID) - Primary key
- `gameId` (UUID) - Foreign key
- `playerId` (UUID) - Foreign key to GamePlayer
- `characterId` (UUID) - Foreign key to Character
- `isCorrect` (boolean) - Required
- `guessedAt` (Date) - Timestamp

**Relationships**:
- Many-to-one with `Game`
- Many-to-one with `GamePlayer`
- Many-to-one with `Character`

**Use Cases**:
- Determine game winner
- Track guess accuracy
- End game on correct/incorrect guess
- Calculate player statistics

---

#### PlayerSecret (`player-secret.entity.ts`)

Links a player to their secret character in a game.

**Key Fields**:
- `id` (UUID) - Primary key
- `gamePlayerId` (UUID) - Foreign key, unique
- `characterId` (UUID) - Foreign key

**Relationships**:
- One-to-one with `GamePlayer`
- Many-to-one with `Character`

**Use Cases**:
- Assign secret characters at game start
- Validate guesses
- Reveal character at game end
- Prevent players from seeing their own secret

---

#### PlayerPanel (`player-panel.entity.ts`)

Tracks which characters a player has eliminated on their board.

**Key Fields**:
- `id` (UUID) - Primary key
- `gamePlayerId` (UUID) - Foreign key, unique
- `eliminatedCharacters` (UUID[]) - Array of character IDs

**Relationships**:
- One-to-one with `GamePlayer`

**Use Cases**:
- Track player's deduction progress
- Persist eliminated characters
- Sync panel state across devices
- Display eliminated characters in UI

---

### Player Participation

#### GamePlayer (`game-player.entity.ts`)

Represents a player's participation in a specific game.

**Key Fields**:
- `id` (UUID) - Primary key
- `gameId` (UUID) - Foreign key
- `playerStatsId` (UUID) - Foreign key
- `isReady` (boolean) - Default false (lobby status)
- `hasLeft` (boolean) - Default false

**Relationships**:
- Many-to-one with `Game`
- Many-to-one with `PlayerStats`
- One-to-one with `PlayerSecret`
- One-to-one with `PlayerPanel`
- One-to-many with `Question` (as asker)
- One-to-many with `Answer` (as answerer)
- One-to-many with `Guess`

**Use Cases**:
- Link players to games
- Track ready status in lobby
- Manage player lifecycle in game
- Query player's games and statistics

---

### Auxiliary Entities

#### GameEvent (`game-event.entity.ts`)

Audit log of significant game events.

**Key Fields**:
- `id` (UUID) - Primary key
- `gameId` (UUID) - Foreign key
- `eventType` (string) - Event category
- `eventData` (JSON) - Event payload
- `createdAt` (Date) - Timestamp

**Relationships**:
- Many-to-one with `Game`

**Use Cases**:
- Audit trail for debugging
- Game replay functionality
- Analytics and reporting
- Detect suspicious activity

---

#### GameInvite (`game-invite.entity.ts`)

Tracks game invitations (future feature).

**Key Fields**:
- `id` (UUID) - Primary key
- `gameId` (UUID) - Foreign key
- `invitedByUserId` (UUID) - Foreign key
- `inviteCode` (string) - Unique code
- `expiresAt` (Date) - Expiration timestamp

**Relationships**:
- Many-to-one with `Game`
- Many-to-one with `User` (inviter)

**Use Cases**:
- Send game invites to specific users
- Track invite acceptance
- Expire old invites
- Prevent invite abuse

---

#### GameConfigSnapshot (`game-config-snapshot.entity.ts`)

Stores game configuration at creation time.

**Key Fields**:
- `id` (UUID) - Primary key
- `gameId` (UUID) - Foreign key, unique
- `config` (JSON) - Configuration data

**Relationships**:
- One-to-one with `Game`

**Use Cases**:
- Preserve game settings
- Replay games with original settings
- Audit configuration changes
- Support game variants

---

## Entity Relationships Diagram

```
User ─┬─ one-to-one ──── PlayerStats
      │
      ├─ one-to-many ──── Game (as host)
      │
      └─ one-to-many ──── Game (as winner)

PlayerStats ── one-to-many ──── GamePlayer

Game ─┬─ one-to-many ──── GamePlayer
      │
      ├─ one-to-many ──── Round
      │
      ├─ one-to-many ──── GameEvent
      │
      ├─ one-to-many ──── Guess
      │
      ├─ one-to-one ───── GameConfigSnapshot
      │
      └─ many-to-one ──── CharacterSet

CharacterSet ── one-to-many ──── Character

Character ─┬─ one-to-many ──── PlayerSecret
           │
           └─ one-to-many ──── Guess

GamePlayer ─┬─ one-to-one ──── PlayerSecret
            │
            ├─ one-to-one ──── PlayerPanel
            │
            ├─ one-to-many ─── Question (as asker)
            │
            ├─ one-to-many ─── Answer (as answerer)
            │
            └─ one-to-many ─── Guess

Round ── one-to-many ──── Question

Question ── one-to-one ──── Answer
```

## Best Practices

### Creating Entities

- Use `@PrimaryGeneratedColumn('uuid')` for all primary keys
- Include `@CreateDateColumn()` and `@UpdateDateColumn()` where appropriate
- Define relationships with proper cascade options
- Use enums for fixed value sets
- Validate data with class-validator decorators

### Querying Entities

- Use repository pattern
- Select only needed columns
- Use eager/lazy loading appropriately
- Add indexes for frequently queried fields
- Use query builder for complex queries

### Modifying Entities

- Never modify existing migrations
- Generate new migration for schema changes
- Test migrations on development database
- Consider backward compatibility
- Update seed data if needed

## Testing

Each entity should have:

- Unit tests for validation
- Relationship tests
- Constraint tests
- Default value tests

## Common Queries

### Find active games
```typescript
gameRepository.find({
  where: { status: GameStatus.Playing },
  relations: ['players', 'characterSet'],
});
```

### Get player statistics
```typescript
playerStatsRepository.findOne({
  where: { userId },
  relations: ['gamePlayers'],
});
```

### Get game with full details
```typescript
gameRepository.findOne({
  where: { roomCode },
  relations: [
    'players',
    'players.playerStats',
    'rounds',
    'rounds.questions',
    'rounds.questions.answer',
  ],
});
```

## Future Enhancements

- Add soft delete functionality
- Implement versioning for entities
- Add more comprehensive audit logging
- Add entity caching layer
- Implement database sharding strategy
