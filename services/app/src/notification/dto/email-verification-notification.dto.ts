import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EmailVerificationNotificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
