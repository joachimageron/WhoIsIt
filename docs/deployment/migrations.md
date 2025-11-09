# Database Migrations

## Overview

Database migrations are version-controlled changes to the database schema. WhoIsIt uses **TypeORM migrations** to manage schema changes safely across environments.

## Migration System

### Why Migrations?

**Benefits**:
- ✅ Version control for database schema
- ✅ Reproducible across environments
- ✅ Safe rollback capability
- ✅ Team collaboration
- ✅ Production safety

**vs DB_SYNC**:
```typescript
// ❌ Development only - DON'T use in production
{
  synchronize: true,  // Auto-syncs schema (can cause data loss)
}

// ✅ Production - Use migrations
{
  synchronize: false,
  migrations: ['dist/database/migrations/*.js'],
  migrationsRun: true,
}
```

## Creating Migrations

### Generate Migration

```bash
# Generate from entity changes
pnpm --filter @whois-it/backend migration:generate -n AddUserEmailVerification

# Creates: src/database/migrations/1699876543210-AddUserEmailVerification.ts
```

### Manual Migration

```bash
# Create empty migration
pnpm --filter @whois-it/backend migration:create -n CustomMigration
```

### Migration File Structure

```typescript
// src/database/migrations/1699876543210-AddUserEmailVerification.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEmailVerification1699876543210 implements MigrationInterface {
  name = 'AddUserEmailVerification1699876543210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "email_verified" boolean DEFAULT false,
      ADD COLUMN "verification_token" varchar,
      ADD COLUMN "verification_token_expires_at" timestamp
    `);

    // Create index
    await queryRunner.query(`
      CREATE INDEX "IDX_users_verification_token" 
      ON "users" ("verification_token")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse changes
    await queryRunner.query(`DROP INDEX "IDX_users_verification_token"`);
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "verification_token_expires_at",
      DROP COLUMN "verification_token",
      DROP COLUMN "email_verified"
    `);
  }
}
```

## Running Migrations

### Apply Migrations

```bash
# Run pending migrations
pnpm --filter @whois-it/backend migration:run

# Output:
# Running migrations...
# ✅ AddUserEmailVerification1699876543210 has been executed successfully
```

### Revert Migrations

```bash
# Revert last migration
pnpm --filter @whois-it/backend migration:revert

# Revert multiple
pnpm --filter @whois-it/backend migration:revert
pnpm --filter @whois-it/backend migration:revert
```

### Check Status

```bash
# Show pending and run migrations
pnpm --filter @whois-it/backend migration:show
```

## Migration Patterns

### Adding Column

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "games" 
    ADD COLUMN "turn_timer_seconds" integer DEFAULT 30
  `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "games" 
    DROP COLUMN "turn_timer_seconds"
  `);
}
```

### Adding Table

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    CREATE TABLE "game_events" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "game_id" uuid NOT NULL,
      "event_type" varchar NOT NULL,
      "event_data" jsonb,
      "created_at" timestamp DEFAULT now(),
      FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE
    )
  `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`DROP TABLE "game_events"`);
}
```

### Adding Index

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    CREATE INDEX "IDX_games_status" 
    ON "games" ("status")
  `);
  
  await queryRunner.query(`
    CREATE INDEX "IDX_games_created_at" 
    ON "games" ("created_at")
  `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`DROP INDEX "IDX_games_created_at"`);
  await queryRunner.query(`DROP INDEX "IDX_games_status"`);
}
```

### Adding Foreign Key

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "game_players" 
    ADD CONSTRAINT "FK_game_players_user" 
    FOREIGN KEY ("user_id") 
    REFERENCES "users"("id") 
    ON DELETE SET NULL
  `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "game_players" 
    DROP CONSTRAINT "FK_game_players_user"
  `);
}
```

### Data Migration

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Add new column
  await queryRunner.query(`
    ALTER TABLE "users" 
    ADD COLUMN "full_name" varchar
  `);

  // Migrate data
  await queryRunner.query(`
    UPDATE "users" 
    SET "full_name" = CONCAT("first_name", ' ', "last_name")
  `);

  // Drop old columns
  await queryRunner.query(`
    ALTER TABLE "users" 
    DROP COLUMN "first_name",
    DROP COLUMN "last_name"
  `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  // Add back old columns
  await queryRunner.query(`
    ALTER TABLE "users" 
    ADD COLUMN "first_name" varchar,
    ADD COLUMN "last_name" varchar
  `);

  // Reverse data migration
  await queryRunner.query(`
    UPDATE "users" 
    SET 
      "first_name" = SPLIT_PART("full_name", ' ', 1),
      "last_name" = SPLIT_PART("full_name", ' ', 2)
  `);

  // Drop new column
  await queryRunner.query(`
    ALTER TABLE "users" 
    DROP COLUMN "full_name"
  `);
}
```

## Production Workflow

### Pre-Deployment

```bash
# 1. Generate migration
pnpm migration:generate -n FeatureName

# 2. Review generated SQL
cat src/database/migrations/TIMESTAMP-FeatureName.ts

# 3. Test migration
pnpm migration:run

# 4. Test rollback
pnpm migration:revert

# 5. Re-apply migration
pnpm migration:run

# 6. Commit migration file
git add src/database/migrations/
git commit -m "db: add feature name migration"
```

### Deployment

```bash
# On production server
cd apps/backend

# Backup database first!
pg_dump -U postgres whois_it > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
NODE_ENV=production pnpm migration:run

# Verify
psql -U postgres -d whois_it -c "\d+ table_name"
```

### Rollback

```bash
# If something goes wrong
pnpm migration:revert

# Or restore from backup
psql -U postgres -d whois_it < backup_20241109_120000.sql
```

## Best Practices

### 1. Always Test Migrations

```bash
# Test sequence
pnpm migration:run    # Apply
pnpm migration:revert # Rollback
pnpm migration:run    # Re-apply
```

### 2. Backup Before Production

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres whois_it > backup_${DATE}.sql

# Run migrations
pnpm migration:run

# Keep backup for 30 days
find backup_*.sql -mtime +30 -delete
```

### 3. Small, Focused Migrations

```typescript
// ✅ Good - One logical change
export class AddUserEmailVerification { ... }

// ❌ Bad - Multiple unrelated changes
export class AddUserFieldsAndGameTablesAndIndexes { ... }
```

### 4. Test Down Migration

Always implement and test the `down()` method:

```typescript
// ✅ Good - Reversible
public async down(queryRunner: QueryRunner): Promise<void> {
  // Proper rollback
}

// ❌ Bad - Not reversible
public async down(queryRunner: QueryRunner): Promise<void> {
  // Empty or throws error
}
```

### 5. Handle Data Carefully

```typescript
// ✅ Good - Safe data migration
public async up(queryRunner: QueryRunner): Promise<void> {
  // Add column with default
  await queryRunner.query(`
    ALTER TABLE "users" 
    ADD COLUMN "role" varchar DEFAULT 'user'
  `);
  
  // Update existing data
  await queryRunner.query(`
    UPDATE "users" 
    SET "role" = 'admin' 
    WHERE "is_admin" = true
  `);
}

// ❌ Bad - Can lose data
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "users" 
    DROP COLUMN "important_data"  // Data lost!
  `);
}
```

## Troubleshooting

### Migration Already Run

**Error**: "Migration has already been applied"

**Solution**:
```bash
# Check migrations table
psql -U postgres -d whois_it -c "SELECT * FROM migrations"

# Remove specific migration record (careful!)
psql -U postgres -d whois_it -c "DELETE FROM migrations WHERE name = 'MigrationName'"

# Re-run
pnpm migration:run
```

### Migration Failed Partially

**Error**: Migration ran partially and failed

**Solution**:
```bash
# 1. Check database state
psql -U postgres -d whois_it -c "\d+ table_name"

# 2. Manually fix if needed
psql -U postgres -d whois_it -c "ALTER TABLE ..."

# 3. Update migrations table
psql -U postgres -d whois_it -c "
  INSERT INTO migrations (timestamp, name) 
  VALUES (1699876543210, 'MigrationName1699876543210')
"
```

### Conflicting Migrations

**Error**: Multiple developers created migrations

**Solution**:
```bash
# 1. Coordinate with team
# 2. Decide which migration runs first
# 3. Rename migrations to ensure order
mv 1699876543210-Feature1.ts 1699876543211-Feature1.ts

# 4. Update class name and timestamp
```

## Configuration

### TypeORM Config

```typescript
// src/database/data-source.ts
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/database/entities/**/*.entity.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
  synchronize: false,  // Never true in production!
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "migration:generate": "typeorm-ts-node-commonjs migration:generate",
    "migration:create": "typeorm-ts-node-commonjs migration:create",
    "migration:run": "typeorm-ts-node-commonjs migration:run",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert",
    "migration:show": "typeorm-ts-node-commonjs migration:show"
  }
}
```

## Related Documentation

- [Database Schema](../backend/database.md)
- [Production Deployment](./production.md)
- [Environment Configuration](./environment.md)

---

**Last Updated**: November 2024
