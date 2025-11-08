import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { WsAuthAdapter } from './game/adapters/ws-auth.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Use custom WebSocket adapter with authentication
  app.useWebSocketAdapter(new WsAuthAdapter(app, configService));

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? true,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
