import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

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
        displayName: 'Test User',
      };

      const mockUser = {
        id: 'uuid-123',
        email: registerDto.email,
        username: registerDto.username,
        displayName: registerDto.displayName,
        passwordHash: 'hashed-password',
        avatarUrl: null,
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
          displayName: mockUser.displayName,
          avatarUrl: mockUser.avatarUrl,
        },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: registerDto.email },
          { username: registerDto.username },
        ],
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'password123',
        displayName: 'Existing User',
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
    it('should return access token and user info', () => {
      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: null,
      } as User;

      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = service.login(mockUser);

      expect(result).toEqual({
        accessToken: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          displayName: mockUser.displayName,
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
});
