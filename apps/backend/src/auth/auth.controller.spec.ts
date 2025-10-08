import { Test, TestingModule } from '@nestjs/testing';
import { AuthController, RequestWithUser } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../database/entities/user.entity';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    updateLastSeen: jest.fn(),
  };

  const mockResponse = () => {
    const res = {} as Response;
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and set cookie', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
      };

      const expectedResponse = {
        accessToken: 'jwt-token',
        user: {
          id: 'uuid-123',
          email: registerDto.email,
          username: registerDto.username,
          displayName: registerDto.displayName,
          avatarUrl: null,
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResponse);

      const res = mockResponse();
      await controller.register(registerDto, res);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        }),
      );

      expect(res.json).toHaveBeenCalledWith({
        user: expectedResponse.user,
      });
    });
  });

  describe('login', () => {
    it('should login a user and set cookie', async () => {
      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: null,
      } as User;

      const expectedResponse = {
        accessToken: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          displayName: mockUser.displayName,
          avatarUrl: mockUser.avatarUrl,
        },
      };

      mockAuthService.login.mockReturnValue(expectedResponse);

      const req = { user: mockUser };
      const res = mockResponse();
      await controller.login(req as unknown as RequestWithUser, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        }),
      );

      expect(res.json).toHaveBeenCalledWith({
        user: expectedResponse.user,
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: null,
        isGuest: false,
      } as User;

      const req = { user: mockUser };
      const result = await controller.getProfile(
        req as unknown as RequestWithUser,
      );

      expect(mockAuthService.updateLastSeen).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        displayName: mockUser.displayName,
        avatarUrl: mockUser.avatarUrl,
        isGuest: mockUser.isGuest,
      });
    });
  });

  describe('logout', () => {
    it('should clear the access_token cookie', () => {
      const res = mockResponse();
      controller.logout(res);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.clearCookie).toHaveBeenCalledWith('access_token');

      expect(res.json).toHaveBeenCalledWith({
        message: 'Logged out successfully',
      });
    });
  });
});
