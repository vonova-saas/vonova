import { IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';

export class MarkLessonCompleteDto {
  @IsBoolean()
  completed: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpentSec?: number;
}

export class UpdateLessonWatchDto {
  @IsNumber()
  @Min(0)
  currentTime: number;

  @IsNumber()
  @Min(0)
  duration: number;
}
