import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../services/auth.service';
import { User } from '../../database/entities/user.entity';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
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
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return user when credentials are valid', async () => {
      const emailOrUsername = 'testuser';
      const password = 'password123';

      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(emailOrUsername, password);

      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith(
        emailOrUsername,
        password,
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const emailOrUsername = 'testuser';
      const password = 'wrongpassword';

      authService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate(emailOrUsername, password),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        strategy.validate(emailOrUsername, password),
      ).rejects.toThrow('Invalid credentials');
      expect(authService.validateUser).toHaveBeenCalledWith(
        emailOrUsername,
        password,
      );
    });
  });
});
