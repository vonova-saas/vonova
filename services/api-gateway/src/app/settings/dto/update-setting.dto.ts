import { IsBoolean, IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiPropertyOptional({
    description: 'User interface theme preference',
    enum: ['light', 'dark', 'system'],
    example: 'dark',
    type: String,
  })
  @IsOptional()
  @IsString()
  theme?: 'light' | 'dark' | 'system';

  @ApiPropertyOptional({
    description: 'User interface language preference',
    example: 'en',
    type: String,
  })
  @IsOptional()
  @IsString()
  language?: string;

  // notifications part
  @ApiPropertyOptional({
    description: 'Notification preferences for in-app notifications',
    enum: ['all', 'mentions', 'none'],
    example: 'all',
    type: String,
  })
  @IsOptional()
  @IsString()
  type?: 'all' | 'mentions' | 'none';

  @ApiPropertyOptional({
    description: 'Enable or disable communication emails',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  communication_emails?: boolean;

  @ApiPropertyOptional({
    description: 'Enable or disable marketing and promotional emails',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  marketing_emails?: boolean;

  @ApiPropertyOptional({
    description: 'Enable or disable social notification emails',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  social_emails?: boolean;

  @ApiPropertyOptional({
    description: 'Enable or disable security-related emails',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  security_emails?: boolean;

  @ApiPropertyOptional({
    description: 'Enable or disable mobile push notifications',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  mobile?: boolean;
}
