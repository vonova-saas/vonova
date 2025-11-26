import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { CreateSettingDto } from './create-setting.dto';

export class UpdateSettingDto extends PartialType(CreateSettingDto) {
  @ApiProperty({ description: 'Font family', example: 'Inter', required: false })
  @IsString()
  @IsOptional()
  font?: string;

  @ApiProperty({ description: 'Font size', example: '16', required: false })
  @IsString()
  @IsOptional()
  fontSize?: string;

  @ApiProperty({ 
    description: 'Theme preference', 
    enum: ['light', 'dark', 'system'],
    example: 'system',
    required: false 
  })
  @IsIn(['light', 'dark', 'system'])
  @IsOptional()
  theme?: 'light' | 'dark' | 'system';

  @ApiProperty({ description: 'Language code', example: 'en', required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ description: 'Timezone', example: 'America/New_York', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ description: 'Date format', example: 'MM/DD/YYYY', required: false })
  @IsString()
  @IsOptional()
  dateFormat?: string;
}
