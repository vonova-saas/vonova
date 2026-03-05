import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrUpdateReviewDto {
  @ApiProperty({
    description: 'Rating for the item (1-5 stars)',
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
    example: 'Excellent JavaScript Guide!',
    maxLength: 120,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed review content',
    example:
      'This guide provided comprehensive coverage of JavaScript concepts with great examples.',
    maxLength: 2000,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;
}

export class ListReviewsQuery {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    type: Number,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    type: Number,
  })
  @IsOptional()
  limit?: number;
}
