import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OAuthWelcomeDto {
  @ApiProperty({
    description: 'OAuth provider ID for user identification',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({
    description: 'User agent string from client',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @ApiProperty({
    description: "User's role in the system",
    example: 'STUDENT_USER',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    description: "User's chosen username",
    example: 'johndoe123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'How the user found out about the service',
    example: 'social_media',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  knowAboutUs: string;

  @ApiPropertyOptional({
    description: 'Optional coupon code for discounts',
    example: 'WELCOME20',
    type: String,
  })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL if provided',
    example: 'https://example.com/profile.jpg',
    type: String,
  })
  @IsString()
  @IsOptional()
  profilePictureUrl?: string;
}
