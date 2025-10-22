import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { Socket } from 'socket.io';

export class WsAuthAdapter extends IoAdapter {
  private readonly logger = new Logger(WsAuthAdapter.name);

  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options);
    const jwtService = this.app.get(JwtService);
    const authService = this.app.get(AuthService);
    const jwtSecret =
      this.configService.get('JWT_SECRET') || 'your-secret-key';

    server.use(async (socket: Socket, next) => {
      try {
        // Try to extract JWT from cookies or auth header
        let token: string | null = null;

        // Extract from cookie
        const cookieHeader = socket.handshake.headers.cookie;
        if (cookieHeader) {
          const cookies = cookieHeader.split(';').reduce(
            (acc, cookie) => {
              const [key, value] = cookie.trim().split('=');
              acc[key] = value;
              return acc;
            },
            {} as Record<string, string>,
          );
          token = cookies['access_token'];
        }

        // Fallback to auth header
        if (!token) {
          const authHeader = socket.handshake.auth?.token;
          if (authHeader) {
            token = authHeader;
          }
        }

        if (!token) {
          this.logger.warn(
            `Socket ${socket.id} connecting without authentication`,
          );
          // Allow connection but mark as unauthenticated
          (socket as any).user = null;
          next();
          return;
        }

        // Verify JWT token
        const payload = jwtService.verify(token, { secret: jwtSecret });

        // Get user from database
        const user = await authService.findById(payload.sub);

        if (!user) {
          this.logger.warn(
            `Socket ${socket.id} has valid token but user not found`,
          );
          (socket as any).user = null;
          next();
          return;
        }

        // Attach user to socket
        (socket as any).user = user;
        this.logger.log(
          `Socket ${socket.id} authenticated as user ${user.id} (${user.username})`,
        );

        next();
      } catch (error) {
        this.logger.warn(
          `Socket ${socket.id} authentication failed: ${(error as Error).message}`,
        );
        // Allow connection but mark as unauthenticated
        (socket as any).user = null;
        next();
      }
    });

    return server;
  }
}
