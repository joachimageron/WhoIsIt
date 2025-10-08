import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import mjml2html from 'mjml';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private compileTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): string {
    const templatePath = path.join(
      __dirname,
      'templates',
      `${templateName}.mjml`,
    );

    try {
      let mjmlContent = fs.readFileSync(templatePath, 'utf-8');

      // Replace template variables
      Object.entries(variables).forEach(([key, value]) => {
        mjmlContent = mjmlContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      // Compile MJML to HTML
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const result = mjml2html(mjmlContent);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (result.errors && result.errors.length > 0) {
        this.logger.warn(
          `MJML compilation warnings for ${templateName}:`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          result.errors,
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return result.html;
    } catch (error) {
      this.logger.error(`Failed to compile template ${templateName}:`, error);
      throw error;
    }
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

    const html = this.compileTemplate('verify-email', {
      username,
      verificationLink,
    });

    const mailOptions = {
      from:
        this.configService.get<string>('EMAIL_FROM') || 'noreply@whoisit.com',
      to,
      subject: 'Verify your email address',
      html,
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

    const html = this.compileTemplate('reset-password', {
      username,
      resetLink,
    });

    const mailOptions = {
      from:
        this.configService.get<string>('EMAIL_FROM') || 'noreply@whoisit.com',
      to,
      subject: 'Reset your password',
      html,
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
