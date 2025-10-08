import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('should accept valid registration data', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.username = 'testuser';
    dto.password = 'password123';
    dto.displayName = 'Test User';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid email format', async () => {
    const dto = new RegisterDto();
    dto.email = 'invalid-email';
    dto.username = 'testuser';
    dto.password = 'password123';
    dto.displayName = 'Test User';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.isEmail).toBeDefined();
  });

  it('should reject empty email', async () => {
    const dto = new RegisterDto();
    dto.email = '';
    dto.username = 'testuser';
    dto.password = 'password123';
    dto.displayName = 'Test User';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('should reject username shorter than 3 characters', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.username = 'ab';
    dto.password = 'password123';
    dto.displayName = 'Test User';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
    expect(errors[0].constraints?.minLength).toBeDefined();
  });

  it('should reject password shorter than 6 characters', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.username = 'testuser';
    dto.password = '12345';
    dto.displayName = 'Test User';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints?.minLength).toBeDefined();
  });

  it('should reject empty displayName', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.username = 'testuser';
    dto.password = 'password123';
    dto.displayName = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const displayNameError = errors.find((e) => e.property === 'displayName');
    expect(displayNameError).toBeDefined();
  });
});
