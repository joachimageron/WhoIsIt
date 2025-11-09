import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { CharacterSetsModule } from './game/character-sets/character-sets.module';
import { DATABASE_ENTITIES } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'whois_it',
      entities: DATABASE_ENTITIES,
      synchronize: false, // Always disabled - use migrations only
      migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
      migrationsRun: true, // Always run migrations on startup
      logging: process.env.NODE_ENV === 'development',
    }),
    DatabaseModule,
    AuthModule,
    GameModule,
    CharacterSetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
