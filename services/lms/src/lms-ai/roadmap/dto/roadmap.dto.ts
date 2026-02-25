import { IsString, IsEnum, IsNumber, IsOptional, IsArray, Min, Max, IsNotEmpty } from 'class-validator';

export class GenerateRoadmapDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsEnum(['beginner', 'intermediate', 'advanced'])
  skill_level: 'beginner' | 'intermediate' | 'advanced';

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
