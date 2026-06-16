import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsArray,
  IsString,
  IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum LibraryTopics {
  PROGRAMMING_BASICS = 'Programming Basics',
  WEB_DEVELOPMENT = 'Web Development',
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  FULLSTACK = 'FULLSTACK',
  FLUTTER = 'FLUTTER',
  MOBILE_DEVELOPMENT = 'Mobile Development',
  AI = 'AI',
  MACHINE_LEARNING = 'Machine Learning',
  DATA_SCIENCE = 'Data Science',
  CYBER_SECURITY = 'CYBER SECURITY',
  DEVOPS = 'DEVOPS',
  UIUX = 'UI UX',
  DATABASE_DESIGN = 'Database Design',
  PROBLEM_SOLVING = 'Problem Solving',
  DATA_STRUCTURE = 'Data Structure',
  ALGORITHMS = 'Algorithms',
  CLOUD_COMPUTING = 'Cloud Computing',
  OTHER = 'OTHER',
}

export class GetTopicsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by specific topic',
    enum: LibraryTopics,
  })
  @IsOptional()
  @IsEnum(LibraryTopics)
  topic?: LibraryTopics;

  @ApiPropertyOptional({
    description: 'Filter by multiple topics (comma-separated)',
    example: 'Programming Basics,Web Development',
  })
  @IsOptional()
  @IsString()
  topics?: string;

  @ApiPropertyOptional({
    description: 'Filter by content type',
    enum: ['book', 'guide', 'presentation'],
  })
  @IsOptional()
  @IsEnum(['book', 'guide', 'presentation'])
  type?: string;

  @ApiPropertyOptional({
    description: 'Search query for title, summary, and description',
  })
  @IsOptional()
  @IsString()
  q?: string;

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

export class TopicsResponseDto {
  @ApiProperty({
    description: 'Array of available topics',
    enum: LibraryTopics,
    isArray: true,
  })
  topics: LibraryTopics[];

  @ApiProperty({
    description: 'Total count of topics',
    example: 8,
  })
  total: number;
}
