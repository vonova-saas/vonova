import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateDashboardSupportDto {
  @ApiProperty({
    description:
      'User-authored details: steps to reproduce (for bugs) or the suggestion (for feedback).',
    example:
      'After uploading a CV on Safari iOS, the success toast appears twice.',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  message: string;

  @ApiProperty({
    description:
      '`BUG` — defect or broken behaviour. `FEEDBACK` — improvement idea or general comment.',
    enum: ['BUG', 'FEEDBACK'],
    enumName: 'DashboardSupportType',
    example: 'FEEDBACK',
  })
  @IsEnum(['BUG', 'FEEDBACK'] as const)
  type: 'BUG' | 'FEEDBACK';
}
