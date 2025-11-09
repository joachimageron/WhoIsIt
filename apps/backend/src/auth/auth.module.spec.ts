import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { AuthTokenService } from './services/auth-token.service';
import { AuthProfileService } from './services/auth-profile.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../database/entities';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from '../email/email.service';

describe('AuthModule', () => {
  let module: TestingModule;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AuthModule, ConfigModule.forRoot({ isGlobal: true })],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockRepository)
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AuthController', () => {
    const controller = module.get<AuthController>(AuthController);
    expect(controller).toBeDefined();
  });

  it('should provide AuthService', () => {
    const service = module.get<AuthService>(AuthService);
    expect(service).toBeDefined();
  });

  it('should provide AuthTokenService', () => {
    const service = module.get<AuthTokenService>(AuthTokenService);
    expect(service).toBeDefined();
  });

  it('should provide AuthProfileService', () => {
    const service = module.get<AuthProfileService>(AuthProfileService);
    expect(service).toBeDefined();
  });

  it('should provide LocalStrategy', () => {
    const strategy = module.get<LocalStrategy>(LocalStrategy);
    expect(strategy).toBeDefined();
  });

  it('should provide JwtStrategy', () => {
    const strategy = module.get<JwtStrategy>(JwtStrategy);
    expect(strategy).toBeDefined();
  });

  it('should export AuthService', () => {
    const service = module.get<AuthService>(AuthService);
    expect(service).toBeDefined();
  });
});
