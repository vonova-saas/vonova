import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class WelcomeNotificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;
}
