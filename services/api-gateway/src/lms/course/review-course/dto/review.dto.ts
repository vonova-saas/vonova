import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewCourseDto {
  @ApiProperty({
    description: 'Rating for the course (1-5 stars)',
    example: 5,
    minimum: 1,
    maximum: 5,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Optional title for the review',
    example: 'Excellent JavaScript Course!',
    maxLength: 120,
    type: String,
  })
  @IsString()
  @MaxLength(120)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed review content',
    example: 'This course provided comprehensive coverage of JavaScript concepts with great examples and exercises.',
    maxLength: 2000,
    type: String,
  })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  body?: string;
}
