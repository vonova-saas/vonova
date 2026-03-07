import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WelcomeEmailDto {
  @ApiProperty({
    description: "User's email address",
    example: 'john.doe@example.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User's role in the system",
    example: 'STUDENT',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL if provided',
    example: 'https://example.com/profile.jpg',
    type: String,
  })
  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @ApiPropertyOptional({
    description: 'Optional coupon code for discounts',
    example: 'WELCOME20',
    type: String,
  })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiProperty({
    description: 'How the user found out about the service',
    example: 'social_media',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  knowAboutUs: string;

  @ApiPropertyOptional({
    description: 'User agent string from client',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    type: String,
  })
  @IsString()
  @IsOptional()
  userAgent?: string;
}
