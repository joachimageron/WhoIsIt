import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { User } from '../database/entities/user.entity';
import { PlayerStats } from '../database/entities/player-stats.entity';
import { Game } from '../database/entities/game.entity';
import { GamePlayer } from '../database/entities/game-player.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../email/email.module';
import { AuthTokenService } from './services/auth-token.service';
import { AuthProfileService } from './services/auth-profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PlayerStats, Game, GamePlayer]),
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret && process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET must be set in production');
        }
        return {
          secret: secret || 'dev-secret-change-in-production',
          signOptions: { expiresIn: '7d' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    AuthProfileService,
    LocalStrategy,
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
