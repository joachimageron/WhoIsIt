import { Test, TestingModule } from '@nestjs/testing';
import { INestApplicationContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { WsAuthAdapter } from './ws-auth.adapter';
import { AuthService } from './services/auth.service';
import { User } from '../database/entities/user.entity';
import { Server } from 'socket.io';

describe('WsAuthAdapter', () => {
  let adapter: WsAuthAdapter;
  let mockApp: INestApplicationContext;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockServer: jest.Mocked<Server>;

  beforeEach(async () => {
    mockJwtService = {
      verify: jest.fn(),
    } as any;

    mockAuthService = {
      findById: jest.fn(),
    } as any;

    mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret-key'),
    } as any;

    mockApp = {
      get: jest.fn((token) => {
        if (token === JwtService) return mockJwtService;
        if (token === AuthService) return mockAuthService;
        return null;
      }),
    } as any;

    // Mock the server
    mockServer = {
      use: jest.fn(),
      _middleware: [],
    } as any;

    // Mock the parent class's createIOServer to avoid actual server creation
    jest.spyOn(IoAdapter.prototype, 'createIOServer').mockReturnValue(mockServer);

    adapter = new WsAuthAdapter(mockApp, mockConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('createIOServer', () => {
    it('should create server with authentication middleware', () => {
      const server = adapter.createIOServer(3001);
      expect(server).toBeDefined();
      expect(mockServer.use).toHaveBeenCalled();
    });

    it('should authenticate socket with valid token from cookie', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      } as User;

      mockJwtService.verify.mockReturnValue({ sub: 'user-123' });
      mockAuthService.findById.mockResolvedValue(mockUser);

      adapter.createIOServer(3001);
      
      // Get the middleware function that was passed to server.use()
      expect(mockServer.use).toHaveBeenCalled();
      const authMiddleware = (mockServer.use as jest.Mock).mock.calls[0][0];
      
      const mockSocket = {
        id: 'socket-123',
        handshake: {
          headers: {
            cookie: 'access_token=valid-jwt-token',
          },
          auth: {},
        },
        user: null,
      };

      const mockNext = jest.fn();
      await authMiddleware(mockSocket, mockNext);

      expect(mockSocket.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should authenticate socket with valid token from auth header', async () => {
      const mockUser = {
        id: 'user-456',
        username: 'authuser',
        email: 'auth@example.com',
      } as User;

      mockJwtService.verify.mockReturnValue({ sub: 'user-456' });
      mockAuthService.findById.mockResolvedValue(mockUser);

      adapter.createIOServer(3001);
      const authMiddleware = (mockServer.use as jest.Mock).mock.calls[0][0];

      const mockSocket = {
        id: 'socket-456',
        handshake: {
          headers: {},
          auth: {
            token: 'valid-jwt-token',
          },
        },
        user: null,
      };

      const mockNext = jest.fn();
      await authMiddleware(mockSocket, mockNext);

      expect(mockSocket.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow connection without token but mark as unauthenticated', async () => {
      adapter.createIOServer(3001);
      const authMiddleware = (mockServer.use as jest.Mock).mock.calls[0][0];

      const mockSocket = {
        id: 'socket-unauth',
        handshake: {
          headers: {},
          auth: {},
        },
        user: undefined,
      };

      const mockNext = jest.fn();
      await authMiddleware(mockSocket, mockNext);

      expect(mockSocket.user).toBeNull();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle invalid token gracefully', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      adapter.createIOServer(3001);
      const authMiddleware = (mockServer.use as jest.Mock).mock.calls[0][0];

      const mockSocket = {
        id: 'socket-invalid',
        handshake: {
          headers: {
            cookie: 'access_token=invalid-token',
          },
          auth: {},
        },
        user: undefined,
      };

      const mockNext = jest.fn();
      await authMiddleware(mockSocket, mockNext);

      expect(mockSocket.user).toBeNull();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle valid token but user not found', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'non-existent-user' });
      mockAuthService.findById.mockResolvedValue(null);

      adapter.createIOServer(3001);
      const authMiddleware = (mockServer.use as jest.Mock).mock.calls[0][0];

      const mockSocket = {
        id: 'socket-no-user',
        handshake: {
          headers: {
            cookie: 'access_token=valid-but-no-user',
          },
          auth: {},
        },
        user: undefined,
      };

      const mockNext = jest.fn();
      await authMiddleware(mockSocket, mockNext);

      expect(mockSocket.user).toBeNull();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should parse cookies correctly', async () => {
      const mockUser = {
        id: 'user-789',
        username: 'cookieuser',
        email: 'cookie@example.com',
      } as User;

      mockJwtService.verify.mockReturnValue({ sub: 'user-789' });
      mockAuthService.findById.mockResolvedValue(mockUser);

      adapter.createIOServer(3001);
      const authMiddleware = (mockServer.use as jest.Mock).mock.calls[0][0];

      const mockSocket = {
        id: 'socket-cookies',
        handshake: {
          headers: {
            cookie: 'other_cookie=value1; access_token=jwt-token; another=value2',
          },
          auth: {},
        },
        user: null,
      };

      const mockNext = jest.fn();
      await authMiddleware(mockSocket, mockNext);

      expect(mockJwtService.verify).toHaveBeenCalledWith('jwt-token', {
        secret: 'test-secret-key',
      });
      expect(mockSocket.user).toEqual(mockUser);
    });

    it('should prioritize cookie over auth header', async () => {
      const mockUser = {
        id: 'user-priority',
        username: 'priorityuser',
        email: 'priority@example.com',
      } as User;

      mockJwtService.verify.mockReturnValue({ sub: 'user-priority' });
      mockAuthService.findById.mockResolvedValue(mockUser);

      adapter.createIOServer(3001);
      const authMiddleware = (mockServer.use as jest.Mock).mock.calls[0][0];

      const mockSocket = {
        id: 'socket-priority',
        handshake: {
          headers: {
            cookie: 'access_token=cookie-token',
          },
          auth: {
            token: 'auth-header-token',
          },
        },
        user: null,
      };

      const mockNext = jest.fn();
      await authMiddleware(mockSocket, mockNext);

      // Should use cookie token, not auth header token
      expect(mockJwtService.verify).toHaveBeenCalledWith('cookie-token', {
        secret: 'test-secret-key',
      });
      expect(mockSocket.user).toEqual(mockUser);
    });

    it('should handle empty cookie header', async () => {
      adapter.createIOServer(3001);
      const authMiddleware = (mockServer.use as jest.Mock).mock.calls[0][0];

      const mockSocket = {
        id: 'socket-empty-cookie',
        handshake: {
          headers: {
            cookie: '',
          },
          auth: {},
        },
        user: undefined,
      };

      const mockNext = jest.fn();
      await authMiddleware(mockSocket, mockNext);

      expect(mockSocket.user).toBeNull();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
