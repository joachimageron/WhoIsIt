import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailHost = this.configService.get<string>('EMAIL_HOST');
    const emailPort = this.configService.get<number>('EMAIL_PORT');
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');

    if (!emailHost || !emailUser || !emailPassword) {
      this.logger.warn(
        'Email service not configured. Email verification will be logged instead of sent.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort || 587,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    this.logger.log('Email service initialized');
  }

  async sendVerificationEmail(
    to: string,
    username: string,
    verificationToken: string,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from:
        this.configService.get<string>('EMAIL_FROM') || 'noreply@whoisit.com',
      to,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to WhoIsIt, ${username}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering. Please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            Or copy and paste this link in your browser:<br>
            <a href="${verificationLink}" style="color: #007bff;">${verificationLink}</a>
          </p>
          <p style="color: #999; font-size: 12px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
      text: `
        Welcome to WhoIsIt, ${username}!
        
        Thank you for registering. Please verify your email address by clicking the link below:
        
        ${verificationLink}
        
        This link will expire in 24 hours. If you didn't create an account, please ignore this email.
      `,
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Verification email sent to ${to}`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${to}:`, error);
        throw error;
      }
    } else {
      // Development mode - log the verification link
      this.logger.log(`[DEV MODE] Verification email would be sent to ${to}`);
      this.logger.log(`[DEV MODE] Verification link: ${verificationLink}`);
    }
  }

  async sendPasswordResetEmail(
    to: string,
    username: string,
    resetToken: string,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from:
        this.configService.get<string>('EMAIL_FROM') || 'noreply@whoisit.com',
      to,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${username}, we received a request to reset your password. Click the button below to reset it:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            Or copy and paste this link in your browser:<br>
            <a href="${resetLink}" style="color: #dc3545;">${resetLink}</a>
          </p>
          <p style="color: #999; font-size: 12px;">
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hi ${username}, we received a request to reset your password. Click the link below to reset it:
        
        ${resetLink}
        
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
      `,
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Password reset email sent to ${to}`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${to}:`, error);
        throw error;
      }
    } else {
      this.logger.log(`[DEV MODE] Password reset email would be sent to ${to}`);
      this.logger.log(`[DEV MODE] Reset link: ${resetLink}`);
    }
  }
}
