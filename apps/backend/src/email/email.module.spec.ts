import { Test, TestingModule } from '@nestjs/testing';
import { EmailModule } from './email.module';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config';

describe('EmailModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EmailModule, ConfigModule.forRoot({ isGlobal: true })],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide EmailService', () => {
    const service = module.get<EmailService>(EmailService);
    expect(service).toBeDefined();
  });
});
