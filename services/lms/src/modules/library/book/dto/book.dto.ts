import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, Min, MinLength, ValidateNested } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class AuthorDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

export class CreateBookDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  slug: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  authors: AuthorDto[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics: string[] = [];

  @IsOptional()
  @IsEnum(['Beginner', 'Intermediate', 'Advanced'])
  level?: 'Beginner' | 'Intermediate' | 'Advanced';

  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  language?: string = 'en';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[] = [];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pageCount?: number = 0;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  readingTimeMin?: number = 0;
}

export class UpdateBookDto extends PartialType(CreateBookDto) {}

export class PublishBookDto {
  @IsOptional()
  @IsEnum(['PUBLISHED', 'ARCHIVED'])
  status?: 'PUBLISHED' | 'ARCHIVED' = 'PUBLISHED';
}

export class GetBooksQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  topics?: string; // comma separated

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 12;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateProgressDto {
  @IsNumber()
  @Type(() => Number)
  lastPage: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timeSpentSec?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
