import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { CharacterSetsModule } from './character-sets/character-sets.module';

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
      synchronize: process.env.DB_SYNC === 'false' ? false : true,
      autoLoadEntities: true,
    }),
    DatabaseModule,
    AuthModule,
    GameModule,
    CharacterSetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
