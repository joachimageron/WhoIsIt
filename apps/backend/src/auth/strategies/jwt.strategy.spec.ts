import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    avatarUrl: null,
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
  } as any;

  beforeEach(async () => {
    const mockAuthService = {
      findById: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return user when user exists', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      authService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(authService.findById).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      authService.findById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.findById).toHaveBeenCalledWith('user-123');
    });
  });
});
