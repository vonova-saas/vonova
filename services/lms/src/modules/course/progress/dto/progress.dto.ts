import { IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';

export class MarkLessonCompleteDto {
  @IsBoolean()
  completed: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpentSec?: number;
}