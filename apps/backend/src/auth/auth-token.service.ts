import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../database/entities/user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthTokenService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Verification token expired. Please request a new one.',
      );
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;

    await this.userRepository.save(user);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date();
    verificationTokenExpiresAt.setHours(
      verificationTokenExpiresAt.getHours() + 24,
    );

    user.verificationToken = verificationToken;
    user.verificationTokenExpiresAt = verificationTokenExpiresAt;

    await this.userRepository.save(user);

    // Send verification email
    await this.emailService.sendVerificationEmail(
      email,
      user.username,
      verificationToken,
    );
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists or not for security
      return;
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetTokenExpiresAt = new Date();
    passwordResetTokenExpiresAt.setHours(
      passwordResetTokenExpiresAt.getHours() + 1,
    ); // 1 hour expiry

    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenExpiresAt = passwordResetTokenExpiresAt;

    await this.userRepository.save(user);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(
      email,
      user.username,
      passwordResetToken,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (
      user.passwordResetTokenExpiresAt &&
      user.passwordResetTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    user.passwordHash = passwordHash;
    user.passwordResetToken = null;
    user.passwordResetTokenExpiresAt = null;

    await this.userRepository.save(user);
  }
}
