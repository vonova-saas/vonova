import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export class AuthorDto {
  @IsString() name: string;
  @IsOptional() @IsUrl() avatarUrl?: string;
}

export class CreatePresentationDto {
  @IsString() title: string;
  @IsString() slug: string;

  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() description?: string;

  @IsOptional() @IsArray() authors?: AuthorDto[];
  @IsOptional() @IsArray() topics?: string[];

  @IsOptional()
  @IsEnum(['Beginner', 'Intermediate', 'Advanced'])
  level?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional() @IsUrl() coverUrl?: string;
  @IsOptional() @IsString() language?: string;

  @IsOptional() @IsArray() badges?: string[];

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' = 'PUBLISHED';

  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;
}

export class UpdatePresentationDto extends PartialType(CreatePresentationDto) {}

export class PublishPresentationDto {
  @IsEnum(['PUBLISHED', 'ARCHIVED'])
  status: 'PUBLISHED' | 'ARCHIVED';
}
