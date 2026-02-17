import { IsEmail, IsString, IsOptional } from 'class-validator';

export class OAuthGoogleLoginDto {
  @IsString()
  provider: string;

  @IsString()
  displayName: string;

  @IsString()
  providerId: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  userAgent: string;
}
