import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: "User's email address for login",
    example: 'john.doe@example.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User's password",
    example: 'password123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
