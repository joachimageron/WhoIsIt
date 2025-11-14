import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../../database/entities/user.entity';
import { PlayerStats } from '../../database/entities/player-stats.entity';
import { GamePlayer } from '../../database/entities/game-player.entity';
import { Game } from '../../database/entities/game.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { EmailService } from '../../email/email.service';
import { GameStatus } from '../../database/enums';
import type {
  PlayerStatsResponse,
  GameHistoryResponse,
  GameHistoryItem,
} from '@whois-it/contracts';

@Injectable()
export class AuthProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PlayerStats)
    private readonly playerStatsRepository: Repository<PlayerStats>,
    @InjectRepository(GamePlayer)
    private readonly gamePlayerRepository: Repository<GamePlayer>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    private readonly emailService: EmailService,
  ) {}

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new username is already taken
    if (
      updateProfileDto.username &&
      updateProfileDto.username !== user.username
    ) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateProfileDto.username },
      });

      if (existingUser) {
        throw new ConflictException('Username already taken');
      }

      user.username = updateProfileDto.username;
    }

    // Check if new email is already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      user.email = updateProfileDto.email;
      user.emailVerified = false; // Require re-verification

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiresAt = new Date();
      verificationTokenExpiresAt.setHours(
        verificationTokenExpiresAt.getHours() + 24,
      );

      user.verificationToken = verificationToken;
      user.verificationTokenExpiresAt = verificationTokenExpiresAt;

      // Send verification email
      try {
        await this.emailService.sendVerificationEmail(
          updateProfileDto.email,
          user.username,
          verificationToken,
        );
      } catch (error) {
        console.error('Failed to send verification email:', error);
      }
    }

    // Update avatar URL
    if (updateProfileDto.avatarUrl !== undefined) {
      user.avatarUrl = updateProfileDto.avatarUrl;
    }

    await this.userRepository.save(user);

    return user;
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Cannot change password for this account');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);

    user.passwordHash = passwordHash;

    await this.userRepository.save(user);
  }

  async getPlayerStats(userId: string): Promise<PlayerStatsResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get player stats or return default values for guests
    let stats = await this.playerStatsRepository.findOne({
      where: { userId },
    });

    if (!stats) {
      // Return default stats if none exist
      stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalQuestions: 0,
        totalGuesses: 0,
        fastestWinSeconds: null,
        streak: 0,
      } as PlayerStats;
    }

    const winRate =
      stats.gamesPlayed > 0
        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
        : 0;

    return {
      gamesPlayed: stats.gamesPlayed,
      gamesWon: stats.gamesWon,
      totalQuestions: stats.totalQuestions,
      totalGuesses: stats.totalGuesses,
      fastestWinSeconds: stats.fastestWinSeconds ?? undefined,
      streak: stats.streak,
      winRate,
    };
  }

  async getGameHistory(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<GameHistoryResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get completed games where the user participated
    const [gamePlayers, total] = await this.gamePlayerRepository.findAndCount({
      where: {
        user: { id: userId },
        game: { status: GameStatus.COMPLETED },
      },
      relations: {
        game: {
          winner: true,
          characterSet: true,
          players: true,
        },
        askedQuestions: true,
        answers: true,
        guesses: true,
      },
      order: {
        game: { endedAt: 'DESC' },
      },
      take: limit,
      skip: offset,
    });

    const games: GameHistoryItem[] = gamePlayers.map((gamePlayer) => {
      const game = gamePlayer.game;
      const isWinner = game.winner?.id === userId;

      // Find opponent (the other player)
      const opponent = game.players?.find(
        (p) => p.user?.id !== userId && !p.leftAt,
      );

      const questionsAsked = gamePlayer.askedQuestions?.length ?? 0;
      const questionsAnswered = gamePlayer.answers?.length ?? 0;
      const allGuesses = gamePlayer.guesses ?? [];
      const correctGuesses = allGuesses.filter((g) => g.isCorrect).length;
      const incorrectGuesses = allGuesses.filter((g) => !g.isCorrect).length;

      const durationSeconds =
        game.startedAt && game.endedAt
          ? Math.floor(
              (game.endedAt.getTime() - game.startedAt.getTime()) / 1000,
            )
          : 0;

      return {
        gameId: game.id,
        roomCode: game.roomCode,
        characterSetName: game.characterSet?.name ?? 'Unknown',
        isWinner,
        placement: gamePlayer.placement ?? 999,
        score: gamePlayer.score,
        questionsAsked,
        questionsAnswered,
        correctGuesses,
        incorrectGuesses,
        startedAt:
          game.startedAt?.toISOString() ?? game.createdAt.toISOString(),
        endedAt: game.endedAt?.toISOString() ?? game.createdAt.toISOString(),
        durationSeconds,
        opponentUsername: opponent?.username,
      };
    });

    return {
      games,
      total,
    };
  }
}
