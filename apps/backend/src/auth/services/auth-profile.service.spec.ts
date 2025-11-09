import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AuthProfileService } from './auth-profile.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { EmailService } from '../../email/email.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

// Mock bcrypt at the top level
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const bcrypt = require('bcrypt');

describe('AuthProfileService', () => {
  let service: AuthProfileService;
  let userRepository: jest.Mocked<Repository<User>>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    avatarUrl: null,
    emailVerified: true,
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockEmailService = {
      sendVerificationEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthProfileService,
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

    service = module.get<AuthProfileService>(AuthProfileService);
    userRepository = module.get(getRepositoryToken(User));
    emailService = module.get(EmailService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile', () => {
    it('should update username', async () => {
      const user = { ...mockUser } as User;
      const updateDto: UpdateProfileDto = {
        username: 'newusername',
      };

      userRepository.findOne
        .mockResolvedValueOnce(user) // First call for finding the user
        .mockResolvedValueOnce(null); // Second call for checking username uniqueness
      userRepository.save.mockResolvedValue({ ...user, username: 'newusername' } as User);

      const result = await service.updateProfile('user-123', updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'newusername' },
      });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if username is taken', async () => {
      const user = { ...mockUser } as User;
      const existingUser = { id: 'other-user', username: 'newusername' } as User;
      const updateDto: UpdateProfileDto = {
        username: 'newusername',
      };

      userRepository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(existingUser);

      await expect(
        service.updateProfile('user-123', updateDto),
      ).rejects.toThrow(ConflictException);
      
      // Clear the mock before the second call
      userRepository.findOne.mockClear();
      userRepository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(existingUser);
      
      await expect(
        service.updateProfile('user-123', updateDto),
      ).rejects.toThrow('Username already taken');
    });

    it('should update email and require re-verification', async () => {
      const user = { ...mockUser } as User;
      const updateDto: UpdateProfileDto = {
        email: 'newemail@example.com',
      };

      userRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue(user);

      await service.updateProfile('user-123', updateDto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newemail@example.com',
          emailVerified: false,
          verificationToken: expect.any(String),
          verificationTokenExpiresAt: expect.any(Date),
        }),
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'newemail@example.com',
        'testuser',
        expect.any(String),
      );
    });

    it('should throw ConflictException if email is taken', async () => {
      const user = { ...mockUser } as User;
      const existingUser = {
        id: 'other-user',
        email: 'newemail@example.com',
      } as User;
      const updateDto: UpdateProfileDto = {
        email: 'newemail@example.com',
      };

      userRepository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(existingUser);

      await expect(
        service.updateProfile('user-123', updateDto),
      ).rejects.toThrow(ConflictException);
      
      // Clear the mock before the second call
      userRepository.findOne.mockClear();
      userRepository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(existingUser);
      
      await expect(
        service.updateProfile('user-123', updateDto),
      ).rejects.toThrow('Email already in use');
    });

    it('should update avatar URL', async () => {
      const user = { ...mockUser } as User;
      const updateDto: UpdateProfileDto = {
        avatarUrl: 'https://example.com/new-avatar.jpg',
      };

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.updateProfile('user-123', updateDto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: 'https://example.com/new-avatar.jpg',
        }),
      );
    });

    it('should handle email verification failure gracefully', async () => {
      const user = { ...mockUser } as User;
      const updateDto: UpdateProfileDto = {
        email: 'newemail@example.com',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      userRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue(user);
      emailService.sendVerificationEmail.mockRejectedValue(
        new Error('Email service error'),
      );

      await service.updateProfile('user-123', updateDto);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send verification email:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const updateDto: UpdateProfileDto = {
        username: 'newusername',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent-user', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should change password with valid current password', async () => {
      const user = { ...mockUser } as User;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);

      await service.changePassword('user-123', changePasswordDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'oldPassword123',
        'hashed-password',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword456', 10);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: expect.any(String),
        }),
      );
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      const user = { ...mockUser } as User;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
      };

      userRepository.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent-user', changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user has no password', async () => {
      const userWithoutPassword = { ...mockUser, passwordHash: null } as User;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      userRepository.findOne.mockResolvedValue(userWithoutPassword);

      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow('Cannot change password for this account');
    });
  });
});
