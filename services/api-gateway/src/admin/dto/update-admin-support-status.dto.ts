import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class UpdateAdminSupportStatusDto {
  @ApiProperty({
    description: 'New status for the support ticket',
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    example: 'in-progress',
  })
  @IsString()
  @IsIn(['open', 'in-progress', 'resolved', 'closed'])
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
}

