import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { runSeeds } from '.';

async function main() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Run migrations if DB_SYNC is false
    if (process.env.DB_SYNC === 'false') {
      console.log('Running pending migrations...');
      const pendingMigrations = await AppDataSource.showMigrations();
      if (pendingMigrations) {
        await AppDataSource.runMigrations();
        console.log('Migrations completed');
      } else {
        console.log('No pending migrations');
      }
    } else {
      console.log('DB_SYNC is enabled, skipping migrations');
      // Synchronize schema when DB_SYNC is true
      await AppDataSource.synchronize();
      console.log('Schema synchronized');
    }

    await runSeeds(AppDataSource);

    await AppDataSource.destroy();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seed script failed:', error);
    process.exit(1);
  }
}

void main();
