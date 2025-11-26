import { ApiProperty } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Font family', example: 'Inter', required: false })
  font?: string;

  @ApiProperty({ description: 'Font size', example: '16', required: false })
  fontSize?: string;

  @ApiProperty({ 
    description: 'Theme preference', 
    enum: ['light', 'dark', 'system'],
    example: 'system',
    required: false 
  })
  theme?: 'light' | 'dark' | 'system';

  @ApiProperty({ description: 'Language code', example: 'en', required: false })
  language?: string;

  @ApiProperty({ description: 'Timezone', example: 'America/New_York', required: false })
  timezone?: string;

  @ApiProperty({ description: 'Date format', example: 'MM/DD/YYYY', required: false })
  dateFormat?: string;
}
