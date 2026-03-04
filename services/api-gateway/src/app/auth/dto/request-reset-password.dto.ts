import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestResetPasswordDto {
  @ApiProperty({
    description: "User's email address for password reset request",
    example: 'john.doe@example.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
