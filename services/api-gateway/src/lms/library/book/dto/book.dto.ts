import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LibraryTopics } from '../../library/dto/topics.dto';

export class AuthorDto {
  @ApiProperty({
    description: 'Name of the author',
    example: 'John Doe',
    type: String,
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    description: "URL for the author' profile picture",
    example: 'https://example.com/author-avatar.jpg',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

export class CreateBookDto {
  @ApiProperty({
    description: 'Title of the book',
    example: 'JavaScript: The Complete Guide',
    type: String,
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'URL-friendly slug for the book',
    example: 'javascript-complete-guide',
    type: String,
  })
  @IsString()
  @MinLength(1)
  slug: string;

  @ApiPropertyOptional({
    description: 'Brief summary of the book',
    example: 'A comprehensive guide to JavaScript programming.',
    type: String,
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the book',
    example:
      'This book covers everything from basic JavaScript concepts to advanced topics including ES6+, async programming, and modern frameworks.',
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Array of book authors',
    type: [AuthorDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  authors: AuthorDto[] = [];

  @ApiPropertyOptional({
    description: 'Array of topics covered in the book',
    example: ['Programming Basics', 'Web Development', 'Data Structure'],
    enum: LibraryTopics,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(LibraryTopics, { each: true })
  topics: string[] = [];

  @ApiPropertyOptional({
    description: 'Difficulty level of the book',
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    example: 'Intermediate',
    type: String,
  })
  @IsOptional()
  @IsEnum(['Beginner', 'Intermediate', 'Advanced'])
  level?: 'Beginner' | 'Intermediate' | 'Advanced';

  @ApiPropertyOptional({
    description: 'Subject category (e.g. FRONTEND, CYBER_SECURITY)',
    example: 'FRONTEND',
    type: String,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'URL for the book cover image',
    example: 'https://example.com/book-cover.jpg',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @ApiPropertyOptional({
    description: 'Language of the book content',
    example: 'en',
    type: String,
  })
  @IsOptional()
  @IsString()
  language?: string = 'en';

  @ApiPropertyOptional({
    description: 'Array of badges or achievements',
    example: ['bestseller', 'recommended'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[] = [];

  @ApiPropertyOptional({
    description: 'Number of pages in the book',
    example: 450,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pageCount?: number = 0;

  @ApiPropertyOptional({
    description: 'Estimated reading time in minutes',
    example: 180,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  readingTimeMin?: number = 0;

  @ApiPropertyOptional({
    description: 'Publication status of the book',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
    type: String,
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' = 'PUBLISHED';

  @ApiPropertyOptional({
    description:
      'Visibility. PUBLIC books appear in the global Material Library. PRIVATE books only show to students enrolled in `courseId` (typically via the attached lesson).',
    enum: ['PUBLIC', 'PRIVATE'],
    example: 'PRIVATE',
    type: String,
  })
  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';

  @ApiPropertyOptional({
    description:
      'Course this material is scoped to. Required to enforce PRIVATE visibility.',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({
    description:
      'Lesson this material was created from (optional back-reference).',
    example: '507f1f77bcf86cd799439012',
    type: String,
  })
  @IsOptional()
  @IsString()
  lessonId?: string;
}

export class UpdateBookDto extends PartialType(CreateBookDto) {}

export class PublishBookDto {
  @ApiPropertyOptional({
    description: 'Publication status of the book',
    enum: ['PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
    type: String,
  })
  @IsOptional()
  @IsEnum(['PUBLISHED', 'ARCHIVED'])
  status?: 'PUBLISHED' | 'ARCHIVED' = 'PUBLISHED';
}

export class GetBooksQueryDto {
  @ApiPropertyOptional({
    description: 'Search query to filter books',
    example: 'javascript',
    type: String,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated topics to filter by',
    example: 'Programming Basics,Web Development,Data Structure',
    type: String,
  })
  @IsOptional()
  @IsString()
  topics?: string; // comma separated

  @ApiPropertyOptional({
    description: 'Difficulty level to filter by',
    example: 'Intermediate',
    type: String,
  })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({
    description: 'Sort order for results',
    example: 'title',
    type: String,
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 12,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 12;

  @ApiPropertyOptional({
    description: 'Publication status to filter by',
    example: 'PUBLISHED',
    type: String,
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateBookProgressDto {
  @ApiProperty({
    description: 'The last page number the user has read',
    example: 125,
    type: Number,
  })
  @IsNumber()
  @Type(() => Number)
  lastPage: number;

  @ApiPropertyOptional({
    description: 'Time spent reading in seconds',
    example: 3600,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
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
