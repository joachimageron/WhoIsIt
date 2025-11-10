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
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { EmailService } from '../../email/email.service';
import type { PlayerStatsResponse } from '@whois-it/contracts';

@Injectable()
export class AuthProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PlayerStats)
    private readonly playerStatsRepository: Repository<PlayerStats>,
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
}
