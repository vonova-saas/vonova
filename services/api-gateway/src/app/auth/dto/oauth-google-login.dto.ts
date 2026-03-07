import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OAuthGoogleLoginDto {
  @ApiProperty({
    description: 'OAuth provider name',
    example: 'google',
    type: String,
  })
  @IsString()
  provider: string;

  @ApiProperty({
    description: "User's display name from OAuth provider",
    example: 'John Doe',
    type: String,
  })
  @IsString()
  displayName: string;

  @ApiProperty({
    description: 'Unique provider ID for the user',
    example: '1234567890',
    type: String,
  })
  @IsString()
  providerId: string;

  @ApiPropertyOptional({
    description: "User's profile picture URL from OAuth provider",
    example: 'https://lh3.googleusercontent.com/photo.jpg',
    type: String,
  })
  @IsString()
  @IsOptional()
  picture?: string;

  @ApiPropertyOptional({
    description: "User's email address from OAuth provider",
    example: 'john.doe@gmail.com',
    type: String,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'User agent string from client',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    type: String,
  })
  @IsString()
  userAgent: string;
}
