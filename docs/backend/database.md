# Database Schema and Entities

## Overview

WhoIsIt uses **PostgreSQL** as its primary database with **TypeORM** as the ORM. The schema is designed to support multi-player games with real-time tracking of questions, answers, guesses, and game events.

## Entity Relationship Diagram

```text
┌─────────────┐
│    User     │◄────┐
└──────┬──────┘     │
       │            │
       │ hostedGames│
       │            │
       ▼            │
┌─────────────┐    │host
│    Game     │────┘
└──────┬──────┘
       │
       │ players
       │
       ▼
┌─────────────┐     ┌──────────────┐
│ GamePlayer  │────►│ PlayerSecret │
└──────┬──────┘     └──────────────┘
       │
       │ askedQuestions
       │
       ▼
┌─────────────┐
│  Question   │
└──────┬──────┘
       │
       │ answer
       │
       ▼
┌─────────────┐
│   Answer    │
└─────────────┘

┌──────────────┐
│CharacterSet  │
└──────┬───────┘
       │
       │ characters
       │
       ▼
┌──────────────┐
│  Character   │
└──────────────┘
```

## Core Entities

### User Entity

**Table**: `users`

Represents both registered users and guest users in the system.

```typescript
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;                      // UUID primary key

  @Column({ unique: true })
  email?: string | null;           // Email (nullable for guests)

  @Column({ unique: true })
  username: string;                // Display name

  @Column()
  avatarUrl?: string | null;       // Avatar URL

  @Column()
  passwordHash?: string | null;    // Hashed password (null for guests)

  @Column()
  locale?: string | null;          // Preferred language (en, fr)

  @Column({ default: false })
  isGuest: boolean;                // Guest user flag

  @Column({ default: false })
  emailVerified: boolean;          // Email verification status

  @Column()
  verificationToken?: string | null;  // Email verification token

  @Column({ type: 'timestamptz' })
  verificationTokenExpiresAt?: Date | null;  // Token expiry

  @Column()
  passwordResetToken?: string | null;  // Password reset token

  @Column({ type: 'timestamptz' })
  passwordResetTokenExpiresAt?: Date | null;  // Token expiry

  @CreateDateColumn()
  createdAt: Date;                 // Account creation timestamp

  @UpdateDateColumn()
  updatedAt: Date;                 // Last update timestamp

  @Column({ type: 'timestamptz' })
  lastSeenAt?: Date | null;        // Last activity timestamp

  // Relationships
  @OneToMany(() => CharacterSet, set => set.createdBy)
  characterSets: CharacterSet[];   // Created character sets

  @OneToMany(() => Game, game => game.host)
  hostedGames: Game[];             // Games hosted by this user

  @OneToMany(() => Game, game => game.winner)
  wonGames: Game[];                // Games won by this user

  @OneToMany(() => GamePlayer, player => player.user)
  gamePlayers: GamePlayer[];       // Game participations

  @OneToOne(() => PlayerStats, stats => stats.user)
  stats: PlayerStats;              // Player statistics
}
```

**Indexes**:

- `email` (unique)
- `username` (unique)
- `lastSeenAt` (for activity queries)

**Key Features**:

- **Guest Support**: `isGuest` flag for anonymous players
- **Email Verification**: Token-based verification workflow
- **Password Reset**: Secure token-based reset
- **Soft User Data**: Nullable fields for guest users

### Game Entity

**Table**: `games`

Represents a game session from creation to completion.

```typescript
@Entity({ name: 'games' })
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;                      // UUID primary key

  @Column({ unique: true })
  roomCode: string;                // 6-character room code (e.g., "ABC123")

  @ManyToOne(() => User)
  @JoinColumn({ name: 'host_user_id' })
  host?: User | null;              // Game host (nullable)

  @ManyToOne(() => CharacterSet)
  @JoinColumn({ name: 'character_set_id' })
  characterSet: CharacterSet;      // Character set used

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.LOBBY,
  })
  status: GameStatus;              // Current game status

  @Column({
    type: 'enum',
    enum: GameVisibility,
    default: GameVisibility.PRIVATE,
  })
  visibility: GameVisibility;      // Public or private

  @Column({ type: 'int' })
  turnTimerSeconds?: number | null; // Turn timer duration

  @Column({ type: 'jsonb', default: {} })
  ruleConfig: Record<string, unknown>;  // Custom game rules

  @CreateDateColumn()
  createdAt: Date;                 // Game creation timestamp

  @Column({ type: 'timestamptz' })
  startedAt?: Date | null;         // Game start timestamp

  @Column({ type: 'timestamptz' })
  endedAt?: Date | null;           // Game end timestamp

  @ManyToOne(() => User)
  @JoinColumn({ name: 'winner_user_id' })
  winner?: User | null;            // Winning user

  // Relationships
  @OneToMany(() => GamePlayer, player => player.game)
  players: GamePlayer[];           // Players in this game

  @OneToMany(() => GameInvite, invite => invite.game)
  invites: GameInvite[];           // Game invitations

  @OneToMany(() => Round, round => round.game)
  rounds: Round[];                 // Game rounds

  @OneToMany(() => GameEvent, event => event.game)
  events: GameEvent[];             // Game events log

  @OneToMany(() => GameConfigSnapshot, snapshot => snapshot.game)
  configSnapshots: GameConfigSnapshot[];  // Config snapshots
}
```

**Enums**:

```typescript
enum GameStatus {
  LOBBY = 'lobby',           // Waiting for players
  IN_PROGRESS = 'in_progress', // Game active
  COMPLETED = 'completed',   // Game finished normally
  ABORTED = 'aborted',       // Game terminated early
}

enum GameVisibility {
  PUBLIC = 'public',         // Listed in public lobbies
  PRIVATE = 'private',       // Join by room code only
}
```

**Indexes**:

- `roomCode` (unique)
- `status` (for filtering active games)

**Key Features**:

- **Room Code**: Unique 6-character code for joining
- **Flexible Rules**: JSONB column for custom configurations
- **Time Tracking**: Creation, start, and end timestamps
- **Host Ownership**: Optional host relationship

### GamePlayer Entity

**Table**: `game_players`

Represents a player's participation in a specific game.

```typescript
@Entity({ name: 'game_players' })
export class GamePlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;                      // UUID primary key

  @ManyToOne(() => Game)
  @JoinColumn({ name: 'game_id' })
  game: Game;                      // Associated game

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User | null;              // Associated user (nullable for guests)

  @Column()
  username: string;                // Display name in game

  @Column()
  avatarUrl?: string | null;       // Avatar URL

  @Column({
    type: 'enum',
    enum: GamePlayerRole,
    default: GamePlayerRole.PLAYER,
  })
  role: GamePlayerRole;            // Player role

  @Column({ type: 'int' })
  seatOrder?: number | null;       // Turn order position

  @Column({ default: false })
  isReady: boolean;                // Ready to start flag

  @CreateDateColumn()
  joinedAt: Date;                  // Join timestamp

  @Column({ type: 'timestamptz' })
  leftAt?: Date | null;            // Leave timestamp

  @Column()
  reconnectToken?: string | null;  // Reconnection token

  @Column()
  lastSocketId?: string | null;    // Last WebSocket ID

  @Column({ type: 'int', default: 0 })
  score: number;                   // Current score

  @Column({ type: 'int' })
  placement?: number | null;       // Final placement (1st, 2nd, etc.)

  // Relationships
  @OneToOne(() => PlayerSecret, secret => secret.player)
  secret: PlayerSecret;            // Secret character assignment

  @OneToMany(() => Round, round => round.activePlayer)
  activeRounds: Round[];           // Rounds where player is active

  @OneToMany(() => Question, q => q.askedBy)
  askedQuestions: Question[];      // Questions asked

  @OneToMany(() => Question, q => q.targetPlayer)
  targetedQuestions: Question[];   // Questions received

  @OneToMany(() => Answer, a => a.answeredBy)
  answers: Answer[];               // Answers submitted

  @OneToMany(() => Guess, g => g.guessedBy)
  guesses: Guess[];                // Guesses made

  @OneToMany(() => Guess, g => g.targetPlayer)
  incomingGuesses: Guess[];        // Guesses about this player

  @OneToMany(() => GameEvent, e => e.actor)
  events: GameEvent[];             // Events triggered by player

  @OneToMany(() => PlayerPanel, p => p.player)
  panels: PlayerPanel[];           // Character panels
}
```

**Enums**:

```typescript
enum GamePlayerRole {
  HOST = 'host',           // Game host
  PLAYER = 'player',       // Regular player
  SPECTATOR = 'spectator', // Observer only
}
```

**Indexes**:

- `game_id` (for game lookups)

**Key Features**:

- **Guest Support**: Nullable user relationship
- **Reconnection**: Token-based reconnection support
- **Score Tracking**: Real-time score updates
- **Role-Based**: Different permissions per role
- **Socket Tracking**: Last socket ID for connections

### CharacterSet Entity

**Table**: `character_sets`

Collection of characters used in games.

```typescript
@Entity({ name: 'character_sets' })
export class CharacterSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;                      // UUID primary key

  @Column()
  name: string;                    // Display name

  @Column({ unique: true })
  slug: string;                    // URL-friendly identifier

  @Column()
  description?: string | null;     // Set description

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User | null;         // Creator

  @Column({
    type: 'enum',
    enum: GameVisibility,
    default: GameVisibility.PRIVATE,
  })
  visibility: GameVisibility;      // Public or private

  @Column({ default: false })
  isDefault: boolean;              // Default set flag

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;  // Additional data

  @CreateDateColumn()
  createdAt: Date;                 // Creation timestamp

  // Relationships
  @OneToMany(() => Character, char => char.set)
  characters: Character[];         // Characters in this set

  @OneToMany(() => Game, game => game.characterSet)
  games: Game[];                   // Games using this set

  @OneToMany(() => GameConfigSnapshot, snap => snap.characterSet)
  configSnapshots: GameConfigSnapshot[];  // Snapshots
}
```

**Indexes**:

- `slug` (unique)

**Key Features**:

- **Default Sets**: System-provided character sets
- **Custom Sets**: User-created sets
- **Visibility**: Public for sharing, private for personal use
- **Metadata**: Extensible JSON storage

### Character Entity

**Table**: `characters`

Individual characters within a set.

```typescript
@Entity({ name: 'characters' })
export class Character {
  @PrimaryGeneratedColumn('uuid')
  id: string;                      // UUID primary key

  @ManyToOne(() => CharacterSet)
  @JoinColumn({ name: 'set_id' })
  set: CharacterSet;               // Parent character set

  @Column()
  name: string;                    // Character name

  @Column()
  slug: string;                    // URL-friendly identifier

  @Column()
  imageUrl?: string | null;        // Character image

  @Column()
  summary?: string | null;         // Character description

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;  // Attributes, traits, etc.

  @Column({ default: true })
  isActive: boolean;               // Active/inactive flag

  @CreateDateColumn()
  createdAt: Date;                 // Creation timestamp

  // Relationships
  @OneToMany(() => PlayerSecret, secret => secret.character)
  secrets: PlayerSecret[];         // Secret assignments

  @OneToMany(() => PlayerPanel, panel => panel.character)
  panels: PlayerPanel[];           // Panel states

  @OneToMany(() => Guess, guess => guess.targetCharacter)
  guesses: Guess[];                // Guesses about this character
}
```

**Indexes**:

- `(set_id, slug)` (unique composite)

**Key Features**:

- **Rich Metadata**: JSONB for character attributes
- **Image Support**: Character portraits
- **Active Status**: Enable/disable characters
- **Unique Within Set**: Slug unique per character set

## Game Mechanics Entities

### Round Entity

**Table**: `rounds`

Represents a turn in the game.

```typescript
@Entity({ name: 'rounds' })
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Game)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({ type: 'int' })
  roundNumber: number;             // Sequential round number

  @ManyToOne(() => GamePlayer)
  @JoinColumn({ name: 'active_player_id' })
  activePlayer: GamePlayer;        // Current turn player

  @Column({
    type: 'enum',
    enum: RoundState,
  })
  state: RoundState;               // Current round state

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamptz' })
  endedAt?: Date | null;

  // Relationships
  @OneToMany(() => Question, q => q.round)
  questions: Question[];

  @OneToMany(() => Guess, g => g.round)
  guesses: Guess[];
}
```

**Enums**:

```typescript
enum RoundState {
  AWAITING_QUESTION = 'awaiting_question',
  AWAITING_ANSWER = 'awaiting_answer',
  AWAITING_GUESS = 'awaiting_guess',
  CLOSED = 'closed',
}
```

### Question Entity

**Table**: `questions`

Questions asked during gameplay.

```typescript
@Entity({ name: 'questions' })
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Round)
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @ManyToOne(() => GamePlayer)
  @JoinColumn({ name: 'asked_by_id' })
  askedBy: GamePlayer;             // Player asking

  @ManyToOne(() => GamePlayer)
  @JoinColumn({ name: 'target_player_id' })
  targetPlayer?: GamePlayer | null; // Target player (optional)

  @Column({ type: 'text' })
  questionText: string;            // Question content

  @CreateDateColumn()
  askedAt: Date;

  // Relationships
  @OneToOne(() => Answer, answer => answer.question)
  answer?: Answer;
}
```

### Answer Entity

**Table**: `answers`

Answers to questions.

```typescript
@Entity({ name: 'answers' })
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => GamePlayer)
  @JoinColumn({ name: 'answered_by_id' })
  answeredBy: GamePlayer;          // Player answering

  @Column({
    type: 'enum',
    enum: AnswerValue,
  })
  answerValue: AnswerValue;        // Yes/No/Unsure

  @Column({ type: 'text' })
  answerText?: string | null;      // Additional explanation

  @Column({ type: 'int' })
  latencyMs?: number | null;       // Response time

  @CreateDateColumn()
  answeredAt: Date;
}
```

**Enums**:

```typescript
enum AnswerValue {
  YES = 'yes',
  NO = 'no',
  UNSURE = 'unsure',
}
```

### Guess Entity

**Table**: `guesses`

Player guesses about characters.

```typescript
@Entity({ name: 'guesses' })
export class Guess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Round)
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @ManyToOne(() => GamePlayer)
  @JoinColumn({ name: 'guessed_by_id' })
  guessedBy: GamePlayer;           // Player guessing

  @ManyToOne(() => GamePlayer)
  @JoinColumn({ name: 'target_player_id' })
  targetPlayer?: GamePlayer | null; // Target player

  @ManyToOne(() => Character)
  @JoinColumn({ name: 'target_character_id' })
  targetCharacter: Character;      // Guessed character

  @Column({ type: 'boolean' })
  isCorrect: boolean;              // Guess result

  @Column({ type: 'int' })
  latencyMs?: number | null;       // Response time

  @CreateDateColumn()
  guessedAt: Date;
}
```

## Supporting Entities

### PlayerSecret Entity

**Table**: `player_secrets`

Secret character assignments (one per player per game).

```typescript
@Entity({ name: 'player_secrets' })
export class PlayerSecret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => GamePlayer)
  @JoinColumn({ name: 'player_id' })
  player: GamePlayer;

  @ManyToOne(() => Character)
  @JoinColumn({ name: 'character_id' })
  character: Character;            // Secret character

  @Column({
    type: 'enum',
    enum: PlayerSecretStatus,
    default: PlayerSecretStatus.HIDDEN,
  })
  status: PlayerSecretStatus;      // Hidden or revealed

  @CreateDateColumn()
  assignedAt: Date;

  @Column({ type: 'timestamptz' })
  revealedAt?: Date | null;
}
```

### PlayerPanel Entity

**Table**: `player_panels`

Tracks each player's view of characters (eliminated, etc.).

```typescript
@Entity({ name: 'player_panels' })
export class PlayerPanel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GamePlayer)
  @JoinColumn({ name: 'player_id' })
  player: GamePlayer;

  @ManyToOne(() => Character)
  @JoinColumn({ name: 'character_id' })
  character: Character;

  @Column({
    type: 'enum',
    enum: PlayerPanelStatus,
    default: PlayerPanelStatus.UNKNOWN,
  })
  status: PlayerPanelStatus;       // Unknown, eliminated, highlighted

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Enums**:

```typescript
enum PlayerPanelStatus {
  UNKNOWN = 'unknown',         // No information yet
  ELIMINATED = 'eliminated',   // Ruled out
  HIGHLIGHTED = 'highlighted', // Potential match
}
```

### GameEvent Entity

**Table**: `game_events`

Event log for game history and replay.

```typescript
@Entity({ name: 'game_events' })
export class GameEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Game)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({
    type: 'enum',
    enum: GameEventType,
  })
  eventType: GameEventType;

  @ManyToOne(() => GamePlayer)
  @JoinColumn({ name: 'actor_id' })
  actor?: GamePlayer | null;       // Player triggering event

  @Column({ type: 'jsonb' })
  eventData: Record<string, unknown>;  // Event details

  @CreateDateColumn()
  occurredAt: Date;
}
```

**Enums**:

```typescript
enum GameEventType {
  PLAYER_JOINED = 'player_joined',
  PLAYER_READY = 'player_ready',
  QUESTION_ASKED = 'question_asked',
  ANSWER_SUBMITTED = 'answer_submitted',
  CHARACTER_ELIMINATED = 'character_eliminated',
  GUESS_MADE = 'guess_made',
  TIMER_EXPIRED = 'timer_expired',
  GAME_STATE_CHANGED = 'game_state_changed',
}
```

### GameInvite Entity

**Table**: `game_invites`

Game invitation system (future feature).

```typescript
@Entity({ name: 'game_invites' })
export class GameInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Game)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({ unique: true })
  inviteToken: string;

  @Column()
  recipientEmail?: string | null;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'int' })
  maxUses?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt?: Date | null;
}
```

### PlayerStats Entity

**Table**: `player_stats`

Aggregate player statistics.

```typescript
@Entity({ name: 'player_stats' })
export class PlayerStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', default: 0 })
  totalGames: number;

  @Column({ type: 'int', default: 0 })
  totalWins: number;

  @Column({ type: 'int', default: 0 })
  totalQuestionsAsked: number;

  @Column({ type: 'int', default: 0 })
  totalQuestionsAnswered: number;

  @Column({ type: 'int', default: 0 })
  totalCorrectGuesses: number;

  @Column({ type: 'int', default: 0 })
  totalIncorrectGuesses: number;

  @Column({ type: 'int', default: 0 })
  totalPlayTimeSeconds: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### GameConfigSnapshot Entity

**Table**: `game_config_snapshots`

Snapshot of game configuration at start (for historical reference).

```typescript
@Entity({ name: 'game_config_snapshots' })
export class GameConfigSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Game)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @ManyToOne(() => CharacterSet)
  @JoinColumn({ name: 'character_set_id' })
  characterSet: CharacterSet;

  @Column({ type: 'jsonb' })
  configData: Record<string, unknown>;  // Rules, settings, etc.

  @CreateDateColumn()
  snapshotAt: Date;
}
```

## Database Schema Summary

### Entity Count

- **15 entities** total
- **Core**: User, Game, GamePlayer, Character, CharacterSet
- **Gameplay**: Round, Question, Answer, Guess
- **Supporting**: PlayerSecret, PlayerPanel, GameEvent, GameInvite
- **Statistics**: PlayerStats, GameConfigSnapshot

### Relationship Patterns

- **One-to-Many**: User → Games, CharacterSet → Characters
- **Many-to-One**: Game → User (host), GamePlayer → User
- **One-to-One**: PlayerSecret → GamePlayer, Question → Answer
- **Self-Referencing**: None

### Data Types Used

- **UUID**: All primary keys
- **Text**: Strings (email, username, room codes)
- **Integer**: Counts, scores, timers
- **Boolean**: Flags (isReady, isActive)
- **Enum**: Status, visibility, roles
- **JSONB**: Flexible metadata and config
- **Timestamptz**: All timestamps with timezone

### Indexes

- **Unique Constraints**: Email, username, room code, slug
- **Foreign Keys**: All relationships indexed
- **Query Optimization**: Status, lastSeenAt, game_id

## Migration Strategy

### Development

```bash
# Sync mode (automatic schema updates)
DB_SYNC=true pnpm dev:backend
```

### Production

```bash
# Generate migration
pnpm migration:generate MigrationName

# Run migrations
pnpm migration:run

# Revert migration
pnpm migration:revert
```

### Seeding

```bash
# Seed database with demo data
pnpm seed

# Reset database (drops all tables)
pnpm db:reset
```

## Query Optimization Tips

### Use Relations Wisely

```typescript
// ❌ N+1 Problem
const games = await gameRepository.find();
for (const game of games) {
  const players = await game.players;  // Separate query each time
}

// ✅ Eager Loading
const games = await gameRepository.find({
  relations: ['players', 'characterSet'],
});
```

### Use QueryBuilder for Complex Queries

```typescript
const games = await gameRepository
  .createQueryBuilder('game')
  .leftJoinAndSelect('game.players', 'player')
  .leftJoinAndSelect('player.user', 'user')
  .where('game.status = :status', { status: GameStatus.LOBBY })
  .andWhere('game.visibility = :visibility', { visibility: GameVisibility.PUBLIC })
  .orderBy('game.createdAt', 'DESC')
  .take(10)
  .getMany();
```

### Use Indexes

```typescript
// Indexed query (fast)
await gameRepository.findOne({
  where: { roomCode: 'ABC123' },  // roomCode is indexed
});

// Full table scan (slow)
await gameRepository.findOne({
  where: { turnTimerSeconds: 30 },  // turnTimerSeconds not indexed
});
```

## Conclusion

The WhoIsIt database schema is designed for:

- **Real-time gameplay** with efficient queries
- **Event sourcing** through GameEvent logging
- **Flexibility** with JSONB metadata columns
- **Scalability** with proper indexing
- **Data integrity** with foreign key constraints

The schema supports both authenticated and guest users, public and private games, and comprehensive game history tracking.

---

**Related Documentation**:

- [Authentication](./authentication.md)
- [Game Mechanics](./game-mechanics.md)
- [API Endpoints](./api-endpoints.md)
