import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { LibraryTopics } from './topics.dto';

export type LibraryType = 'book' | 'guide' | 'presentation';

export class GetAllByTypeQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by content type',
    enum: ['book', 'guide', 'presentation'],
  })
  @IsOptional()
  @IsEnum(['book', 'guide', 'presentation'])
  type?: LibraryType;

  @ApiPropertyOptional({
    description: 'Search query for title, summary, and description',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by topics (comma-separated)',
    example: 'Programming Basics,Web Development,Data Structure',
  })
  @IsOptional()
  @IsString()
  topics?: string;

  @ApiPropertyOptional({
    description: 'Filter by difficulty level',
    enum: ['Beginner', 'Intermediate', 'Advanced'],
  })
  @IsOptional()
  @IsEnum(['Beginner', 'Intermediate', 'Advanced'])
  level?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['title', 'createdAt', 'updatedAt', 'views', 'rating'],
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;
}
