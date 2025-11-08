import 'dotenv/config';
import { DataSource } from 'typeorm';
import { DATABASE_ENTITIES } from '../database.module';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'whois_it',
  entities: DATABASE_ENTITIES,
  synchronize: false, // We'll handle schema manually
});

async function main() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Database connection established');

    // Drop all tables
    console.log('Dropping database schema...');
    await dataSource.dropDatabase();
    console.log('Database schema dropped');

    await dataSource.destroy();
    console.log('Database connection closed');
    console.log('✅ Database reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  }
}

void main();
