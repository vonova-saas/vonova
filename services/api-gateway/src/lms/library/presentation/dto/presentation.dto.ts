import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthorDto {
  @ApiProperty({
    description: 'Name of the author',
    example: 'John Doe',
    type: String,
  })
  @IsString() name: string;

  @ApiPropertyOptional({
    description: 'URL for the author\' profile picture',
    example: 'https://example.com/author-avatar.jpg',
    type: String,
  })
  @IsOptional() @IsUrl() avatarUrl?: string;
}

export class CreatePresentationDto {
  @ApiProperty({
    description: 'Title of the presentation',
    example: 'JavaScript Fundamentals Presentation',
    type: String,
  })
  @IsString() title: string;

  @ApiProperty({
    description: 'URL-friendly slug for the presentation',
    example: 'javascript-fundamentals-presentation',
    type: String,
  })
  @IsString() slug: string;

  @ApiPropertyOptional({
    description: 'Brief summary of the presentation',
    example: 'An introduction to JavaScript fundamentals for beginners.',
    type: String,
  })
  @IsOptional() @IsString() summary?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the presentation',
    example: 'This presentation covers the fundamental concepts of JavaScript including variables, functions, and basic programming patterns.',
    type: String,
  })
  @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({
    description: 'Array of presentation authors',
    type: [AuthorDto],
  })
  @IsOptional() @IsArray() authors?: AuthorDto[];

  @ApiPropertyOptional({
    description: 'Array of topics covered in the presentation',
    example: ['javascript', 'programming', 'web-development'],
    type: [String],
  })
  @IsOptional() @IsArray() topics?: string[];

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
    description: 'URL for the presentation cover image',
    example: 'https://example.com/presentation-cover.jpg',
    type: String,
  })
  @IsOptional() @IsUrl() coverUrl?: string;

  @ApiPropertyOptional({
    description: 'Language of the presentation content',
    example: 'en',
    type: String,
  })
  @IsOptional() @IsString() language?: string;

  @ApiPropertyOptional({
    description: 'Array of badges or achievements',
    example: ['featured', 'interactive'],
    type: [String],
  })
  @IsOptional() @IsArray() badges?: string[];
}

export class UpdatePresentationDto extends PartialType(CreatePresentationDto) { }

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
