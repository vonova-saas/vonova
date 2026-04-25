import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class UpdateAdminSupportStatusDto {
  @ApiProperty({
    description: 'New status for the support ticket',
    enum: ['open', 'resolved'],
    example: 'open',
  })
  @IsString()
  @IsIn(['open', 'resolved'])
  status: 'open' | 'resolved';
}

