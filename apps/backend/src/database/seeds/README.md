# Database Seeds

This directory contains seed scripts to populate the database with test data.

## Available Seeds

### User Seeds (`user.seed.ts`)

Seeds test users including:

- 3 authenticated users with credentials:
  - <alice@example.com> / alice / password123
  - <bob@example.com> / bob / password123
  - <charlie@example.com> / charlie / password123
- 2 guest users (no login credentials)

### Character Set Seeds (`character-set.seed.ts`)

Seeds a character set with characters:

1. **Classic Characters** (default set)
   - 24 characters: Alice, Bob, Charlie, Diana, Edward, Fiona, George, Hannah, Isaac, Julia, Kevin, Laura, Michael, Nina, Oscar, Paula, Quinn, Rachel, Samuel, Tina, Ulysses, Vera, Walter, Xena

## Running Seeds

### Prerequisites

Ensure your database is running and configured in `.env` or environment variables:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=whois_it
```

### Execute Seeds

From the backend directory:

```bash
pnpm seed
```

Or using npm:

```bash
npm run seed
```

### Seed Behavior

- Seeds are idempotent - they check if data exists before inserting
- If users already exist, user seeds are skipped
- If character sets already exist, character set seeds are skipped
- This allows you to run seeds multiple times safely

## Database Schema

Seeds use TypeORM entities defined in `src/database/entities/`. The relationships are:

- CharacterSet has many Characters

## Customizing Seeds

To add more seed data:

1. Create a new seed file in this directory (e.g., `game.seed.ts`)
2. Export an async function that takes a DataSource parameter
3. Add your seed function to the `runSeeds` function in `index.ts`
