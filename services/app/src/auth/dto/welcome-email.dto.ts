import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class WelcomeEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  profilePictureUrl: string;

  @IsString()
  @IsOptional()
  couponCode: string;

  @IsString()
  @IsNotEmpty()
  knowAboutUs: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
