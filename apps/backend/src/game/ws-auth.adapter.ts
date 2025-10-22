import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { User } from '../database/entities/user.entity';

// Extended socket type with user property
interface AuthenticatedSocket extends Socket {
  user?: User | null;
}

export class WsAuthAdapter extends IoAdapter {
  private readonly logger = new Logger(WsAuthAdapter.name);

  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    const jwtService = this.app.get(JwtService);
    const authService = this.app.get(AuthService);
    const jwtSecret = this.configService.get('JWT_SECRET') || 'your-secret-key';

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    server.use(async (socket: AuthenticatedSocket, next) => {
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
          const authHeader = socket.handshake.auth?.token as string | undefined;
          if (authHeader) {
            token = authHeader;
          }
        }

        if (!token) {
          this.logger.warn(
            `Socket ${socket.id} connecting without authentication`,
          );
          // Allow connection but mark as unauthenticated
          socket.user = null;
          next();
          return;
        }

        // Verify JWT token and cast to our payload type
        const payload = jwtService.verify(token, {
          secret: jwtSecret,
        });

        // Get user from database
        const user = await authService.findById(payload.sub);

        if (!user) {
          this.logger.warn(
            `Socket ${socket.id} has valid token but user not found`,
          );
          socket.user = null;
          next();
          return;
        }

        // Attach user to socket
        socket.user = user;
        this.logger.log(
          `Socket ${socket.id} authenticated as user ${user.id} (${user.username ?? 'no-username'})`,
        );

        next();
      } catch (error) {
        this.logger.warn(
          `Socket ${socket.id} authentication failed: ${(error as Error).message}`,
        );
        // Allow connection but mark as unauthenticated
        socket.user = null;
        next();
      }
    });

    return server;
  }
}
