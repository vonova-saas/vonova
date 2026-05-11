import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
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

export class CreatePresentationDto {
  @ApiProperty({
    description: 'Title of the presentation',
    example: 'JavaScript Fundamentals Presentation',
    type: String,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'URL-friendly slug for the presentation',
    example: 'javascript-fundamentals-presentation',
    type: String,
  })
  @IsString()
  slug: string;

  @ApiPropertyOptional({
    description: 'Brief summary of the presentation',
    example: 'An introduction to JavaScript fundamentals for beginners.',
    type: String,
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the presentation',
    example:
      'This presentation covers the fundamental concepts of JavaScript including variables, functions, and basic programming patterns.',
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Array of presentation authors',
    type: [AuthorDto],
  })
  @IsOptional()
  @IsArray()
  authors?: AuthorDto[];

  @ApiPropertyOptional({
    description: 'Array of topics covered in the presentation',
    example: ['Programming Basics', 'Web Development', 'Data Structure'],
    enum: LibraryTopics,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(LibraryTopics, { each: true })
  topics?: string[];

  @ApiPropertyOptional({
    description: 'Difficulty level of the presentation',
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    example: 'Beginner',
    type: String,
  })
  @IsOptional()
  @IsEnum(['Beginner', 'Intermediate', 'Advanced'])
  level?: string;

  @ApiPropertyOptional({
    description: 'Subject category (e.g. FRONTEND, CYBER_SECURITY)',
    example: 'FRONTEND',
    type: String,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'URL for the presentation cover image',
    example: 'https://example.com/presentation-cover.jpg',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @ApiPropertyOptional({
    description: 'Language of the presentation content',
    example: 'en',
    type: String,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Array of badges or achievements',
    example: ['featured', 'interactive'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  badges?: string[];

  @ApiPropertyOptional({
    description: 'Publication status of the presentation',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
    type: String,
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' = 'PUBLISHED';

  @ApiPropertyOptional({
    description:
      'Visibility. PUBLIC presentations appear in the global Material Library. PRIVATE presentations only show to students enrolled in `courseId`.',
    enum: ['PUBLIC', 'PRIVATE'],
    example: 'PRIVATE',
    type: String,
  })
  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';

  @ApiPropertyOptional({
    description: 'Course this presentation is scoped to (PRIVATE visibility).',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Lesson this presentation was created from (back-reference).',
    example: '507f1f77bcf86cd799439012',
    type: String,
  })
  @IsOptional()
  @IsString()
  lessonId?: string;
}

export class UpdatePresentationDto extends PartialType(CreatePresentationDto) {}

export class PublishPresentationDto {
  @ApiProperty({
    description: 'Publication status of the presentation',
    enum: ['PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
    type: String,
  })
  @IsEnum(['PUBLISHED', 'ARCHIVED'])
  status: 'PUBLISHED' | 'ARCHIVED';
}
