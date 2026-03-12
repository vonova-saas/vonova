import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  BEGINNER_CAP = 'Beginner',
  INTERMEDIATE_CAP = 'Intermediate',
  ADVANCED_CAP = 'Advanced',
}

export class GenerateRoadmapDto {
  @ApiProperty({
    description: 'Learning topic or subject',
    example: 'React.js',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({
    description: 'Skill level of the learner',
    enum: SkillLevel,
    example: SkillLevel.BEGINNER,
  })
  @IsEnum(SkillLevel, {
    message: `skill_level must be one of the following values: ${Object.values(SkillLevel).join(', ')}`,
  })
  skill_level: SkillLevel;

  @ApiProperty({
    description: 'Duration of the learning roadmap in weeks',
    example: 12,
    minimum: 1,
    maximum: 52,
  })
  @IsNumber()
  @Min(1)
  @Max(52)
  duration_weeks: number;

  @ApiProperty({
    description: 'Specific focus areas or subtopics',
    example: ['hooks', 'state management', 'routing'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focus_areas?: string[];
}

export class UpdateRoadmapProgressDto {
  @ApiProperty({
    description: 'Week number completed',
    example: 5,
    minimum: 1,
    maximum: 52,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  week_number?: number;

  @ApiProperty({
    description: 'Milestone week reached',
    example: 8,
    minimum: 1,
    maximum: 52,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  milestone_week?: number;

  @ApiProperty({
    description: 'Overall progress percentage',
    example: 75,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress_percentage?: number;

  @ApiProperty({
    description: 'Time spent in minutes',
    example: 120,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  time_spent_minutes?: number;

  @ApiProperty({
    description: 'Notes about the progress',
    example: 'Completed React hooks section',
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkDeleteRoadmapsDto {
  @ApiProperty({
    description: 'Array of roadmap IDs to delete',
    example: ['roadmap-id-1', 'roadmap-id-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  roadmap_ids: string[];
}
