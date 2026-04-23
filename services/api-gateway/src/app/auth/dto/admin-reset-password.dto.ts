import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminResetPasswordBodyDto {
  @ApiProperty({
    description:
      'Current password (for seeded admins, the temporary password from ops)',
    example: 'Temp@12345',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    description: 'New password (min 8 characters)',
    example: 'MyStr0ng!NewSecret',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
