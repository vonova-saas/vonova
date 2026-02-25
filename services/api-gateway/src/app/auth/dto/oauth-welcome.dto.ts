import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class OAuthWelcomeDto {
  @IsString()
  @IsOptional()
  providerId?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

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

  @IsString()
  @IsOptional()
  answerOne?: string;
}
