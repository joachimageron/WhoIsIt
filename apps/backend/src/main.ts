import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { WsAuthAdapter } from './auth/ws-auth.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Use custom WebSocket adapter with authentication
  app.useWebSocketAdapter(new WsAuthAdapter(app, configService));

  // Security headers
  app.use(helmet());

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration - restrict origins in production
  const frontendOrigin = process.env.FRONTEND_ORIGIN;
  app.enableCors({
    origin: frontendOrigin || false, // Changed from true to false for security
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
