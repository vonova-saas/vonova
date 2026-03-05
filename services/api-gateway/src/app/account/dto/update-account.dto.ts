import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAccountDto {
  @ApiPropertyOptional({
    description: "User's full name",
    example: 'John Doe',
    type: String,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "User's email address",
    example: 'john.doe@example.com',
    type: String,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "URL to user's avatar image",
    example: 'https://example.com/avatar.jpg',
    type: String,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'User biography or personal description',
    example:
      'Software developer passionate about creating innovative solutions.',
    maxLength: 500,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: "User's date of birth in ISO format",
    example: '1990-01-01',
    type: String,
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: "User's physical address",
    example: '123 Main St, City, Country',
    maxLength: 200,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;
}
