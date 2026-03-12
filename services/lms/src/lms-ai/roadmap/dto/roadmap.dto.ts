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
import { SkillLevel } from '../interfaces/roadmap.interface';

export class GenerateRoadmapDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsEnum(SkillLevel)
  skill_level: SkillLevel;

  @IsNumber()
  @Min(1)
  @Max(52)
  duration_weeks: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focus_areas?: string[];
}

export class GetRoadmapParamsDto {
  @IsString()
  roadmapId: string;

  @IsString()
  userId: string;
}

export class UpdateProgressParamsDto {
  @IsString()
  roadmapId: string;

  @IsString()
  userId: string;
}

export class UpdateProgressDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  week_number?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  milestone_week?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress_percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  time_spent_minutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
