import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CoursePriceDto {
  @ApiProperty({
    description: 'Price amount for the course',
    example: 99.99,
    type: Number,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code for the price',
    example: 'USD',
    type: String,
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Whether the course is free or paid',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  isFree: boolean;
}

export class CreateCourseDto {
  @ApiProperty({
    description: 'Title of the course',
    example: 'Complete JavaScript Masterclass',
    type: String,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'URL-friendly slug for the course',
    example: 'complete-javascript-masterclass',
    type: String,
  })
  @IsString()
  slug: string;

  @ApiPropertyOptional({
    description: 'Brief description of the course',
    example: 'Learn JavaScript from scratch to advanced concepts.',
    type: String,
  })
  @IsOptional()
  @IsString()
  smallDescription?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the course',
    example:
      'This comprehensive JavaScript course covers everything from basics to advanced topics including ES6+, async programming, and modern frameworks.',
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level of the course',
    example: 'Intermediate',
    type: String,
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({
    description: 'Category ID for the course',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Array of tags for the course',
    example: ['javascript', 'web-development', 'programming'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'URL for the course thumbnail image',
    example: 'https://example.com/thumbnail.jpg',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'URL for the course trailer video',
    example: 'https://example.com/trailer.mp4',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  trailerUrl?: string;

  @ApiPropertyOptional({
    description: 'Language of the course content',
    example: 'English',
    type: String,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Pricing information for the course',
    type: CoursePriceDto,
  })
  @IsOptional()
  price?: CoursePriceDto;
}

export class UpdateCourseDto extends CreateCourseDto {
  @ApiPropertyOptional({
    description: 'Publication status of the course',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
    type: String,
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export class PublishCourseDto {
  @ApiProperty({
    description: 'Publication status for the course',
    enum: ['PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
    type: String,
  })
  @IsEnum(['PUBLISHED', 'ARCHIVED'])
  status: 'PUBLISHED' | 'ARCHIVED';
}
