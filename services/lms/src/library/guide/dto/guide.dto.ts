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

export class AuthorDto {
  @IsString()
  name: string;

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
  @IsString()
  title: string;

  @IsString()
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
  @IsEnum(Level)
  level?: Level;

  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];
}

export class UpdateGuideDto extends CreateGuideDto {}

export class PublishGuideDto {
  @IsEnum(GuideStatus)
  status: GuideStatus = GuideStatus.PUBLISHED;
}
