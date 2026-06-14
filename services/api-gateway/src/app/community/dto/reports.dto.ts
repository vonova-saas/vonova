import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const REPORT_REASONS = [
  'spam',
  'harassment',
  'hate',
  'violence',
  'misinformation',
  'impersonation',
  'nsfw',
  'copyright',
  'scam',
  'illegal-content',
  'other',
] as const;

const TARGET_TYPES = [
  'POST',
  'COMMENT',
  'REPOST',
  'MESSAGE',
  'USER',
  'GROUP',
] as const;

const REPORT_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED'] as const;

const RESOLUTION_ACTIONS = [
  'REMOVE_CONTENT',
  'WARN_USER',
  'TEMP_MUTE',
  'TEMP_BAN',
  'PERMANENT_BAN',
  'NO_ACTION',
] as const;

export class CreateContentReportDto {
  @ApiProperty({ enum: TARGET_TYPES })
  @IsEnum(TARGET_TYPES)
  targetType!: (typeof TARGET_TYPES)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  targetId!: string;

  @ApiProperty({ enum: REPORT_REASONS })
  @IsEnum(REPORT_REASONS)
  reason!: (typeof REPORT_REASONS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupId?: string;
}

export class UpdateReportStatusDto {
  @ApiProperty({ enum: REPORT_STATUSES })
  @IsEnum(REPORT_STATUSES)
  status!: (typeof REPORT_STATUSES)[number];
}

export class ApplyReportActionDto {
  @ApiProperty({ enum: RESOLUTION_ACTIONS })
  @IsEnum(RESOLUTION_ACTIONS)
  action!: (typeof RESOLUTION_ACTIONS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
