import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class WelcomeEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsString()
  @IsOptional()
  knowAboutUs?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  /** Allowed for client compatibility; not used by backend */
  @IsString()
  @IsOptional()
  answerOne?: string;
}
