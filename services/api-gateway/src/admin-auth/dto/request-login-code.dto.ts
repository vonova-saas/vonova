import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestLoginCodeDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@vonova.com',
    type: String,
    format: 'email'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'SecurePass123!@#',
    type: String,
    minLength: 1
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
