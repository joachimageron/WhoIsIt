import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from './services/auth.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../database/entities/user.entity';

export interface RequestWithUser extends Request {
  user: User;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // Stricter rate limiting for registration: 3 attempts per minute
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Response({ passthrough: false }) res: ExpressResponse,
  ) {
    const result = await this.authService.register(registerDto);

    // Set JWT token as HTTP-only cookie
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data without the token in the response body
    return res.json({
      user: result.user,
    });
  }

  // Stricter rate limiting for login: 5 attempts per minute
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() req: RequestWithUser,
    @Response({ passthrough: false }) res: ExpressResponse,
  ) {
    const result = await this.authService.login(req.user);

    // Set JWT token as HTTP-only cookie
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data without the token in the response body
    return res.json({
      user: result.user,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser) {
    await this.authService.updateLastSeen(req.user.id);
    return {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      avatarUrl: req.user.avatarUrl,
      isGuest: req.user.isGuest,
      emailVerified: req.user.emailVerified,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/stats')
  async getProfileStats(@Request() req: RequestWithUser) {
    return this.authService.getPlayerStats(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/game-history')
  async getGameHistory(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.authService.getGameHistory(req.user.id, limitNum, offsetNum);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Response({ passthrough: false }) res: ExpressResponse) {
    // Clear both access_token and guest_token cookies
    res.clearCookie('access_token');
    res.clearCookie('guest_token');
    return res.json({ message: 'Logged out successfully' });
  }

  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  // Rate limiting for email resending: 3 per minute
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    await this.authService.resendVerificationEmail(email);
    return { message: 'Verification email sent' };
  }

  // Rate limiting for password reset: 3 per minute
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(forgotPasswordDto.email);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
    return { message: 'Password reset successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.authService.updateProfile(
      req.user.id,
      updateProfileDto,
    );

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(req.user.id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  // Rate limiting for guest creation: 10 attempts per minute
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('guest')
  async createGuest(
    @Response({ passthrough: false }) res: ExpressResponse,
  ) {
    const result = await this.authService.createGuest();

    // Set JWT token as HTTP-only cookie with guest_token name
    res.cookie('guest_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return user data without the token in the response body
    return res.json({
      user: result.user,
    });
  }
}
