# TypeORM Migration System

This document explains how to use the TypeORM migration system in the backend.

## Overview

The backend uses TypeORM migrations to manage database schema changes. Migrations provide a version control system for the database schema, allowing you to:

- Track database changes over time
- Roll back changes if needed
- Ensure consistent database state across environments
- Safely deploy schema changes to production

## Configuration

### Environment Variables

- `DB_SYNC`: Controls whether TypeORM uses synchronization or migrations
  - `true` (default for development): Uses auto-synchronization (entities automatically create/update tables)
  - `false` (production): Uses migrations system (manually controlled schema changes)

### Files

- **Data Source**: `src/database/data-source.ts` - TypeORM configuration for CLI commands
- **Migrations Directory**: `src/database/migrations/` - Contains all migration files
- **App Module**: `src/app.module.ts` - Runtime TypeORM configuration

## Available Commands

### Show Migrations

Display the status of all migrations:

```bash
pnpm migration:show
```

This shows which migrations have been run and which are pending.

### Generate Migration

Automatically generate a migration from entity changes:

```bash
pnpm migration:generate src/database/migrations/MigrationName
```

Example:

```bash
pnpm migration:generate src/database/migrations/InitialSchema
```

This compares your entities with the current database schema and generates a migration file with the necessary changes.

### Create Empty Migration

Create an empty migration file for manual editing:

```bash
pnpm migration:create src/database/migrations/MigrationName
```

Use this when you need to write custom SQL or data transformations.

### Run Migrations

Execute all pending migrations:

```bash
pnpm migration:run
```

This applies all migrations that haven't been run yet. In production mode (`DB_SYNC=false`), migrations are automatically run when the application starts.

### Revert Migration

Roll back the most recently executed migration:

```bash
pnpm migration:revert
```

Run this command multiple times to revert multiple migrations.

## Development Workflow

### During Development (DB_SYNC=true)

1. Create or modify entities in `src/database/entities/`
2. TypeORM automatically synchronizes the database schema
3. Test your changes
4. Before committing, generate a migration:
   ```bash
   pnpm migration:generate src/database/migrations/DescriptiveNameOfChanges
   ```
5. Review the generated migration file
6. Commit both the entity changes and the migration file

### For Production Deployment (DB_SYNC=false)

1. Set `DB_SYNC=false` in your production `.env` file
2. Deploy your application
3. Migrations will run automatically on startup, or run manually:
   ```bash
   pnpm migration:run
   ```

## Migration File Structure

Generated migration files follow this structure:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationName1234567890123 implements MigrationInterface {
  name = 'MigrationName1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SQL commands to apply the migration
    await queryRunner.query(`CREATE TABLE ...`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQL commands to revert the migration
    await queryRunner.query(`DROP TABLE ...`);
  }
}
```

- **up()**: Applies the migration (moves forward)
- **down()**: Reverts the migration (moves backward)

## Best Practices

1. **Always review generated migrations**: Auto-generated migrations may need manual adjustments
2. **Test migrations locally**: Run `migration:run` and `migration:revert` to verify they work
3. **One logical change per migration**: Keep migrations focused and atomic
4. **Never modify committed migrations**: Create a new migration to fix issues
5. **Use descriptive names**: `AddUserEmailVerification` is better than `Migration1`
6. **Backup before production runs**: Always backup your production database before running migrations

## Troubleshooting

### Migration command fails with connection error

Ensure PostgreSQL is running and your `.env` file has correct database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=whois_it
```

### Migration generates too many changes

This usually happens when:
- You've made many entity changes without generating migrations
- The database schema is out of sync with entities

Solution: Review the generated migration carefully and split it into multiple logical migrations if needed.

### Migration fails during run

1. Check the error message in the console
2. Review the migration SQL in the file
3. Manually inspect the database schema
4. Fix the migration or revert it with `migration:revert`
5. Generate a corrected migration

## Initial Migration

When setting up a new database, you may want to generate an initial migration that captures all entities:

```bash
# On a fresh database
pnpm migration:generate src/database/migrations/InitialSchema
```

This creates a baseline migration with all tables, indexes, and constraints.

## Further Reading

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [TypeORM CLI Documentation](https://typeorm.io/using-cli)
