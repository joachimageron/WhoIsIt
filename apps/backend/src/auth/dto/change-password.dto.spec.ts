import { validate } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';

describe('ChangePasswordDto', () => {
  it('should pass validation with valid passwords', async () => {
    const dto = new ChangePasswordDto();
    dto.currentPassword = 'oldPassword123';
    dto.newPassword = 'newPassword123';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with missing currentPassword', async () => {
    const dto = new ChangePasswordDto();
    dto.newPassword = 'newPassword123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('currentPassword');
  });

  it('should fail validation with missing newPassword', async () => {
    const dto = new ChangePasswordDto();
    dto.currentPassword = 'oldPassword123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('newPassword');
  });

  it('should fail validation with newPassword shorter than 6 characters', async () => {
    const dto = new ChangePasswordDto();
    dto.currentPassword = 'oldPassword123';
    dto.newPassword = '12345';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('newPassword');
  });

  it('should fail validation with empty currentPassword', async () => {
    const dto = new ChangePasswordDto();
    dto.currentPassword = '';
    dto.newPassword = 'newPassword123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('currentPassword');
  });

  it('should fail validation with empty newPassword', async () => {
    const dto = new ChangePasswordDto();
    dto.currentPassword = 'oldPassword123';
    dto.newPassword = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('newPassword');
  });
});
