import { validate } from 'class-validator';
import { CreateGuestDto } from './create-guest.dto';

describe('CreateGuestDto', () => {
  it('should pass validation with valid username', async () => {
    const dto = new CreateGuestDto();
    dto.username = 'GuestUser123';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation without username (optional)', async () => {
    const dto = new CreateGuestDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation if username is too short', async () => {
    const dto = new CreateGuestDto();
    dto.username = 'ab';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
  });
});
