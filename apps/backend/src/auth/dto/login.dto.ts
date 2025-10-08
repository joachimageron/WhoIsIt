import {
  IsNotEmpty,
  IsString,
  ValidateIf,
  IsEmail,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @ValidateIf((o: LoginDto) => o.emailOrUsername?.includes('@'))
  @IsEmail({}, { message: 'Must be a valid email address' })
  emailOrUsername!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password!: string;
}
