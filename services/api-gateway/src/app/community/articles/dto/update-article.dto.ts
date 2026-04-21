import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreateContentBlockDto, ContentBlockType } from './create-article.dto';

export class UpdateContentBlockDto extends PartialType(CreateContentBlockDto) {
  @IsEnum(ContentBlockType)
  @IsOptional()
  type?: ContentBlockType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  contentBlocks?: UpdateContentBlockDto[];

  @IsArray()
  @IsEnum(
    [
      'architecture',
      'devops',
      'backend',
      'nestjs',
      'databases',
      'frontend',
      'mobile',
      'ai',
      'security',
      'typescript',
      'javascript',
      'nodejs',
      'webdev',
      'api',
      'microservices',
    ],
    { each: true, message: 'Each category must be one of: architecture, devops, backend, nestjs, databases, frontend, mobile, ai, security, typescript, javascript, nodejs, webdev, api, microservices' },
  )
  @IsOptional()
  category?: string[];

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  coverImageKey?: string;

  @IsOptional()
  @IsObject()
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}
