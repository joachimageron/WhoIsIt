import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('should accept a valid username', async () => {
    const dto = new LoginDto();
    dto.emailOrUsername = 'testuser';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept a valid email', async () => {
    const dto = new LoginDto();
    dto.emailOrUsername = 'test@example.com';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject an invalid email format', async () => {
    const dto = new LoginDto();
    dto.emailOrUsername = 'invalid@email';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('emailOrUsername');
    expect(errors[0].constraints?.isEmail).toBeDefined();
  });

  it('should reject empty password', async () => {
    const dto = Object.assign(new LoginDto(), {
      emailOrUsername: 'testuser',
      password: '',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });
});
