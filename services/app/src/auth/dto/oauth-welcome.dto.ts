import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class OAuthWelcomeDto {
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  knowAboutUs?: string;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  /** Allowed for client compatibility; not used by backend */
  @IsString()
  @IsOptional()
  answerOne?: string;
}
