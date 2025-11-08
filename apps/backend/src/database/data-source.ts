import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { DATABASE_ENTITIES } from './database.module';

// Load environment variables
config();

/**
 * TypeORM DataSource configuration for migrations
 * This is used by TypeORM CLI for generating and running migrations
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'whois_it',
  entities: DATABASE_ENTITIES,
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false, // Always false for migrations
  logging: process.env.NODE_ENV === 'development',
});
