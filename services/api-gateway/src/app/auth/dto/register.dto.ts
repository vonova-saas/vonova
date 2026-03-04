import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: "User's full name",
    example: 'John Doe',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "User's email address",
    example: 'john.doe@example.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User's password (minimum 6 characters)",
    example: 'password123',
    minLength: 6,
    type: String,
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}
