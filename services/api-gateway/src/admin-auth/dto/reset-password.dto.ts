import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminResetPasswordDto {
  @ApiProperty({
    description: 'Current admin password for verification',
    example: 'OldSecurePass123!@#',
    type: String,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    description: 'New admin password (must be strong)',
    example: 'NewSecurePass456!@#',
    type: String,
    minLength: 8,
    pattern:
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{8,}$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;
}
