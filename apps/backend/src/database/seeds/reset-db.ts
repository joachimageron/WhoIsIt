import 'dotenv/config';
import { AppDataSource } from '../data-source';

async function main() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Drop all tables
    console.log('Dropping database schema...');
    await AppDataSource.dropDatabase();
    console.log('Database schema dropped');

    // Synchronize schema to recreate tables
    console.log('Recreating database schema...');
    await AppDataSource.synchronize();
    console.log('Database schema recreated');

    await AppDataSource.destroy();
    console.log('Database connection closed');
    console.log('✅ Database reset completed successfully!');
    console.log(
      '💡 Run "pnpm seed" to populate the database with initial data',
    );
    process.exit(0);
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  }
}

void main();
