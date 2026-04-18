import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateAdminUserStatusDto {
  @ApiProperty({
    description:
      'MongoDB ObjectId of the user whose active flag should be updated.',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description:
      'When `true`, the user may use the product (subject to other checks). When `false`, the account is treated as deactivated.',
    example: false,
  })
  @IsBoolean()
  isActive!: boolean;
}
