import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateGuestDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;
}
