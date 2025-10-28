import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsArray, Min, Max, IsNotEmpty } from 'class-validator';

export class GenerateRoadmapDto {
  @ApiProperty({
    description: 'Learning topic or subject',
    example: 'React.js',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({
    description: 'Skill level of the learner',
    enum: ['beginner', 'intermediate', 'advanced'],
    example: 'beginner'
  })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  skill_level: 'beginner' | 'intermediate' | 'advanced';

  @ApiProperty({
    description: 'Duration of the learning roadmap in weeks',
    example: 12,
    minimum: 1,
    maximum: 52
  })
  @IsNumber()
  @Min(1)
  @Max(52)
  duration_weeks: number;

  @ApiProperty({
    description: 'Specific focus areas or subtopics',
    example: ['hooks', 'state management', 'routing'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focus_areas?: string[];
}

export class GetRoadmapParamsDto {
  @ApiProperty({
    description: 'Unique roadmap identifier',
    example: 'roadmap-uuid-123'
  })
  @IsString()
  roadmapId: string;

  @ApiProperty({
    description: 'User identifier',
    example: 'user-uuid-456'
  })
  @IsString()
  userId: string;
}

export class UpdateProgressParamsDto {
  @ApiProperty({
    description: 'Unique roadmap identifier',
    example: 'roadmap-uuid-123'
  })
  @IsString()
  roadmapId: string;

  @ApiProperty({
    description: 'User identifier',
    example: 'user-uuid-456'
  })
  @IsString()
  userId: string;
}

export class UpdateProgressDto {
  @ApiProperty({
    description: 'Week number completed',
    example: 5,
    minimum: 1,
    maximum: 52,
    required: false
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
    required: false
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
    required: false
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
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  time_spent_minutes?: number;

  @ApiProperty({
    description: 'Notes about the progress',
    example: 'Completed React hooks section',
    maxLength: 1000,
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
