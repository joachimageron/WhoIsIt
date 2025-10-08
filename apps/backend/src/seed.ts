import 'dotenv/config';
import { DataSource } from 'typeorm';
import { runSeeds } from './database/seeds';
import { DATABASE_ENTITIES } from './database/database.module';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'whois_it',
  entities: DATABASE_ENTITIES,
  synchronize: process.env.DB_SYNC === 'false' ? false : true,
});

async function main() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Database connection established');

    await runSeeds(dataSource);

    await dataSource.destroy();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seed script failed:', error);
    process.exit(1);
  }
}

void main();
