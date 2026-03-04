import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetCodeDto {
  @ApiProperty({
    description: "User's email address for password reset verification",
    example: 'john.doe@example.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password reset verification code sent to user',
    example: '123456',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
