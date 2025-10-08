import { validate } from 'class-validator';
import { ResetPasswordDto } from './reset-password.dto';

describe('ResetPasswordDto', () => {
  it('should accept valid token and password', async () => {
    const dto = new ResetPasswordDto();
    dto.token = 'validtoken123';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject empty token', async () => {
    const dto = Object.assign(new ResetPasswordDto(), {
      token: '',
      password: 'password123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('token');
  });

  it('should reject missing token', async () => {
    const dto = new ResetPasswordDto();
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('token');
  });

  it('should reject password shorter than 6 characters', async () => {
    const dto = new ResetPasswordDto();
    dto.token = 'validtoken123';
    dto.password = '12345';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints?.minLength).toBeDefined();
  });

  it('should reject empty password', async () => {
    const dto = Object.assign(new ResetPasswordDto(), {
      token: 'validtoken123',
      password: '',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should reject missing password', async () => {
    const dto = new ResetPasswordDto();
    dto.token = 'validtoken123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });
});
