import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../../database/entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { EmailService } from '../../email/email.service';
import { JwtPayload } from '../types/jwt-payload.type';
import { AuthTokenService } from './auth-token.service';
import { AuthProfileService } from './auth-profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly authTokenService: AuthTokenService,
    private readonly authProfileService: AuthProfileService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, username, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date();
    verificationTokenExpiresAt.setHours(
      verificationTokenExpiresAt.getHours() + 24,
    ); // 24 hours from now
    const lastSeenAt = new Date();

    // Select random avatar
    const avatarNumber = Math.floor(Math.random() * 18);
    const avatarUrl = `/avatar/avatar_${avatarNumber}.jpg`;

    // Create user
    const user = this.userRepository.create({
      email,
      username,
      passwordHash,
      avatarUrl,
      isGuest: false,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
      lastSeenAt,
    });

    await this.userRepository.save(user);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        email,
        username,
        verificationToken,
      );
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to send verification email:', error);
    }

    // Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email ?? null,
      username: user.username,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email ?? null,
        username: user.username,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  }

  async validateUser(
    emailOrUsername: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: User): Promise<AuthResponseDto> {
    user.lastSeenAt = new Date();
    await this.userRepository.save(user);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email ?? null,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email ?? null,
        username: user.username,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  }

  async updateLastSeen(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastSeenAt: new Date() });
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  // Delegate token management to AuthTokenService
  async verifyEmail(token: string): Promise<void> {
    return this.authTokenService.verifyEmail(token);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    return this.authTokenService.resendVerificationEmail(email);
  }

  async requestPasswordReset(email: string): Promise<void> {
    return this.authTokenService.requestPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return this.authTokenService.resetPassword(token, newPassword);
  }

  // Delegate profile management to AuthProfileService
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    return this.authProfileService.updateProfile(userId, updateProfileDto);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.authProfileService.changePassword(userId, changePasswordDto);
  }

  async getPlayerStats(userId: string) {
    return this.authProfileService.getPlayerStats(userId);
  }
}
