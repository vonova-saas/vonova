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
