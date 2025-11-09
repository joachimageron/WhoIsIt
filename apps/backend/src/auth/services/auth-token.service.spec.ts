import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { EmailService } from '../../email/email.service';

// Mock bcrypt at the top level
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthTokenService', () => {
  let service: AuthTokenService;
  let userRepository: jest.Mocked<Repository<User>>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    emailVerified: false,
    verificationToken: 'valid-token',
    verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    passwordResetToken: null,
    passwordResetTokenExpiresAt: null,
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockEmailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthTokenService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthTokenService>(AuthTokenService);
    userRepository = module.get(getRepositoryToken(User));
    emailService = module.get(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const user = { ...mockUser } as User;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.verifyEmail('valid-token');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { verificationToken: 'valid-token' },
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiresAt: null,
        }),
      );
    });

    it('should throw BadRequestException if token is invalid', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        'Invalid verification token',
      );
    });

    it('should throw BadRequestException if email is already verified', async () => {
      const verifiedUser = { ...mockUser, emailVerified: true } as User;
      userRepository.findOne.mockResolvedValue(verifiedUser);

      await expect(service.verifyEmail('valid-token')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail('valid-token')).rejects.toThrow(
        'Email already verified',
      );
    });

    it('should throw BadRequestException if token is expired', async () => {
      const expiredUser = {
        ...mockUser,
        verificationTokenExpiresAt: new Date(Date.now() - 1000),
      } as User;
      userRepository.findOne.mockResolvedValue(expiredUser);

      await expect(service.verifyEmail('valid-token')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail('valid-token')).rejects.toThrow(
        'Verification token expired',
      );
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      const user = { ...mockUser } as User;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.resendVerificationEmail('test@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationToken: expect.any(String),
          verificationTokenExpiresAt: expect.any(Date),
        }),
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
        expect.any(String),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.resendVerificationEmail('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.resendVerificationEmail('nonexistent@example.com'),
      ).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException if email is already verified', async () => {
      const verifiedUser = { ...mockUser, emailVerified: true } as User;
      userRepository.findOne.mockResolvedValue(verifiedUser);

      await expect(
        service.resendVerificationEmail('test@example.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resendVerificationEmail('test@example.com'),
      ).rejects.toThrow('Email already verified');
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email', async () => {
      const user = { ...mockUser } as User;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.requestPasswordReset('test@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetTokenExpiresAt: expect.any(Date),
        }),
      );
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
        expect.any(String),
      );
    });

    it('should not throw error if user does not exist (security)', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.requestPasswordReset('nonexistent@example.com'),
      ).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const user = {
        ...mockUser,
        passwordResetToken: 'valid-reset-token',
        passwordResetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      } as User;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.resetPassword('valid-reset-token', 'newPassword123');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { passwordResetToken: 'valid-reset-token' },
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: expect.any(String),
          passwordResetToken: null,
          passwordResetTokenExpiresAt: null,
        }),
      );
    });

    it('should throw BadRequestException if token is invalid', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'newPassword123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resetPassword('invalid-token', 'newPassword123'),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw BadRequestException if token is expired', async () => {
      const expiredUser = {
        ...mockUser,
        passwordResetToken: 'valid-reset-token',
        passwordResetTokenExpiresAt: new Date(Date.now() - 1000),
      } as User;
      userRepository.findOne.mockResolvedValue(expiredUser);

      await expect(
        service.resetPassword('valid-reset-token', 'newPassword123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resetPassword('valid-reset-token', 'newPassword123'),
      ).rejects.toThrow('Reset token has expired');
    });
  });
});
