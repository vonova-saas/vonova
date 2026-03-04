import { IsInt, Min, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReaderBookProgressDto {
  @ApiProperty({
    description: 'The last page number the user has read',
    example: 125,
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  lastPage: number;

  @ApiPropertyOptional({
    description: 'Time spent reading in seconds',
    example: 3600,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSec?: number;

  @ApiPropertyOptional({
    description: 'Whether the user has completed the book',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
