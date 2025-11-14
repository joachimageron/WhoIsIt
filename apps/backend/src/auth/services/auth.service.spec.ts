import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../../database/entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { EmailService } from '../../email/email.service';
import { AuthTokenService } from './auth-token.service';
import { AuthProfileService } from './auth-profile.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  const mockAuthTokenService = {
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockAuthProfileService = {
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: AuthTokenService,
          useValue: mockAuthTokenService,
        },
        {
          provide: AuthProfileService,
          useValue: mockAuthProfileService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = {
        id: 'uuid-123',
        email: registerDto.email,
        username: registerDto.username,
        passwordHash: 'hashed-password',
        avatarUrl: '/avatar/avatar_5.jpg',
        isGuest: false,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        accessToken: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          avatarUrl: mockUser.avatarUrl,
        },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: registerDto.email },
          { username: registerDto.username },
        ],
      });
      // Verify that avatarUrl is set to a valid avatar path
      expect(mockUserRepository.create).toHaveBeenCalled();
      const createCallArgs = mockUserRepository.create.mock
        .calls[0] as unknown[];
      const userObject = createCallArgs[0] as { avatarUrl?: string };
      expect(userObject.avatarUrl).toBeDefined();
      expect(userObject.avatarUrl).toMatch(/^\/avatar\/avatar_\d+\.jpg$/);
      expect(userObject.avatarUrl).toMatch(
        /^\/avatar\/avatar_(0|[1-9]|1[0-7])\.jpg$/,
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'password123',
      };

      const existingUser = {
        id: 'uuid-456',
        email: registerDto.email,
        username: registerDto.username,
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const mockUser = {
        id: 'uuid-123',
        email,
        username: 'testuser',
        passwordHash: hashedPassword,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [{ email }, { username: email }],
      });
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('correct-password', 10),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'wrong-password',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        username: 'testuser',
        avatarUrl: null,
      } as User;

      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(mockUser);

      expect(result).toEqual({
        accessToken: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          avatarUrl: mockUser.avatarUrl,
        },
      });
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('uuid-123');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
      });
    });
  });

  describe('createGuest', () => {
    it('should create a guest user with provided username', async () => {
      const createGuestDto = {
        username: 'GuestUser123',
      };

      const mockGuestUser = {
        id: 'uuid-456',
        username: 'GuestUser123',
        avatarUrl: '/avatar/avatar_5.jpg',
        isGuest: true,
        emailVerified: false,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockGuestUser);
      mockUserRepository.save.mockResolvedValue(mockGuestUser);
      mockJwtService.sign.mockReturnValue('guest-jwt-token');

      const result = await service.createGuest(createGuestDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'GuestUser123' },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'GuestUser123',
          isGuest: true,
          emailVerified: false,
        }),
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'uuid-456',
          email: null,
          username: 'GuestUser123',
        }),
      );
      expect(result).toEqual({
        accessToken: 'guest-jwt-token',
        user: {
          id: 'uuid-456',
          email: null,
          username: 'GuestUser123',
          avatarUrl: '/avatar/avatar_5.jpg',
        },
      });
    });

    it('should create a guest user with auto-generated username', async () => {
      const createGuestDto = {};

      const mockGuestUser = {
        id: 'uuid-789',
        username: expect.stringMatching(/^Guest_\d+_\d+$/),
        avatarUrl: '/avatar/avatar_3.jpg',
        isGuest: true,
        emailVerified: false,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockGuestUser);
      mockUserRepository.save.mockResolvedValue(mockGuestUser);
      mockJwtService.sign.mockReturnValue('guest-jwt-token');

      const result = await service.createGuest(createGuestDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: expect.stringMatching(/^Guest_\d+_\d+$/),
          isGuest: true,
          emailVerified: false,
        }),
      );
      expect(result.accessToken).toBe('guest-jwt-token');
      expect(result.user.id).toBe('uuid-789');
      expect(result.user.email).toBeNull();
    });

    it('should throw ConflictException if username already exists', async () => {
      const createGuestDto = {
        username: 'ExistingUser',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.createGuest(createGuestDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
