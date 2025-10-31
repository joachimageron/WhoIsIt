import { validate } from 'class-validator';
import { UpdateProfileDto } from './update-profile.dto';

describe('UpdateProfileDto', () => {
  it('should pass validation with valid username', async () => {
    const dto = new UpdateProfileDto();
    dto.username = 'newuser';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with valid email', async () => {
    const dto = new UpdateProfileDto();
    dto.email = 'newemail@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with valid avatarUrl', async () => {
    const dto = new UpdateProfileDto();
    dto.avatarUrl = 'https://example.com/avatar.jpg';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with username shorter than 3 characters', async () => {
    const dto = new UpdateProfileDto();
    dto.username = 'ab';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
  });

  it('should fail validation with invalid email', async () => {
    const dto = new UpdateProfileDto();
    dto.email = 'invalid-email';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail validation with invalid avatarUrl', async () => {
    const dto = new UpdateProfileDto();
    dto.avatarUrl = 'not-a-url';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('avatarUrl');
  });

  it('should pass validation with empty object', async () => {
    const dto = new UpdateProfileDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
