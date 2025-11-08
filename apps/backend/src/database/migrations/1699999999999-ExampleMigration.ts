import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Example migration file demonstrating TypeORM migration structure.
 * 
 * This is a template showing how migrations are structured.
 * Real migrations should be generated using:
 *   pnpm migration:generate src/database/migrations/DescriptiveName
 * 
 * To create your first migration from existing entities:
 * 1. Ensure PostgreSQL is running with correct credentials in .env
 * 2. Run: pnpm migration:generate src/database/migrations/InitialSchema
 * 3. Review the generated SQL in the up() and down() methods
 * 4. Run: pnpm migration:run to apply it
 * 
 * This example file should be deleted once real migrations are generated.
 */
export class ExampleMigration1699999999999 implements MigrationInterface {
  name = 'ExampleMigration1699999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Example: Create a table
    await queryRunner.query(`
      CREATE TABLE "example" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_example_id" PRIMARY KEY ("id")
      )
    `);

    // Example: Add an index
    await queryRunner.query(`
      CREATE INDEX "IDX_example_name" ON "example" ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes in reverse order
    await queryRunner.query(`DROP INDEX "IDX_example_name"`);
    await queryRunner.query(`DROP TABLE "example"`);
  }
}
