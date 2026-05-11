import {
  IsString,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LibraryTopics } from '../../library/dto/topics.dto';

export class AuthorDto {
  @ApiProperty({
    description: 'Name of the author',
    example: 'John Doe',
    type: String,
  })
  @IsString()
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

export enum Level {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export enum GuideStatus {
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateGuideDto {
  @ApiProperty({
    description: 'Title of the guide',
    example: 'Complete JavaScript Learning Guide',
    type: String,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'URL-friendly slug for the guide',
    example: 'complete-javascript-learning-guide',
    type: String,
  })
  @IsString()
  slug: string;

  @ApiPropertyOptional({
    description: 'Brief summary of the guide',
    example:
      'A comprehensive guide to learning JavaScript from basics to advanced.',
    type: String,
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the guide',
    example:
      'This guide covers everything from basic JavaScript concepts to advanced topics including ES6+, async programming, and modern frameworks.',
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Array of guide authors',
    type: [AuthorDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  authors: AuthorDto[] = [];

  @ApiPropertyOptional({
    description: 'Array of topics covered in the guide',
    example: ['Programming Basics', 'Web Development', 'Data Structure'],
    enum: LibraryTopics,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(LibraryTopics, { each: true })
  topics: string[] = [];

  @ApiPropertyOptional({
    description: 'Difficulty level of the guide',
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    example: 'Intermediate',
    type: String,
  })
  @IsOptional()
  @IsEnum(Level)
  level?: Level;

  @ApiPropertyOptional({
    description: 'Subject category (e.g. FRONTEND, CYBER_SECURITY)',
    example: 'FRONTEND',
    type: String,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'URL for the guide cover image',
    example: 'https://example.com/guide-cover.jpg',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @ApiPropertyOptional({
    description: 'Language of the guide content',
    example: 'en',
    type: String,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Array of badges or achievements',
    example: ['featured', 'recommended'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];

  @ApiPropertyOptional({
    description: 'Publication status of the guide',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
    type: String,
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' = 'PUBLISHED';

  @ApiPropertyOptional({
    description:
      'Visibility. PUBLIC guides appear in the global Material Library. PRIVATE guides only show to students enrolled in `courseId`.',
    enum: ['PUBLIC', 'PRIVATE'],
    example: 'PRIVATE',
    type: String,
  })
  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';

  @ApiPropertyOptional({
    description: 'Course this guide is scoped to (PRIVATE visibility).',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Lesson this guide was created from (back-reference).',
    example: '507f1f77bcf86cd799439012',
    type: String,
  })
  @IsOptional()
  @IsString()
  lessonId?: string;
}

export class UpdateGuideDto extends CreateGuideDto {}

export class PublishGuideDto {
  @ApiProperty({
    description: 'Publication status of the guide',
    enum: ['PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
    type: String,
  })
  @IsEnum(GuideStatus)
  status: GuideStatus = GuideStatus.PUBLISHED;
}
