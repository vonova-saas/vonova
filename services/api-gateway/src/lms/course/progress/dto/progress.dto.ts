import { IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkLessonCompleteDto {
  @ApiProperty({
    description: 'Whether the lesson is completed',
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  completed: boolean = true;

  @ApiPropertyOptional({
    description: 'Time spent on the lesson in seconds',
    example: 1800,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpentSec?: number;
}

export class UpdateLessonWatchDto {
  @ApiProperty({ description: 'Current playback position in seconds', example: 120 })
  @IsNumber()
  @Min(0)
  currentTime: number;

  @ApiProperty({ description: 'Video duration in seconds', example: 600 })
  @IsNumber()
  @Min(0)
  duration: number;
}
