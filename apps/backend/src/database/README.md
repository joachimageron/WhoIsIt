# Database Module

This module manages the database layer for the WhoIsIt backend using TypeORM with PostgreSQL.

## Overview

The database module provides:

- TypeORM entity definitions
- Database migrations
- Seed data for development
- PostgreSQL connection configuration
- Entity relationship management

## Architecture

### Module Structure

- `database.module.ts` - Module configuration and entity registration
- `data-source.ts` - TypeORM data source configuration for migrations
- `entities/` - TypeORM entity definitions
- `migrations/` - Database schema migrations
- `seeds/` - Seed data scripts for development
- `enums.ts` - Shared enum definitions

## Entities

### User Management

#### User (`user.entity.ts`)

Core user account data:

- `id` - UUID primary key
- `email` - Unique email address
- `username` - Display name
- `password` - Bcrypt hashed password
- `isEmailVerified` - Email verification status
- `emailVerificationToken` - Token for email verification
- `passwordResetToken` - Token for password reset
- `passwordResetExpires` - Reset token expiration
- Timestamps: `createdAt`, `updatedAt`
- Relations: `playerStats`, `hostedGames`, `gamePlayers`

#### PlayerStats (`player-stats.entity.ts`)

Player statistics and game history:

- `id` - UUID primary key
- `userId` - Foreign key to User (nullable for guests)
- `gamesPlayed` - Total games played
- `gamesWon` - Total games won
- `totalQuestionsAsked` - Questions asked across all games
- `totalGuesses` - Total guess attempts
- `correctGuesses` - Successful guesses
- Relations: `user`, `gamePlayers`

### Game Management

#### Game (`game.entity.ts`)

Game session data:

- `id` - UUID primary key
- `roomCode` - 5-character unique room code
- `status` - Game status (lobby, playing, finished, cancelled)
- `hostId` - Foreign key to User (game creator)
- `characterSetId` - Foreign key to CharacterSet
- `winnerId` - Foreign key to User (nullable)
- `startedAt` - Game start timestamp
- `finishedAt` - Game end timestamp
- Timestamps: `createdAt`, `updatedAt`
- Relations: `host`, `characterSet`, `winner`, `players`, `rounds`, `events`

#### GamePlayer (`game-player.entity.ts`)

Player participation in games:

- `id` - UUID primary key
- `gameId` - Foreign key to Game
- `playerStatsId` - Foreign key to PlayerStats
- `isReady` - Lobby ready status
- `hasLeft` - Whether player has left
- Relations: `game`, `playerStats`, `secret`, `panel`

#### CharacterSet (`character-set.entity.ts`)

Sets of characters for games:

- `id` - UUID primary key
- `name` - Character set name
- `description` - Set description
- `imageUrl` - Preview image
- `isActive` - Whether available for selection
- Relations: `characters`, `games`

#### Character (`character.entity.ts`)

Individual characters in sets:

- `id` - UUID primary key
- `characterSetId` - Foreign key to CharacterSet
- `name` - Character name
- `imageUrl` - Character image
- `attributes` - JSON object with character traits
- Relations: `characterSet`, `secrets`, `guesses`

### Gameplay Entities

#### Round (`round.entity.ts`)

Game rounds:

- `id` - UUID primary key
- `gameId` - Foreign key to Game
- `roundNumber` - Sequential round number
- `currentTurnPlayerId` - Foreign key to GamePlayer
- `status` - Round status
- Timestamps: `createdAt`, `updatedAt`
- Relations: `game`, `currentTurnPlayer`, `questions`

#### Question (`question.entity.ts`)

Questions asked during gameplay:

- `id` - UUID primary key
- `roundId` - Foreign key to Round
- `askedByPlayerId` - Foreign key to GamePlayer
- `questionText` - Question content
- `askedAt` - Timestamp
- Relations: `round`, `askedByPlayer`, `answer`

#### Answer (`answer.entity.ts`)

Answers to questions:

- `id` - UUID primary key
- `questionId` - Foreign key to Question
- `answeredByPlayerId` - Foreign key to GamePlayer
- `answerValue` - Answer (yes/no/maybe)
- `answeredAt` - Timestamp
- Relations: `question`, `answeredByPlayer`

#### Guess (`guess.entity.ts`)

Character guesses:

- `id` - UUID primary key
- `gameId` - Foreign key to Game
- `playerId` - Foreign key to GamePlayer
- `characterId` - Foreign key to Character
- `isCorrect` - Whether guess was correct
- `guessedAt` - Timestamp
- Relations: `game`, `player`, `character`

#### PlayerSecret (`player-secret.entity.ts`)

Secret character assignments:

- `id` - UUID primary key
- `gamePlayerId` - Foreign key to GamePlayer
- `characterId` - Foreign key to Character
- Relations: `gamePlayer`, `character`

#### PlayerPanel (`player-panel.entity.ts`)

Eliminated character tracking:

- `id` - UUID primary key
- `gamePlayerId` - Foreign key to GamePlayer
- `eliminatedCharacters` - Array of character IDs
- Relations: `gamePlayer`

### Auxiliary Entities

#### GameEvent (`game-event.entity.ts`)

Audit log of game events:

- `id` - UUID primary key
- `gameId` - Foreign key to Game
- `eventType` - Type of event
- `eventData` - JSON event payload
- `createdAt` - Timestamp
- Relations: `game`

#### GameInvite (`game-invite.entity.ts`)

Game invitation tracking:

- `id` - UUID primary key
- `gameId` - Foreign key to Game
- `invitedByUserId` - Foreign key to User
- `inviteCode` - Unique invite code
- `expiresAt` - Expiration timestamp
- Relations: `game`, `invitedBy`

#### GameConfigSnapshot (`game-config-snapshot.entity.ts`)

Game configuration snapshot:

- `id` - UUID primary key
- `gameId` - Foreign key to Game
- `config` - JSON configuration data
- Relations: `game`

## Enums

Defined in `enums.ts`:

- `GameStatus` - lobby, playing, finished, cancelled
- `AnswerValue` - yes, no, maybe
- `RoundStatus` - active, completed

## Migrations

### Running Migrations

```bash
# Run pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Show migration status
pnpm migration:show

# Generate new migration
pnpm migration:generate -- MigrationName
```

### Existing Migrations

1. `1731256000000-InitialSchema.ts` - Initial database schema
2. `1731257000000-TwoPlayerConversion.ts` - Conversion to 2-player game

## Seed Data

### Running Seeds

```bash
# Run all seeds
pnpm seed

# Reset database and reseed
pnpm db:reset
```

### Available Seeds

- `character-set.seed.ts` - Default character sets
- `user.seed.ts` - Test user accounts
- `reset-db.ts` - Database reset utility

## Configuration

### Environment Variables

Database connection:

- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USERNAME` - Database username (default: postgres)
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name (default: whoisit)
- `DB_SYNC` - Auto-sync schema (development only, default: false)

### Connection Configuration

In `data-source.ts`:

```typescript
{
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'whoisit',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: process.env.DB_SYNC === 'true', // NEVER in production!
}
```

## Relationships

### User Relationships

- User → PlayerStats (one-to-one)
- User → Game (one-to-many, as host)
- User → GamePlayer (one-to-many, through PlayerStats)

### Game Relationships

- Game → GamePlayer (one-to-many)
- Game → Round (one-to-many)
- Game → CharacterSet (many-to-one)
- Game → User (many-to-one, as host)
- Game → User (many-to-one, as winner)

### Gameplay Relationships

- Round → Question (one-to-many)
- Question → Answer (one-to-one)
- GamePlayer → PlayerSecret (one-to-one)
- GamePlayer → PlayerPanel (one-to-one)
- GamePlayer → Guess (one-to-many)

## Indexing

Key indexes for performance:

- `User.email` - Unique index for login
- `Game.roomCode` - Unique index for game lookup
- `Game.status` - Index for filtering games
- `GamePlayer.gameId` - Index for player queries
- `Round.gameId` - Index for round queries

## Testing

Database entities are tested in:

- Unit tests for each entity
- Integration tests for relationships
- Migration tests for schema changes

## Best Practices

### Entities

- Use UUID for all primary keys
- Include timestamps (createdAt, updatedAt) where appropriate
- Define cascade operations carefully
- Use nullable foreign keys where appropriate
- Validate data with decorators

### Migrations

- Never modify existing migrations
- Test migrations on copy of production data
- Always provide down migration
- Review generated SQL before running
- Keep migrations focused and atomic

### Seeds

- Only for development/testing
- Never run on production
- Keep seed data realistic
- Document seed data relationships

## Security

- Passwords hashed with bcrypt
- Email verification required
- Tokens have expiration
- Sensitive data never logged
- Database credentials in environment variables
- Use read replicas for heavy queries (future)

## Performance

- Proper indexing on frequently queried fields
- Use select queries to limit returned columns
- Eager loading for necessary relations
- Lazy loading for optional relations
- Connection pooling configured
- Query result caching (future)

## Troubleshooting

### Connection errors

- Verify PostgreSQL is running
- Check credentials and database name
- Ensure port is accessible
- Check firewall settings

### Migration errors

- Ensure database is accessible
- Check for conflicting changes
- Review migration SQL
- Test on development database first

### Seed errors

- Ensure migrations are up to date
- Check for duplicate data
- Verify foreign key constraints
- Review seed order

## Future Enhancements

Potential improvements:

- Database backups automation
- Read replicas for scaling
- Query result caching
- Soft deletes for entities
- Audit logging for all changes
- Database performance monitoring
- Materialized views for statistics
