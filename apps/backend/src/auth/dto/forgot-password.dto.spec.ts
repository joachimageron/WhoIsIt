import { validate } from 'class-validator';
import { ForgotPasswordDto } from './forgot-password.dto';

describe('ForgotPasswordDto', () => {
  it('should accept a valid email', async () => {
    const dto = new ForgotPasswordDto();
    dto.email = 'test@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject an invalid email format', async () => {
    const dto = new ForgotPasswordDto();
    dto.email = 'invalid@email';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.isEmail).toBeDefined();
  });

  it('should reject empty email', async () => {
    const dto = Object.assign(new ForgotPasswordDto(), {
      email: '',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should reject missing email', async () => {
    const dto = new ForgotPasswordDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });
});
