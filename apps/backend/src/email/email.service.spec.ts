/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

interface MockTransporter {
  sendMail: jest.Mock<Promise<{ messageId: string }>, [any]>;
}

describe('EmailService', () => {
  let service: EmailService;
  let mockTransporter: MockTransporter;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  describe('initializeTransporter', () => {
    it('should initialize transporter with valid configuration', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, any> = {
          EMAIL_HOST: 'smtp.example.com',
          EMAIL_PORT: 587,
          EMAIL_USER: 'test@example.com',
          EMAIL_PASSWORD: 'password123',
        };
        return config[key];
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      });
    });

    it('should set secure to true when port is 465', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, any> = {
          EMAIL_HOST: 'smtp.example.com',
          EMAIL_PORT: 465,
          EMAIL_USER: 'test@example.com',
          EMAIL_PASSWORD: 'password123',
        };
        return config[key];
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      });
    });

    it('should not initialize transporter when configuration is missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });
  });

  describe('sendVerificationEmail', () => {
    beforeEach(async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, any> = {
          EMAIL_HOST: 'smtp.example.com',
          EMAIL_PORT: 587,
          EMAIL_USER: 'test@example.com',
          EMAIL_PASSWORD: 'password123',
          FRONTEND_URL: 'http://localhost:3000',
          EMAIL_FROM: 'noreply@whoisit.com',
        };
        return config[key];
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it('should call sendMail with correct parameters when transporter is configured', async () => {
      await service.sendVerificationEmail(
        'user@example.com',
        'testuser',
        'verification-token-123',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];

      expect(callArgs.from).toBe('noreply@whoisit.com');
      expect(callArgs.to).toBe('user@example.com');
      expect(callArgs.subject).toBe('Verify your email address');
      expect(callArgs.text).toContain('testuser');
      expect(callArgs.text).toContain(
        'http://localhost:3000/auth/verify-email/verification-token-123',
      );
    });

    it('should use default frontend URL when not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, any> = {
          EMAIL_HOST: 'smtp.example.com',
          EMAIL_PORT: 587,
          EMAIL_USER: 'test@example.com',
          EMAIL_PASSWORD: 'password123',
          EMAIL_FROM: 'noreply@whoisit.com',
        };
        return config[key];
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      await service.sendVerificationEmail(
        'user@example.com',
        'testuser',
        'verification-token-123',
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('http://localhost:3000');
    });

    it('should log in dev mode when transporter is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.sendVerificationEmail(
        'user@example.com',
        'testuser',
        'verification-token-123',
      );

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEV MODE]'),
      );
    });

    it('should throw error when email sending fails', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        service.sendVerificationEmail(
          'user@example.com',
          'testuser',
          'verification-token-123',
        ),
      ).rejects.toThrow('SMTP connection failed');
    });
  });

  describe('sendPasswordResetEmail', () => {
    beforeEach(async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, any> = {
          EMAIL_HOST: 'smtp.example.com',
          EMAIL_PORT: 587,
          EMAIL_USER: 'test@example.com',
          EMAIL_PASSWORD: 'password123',
          FRONTEND_URL: 'http://localhost:3000',
          EMAIL_FROM: 'noreply@whoisit.com',
        };
        return config[key];
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it('should call sendMail with correct parameters when transporter is configured', async () => {
      await service.sendPasswordResetEmail(
        'user@example.com',
        'testuser',
        'reset-token-456',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];

      expect(callArgs.from).toBe('noreply@whoisit.com');
      expect(callArgs.to).toBe('user@example.com');
      expect(callArgs.subject).toBe('Reset your password');
      expect(callArgs.text).toContain('testuser');
      expect(callArgs.text).toContain(
        'http://localhost:3000/auth/reset-password/reset-token-456',
      );
    });

    it('should use default frontend URL when not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, any> = {
          EMAIL_HOST: 'smtp.example.com',
          EMAIL_PORT: 587,
          EMAIL_USER: 'test@example.com',
          EMAIL_PASSWORD: 'password123',
          EMAIL_FROM: 'noreply@whoisit.com',
        };
        return config[key];
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      await service.sendPasswordResetEmail(
        'user@example.com',
        'testuser',
        'reset-token-456',
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('http://localhost:3000');
    });

    it('should log in dev mode when transporter is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.sendPasswordResetEmail(
        'user@example.com',
        'testuser',
        'reset-token-456',
      );

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEV MODE]'),
      );
    });

    it('should throw error when email sending fails', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        service.sendPasswordResetEmail(
          'user@example.com',
          'testuser',
          'reset-token-456',
        ),
      ).rejects.toThrow('SMTP connection failed');
    });
  });
});
