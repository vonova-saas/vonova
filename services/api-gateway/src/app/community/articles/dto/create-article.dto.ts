import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  ArrayMinSize,
  IsObject,
} from 'class-validator';

export enum ContentBlockType {
  TEXT = 'text',
  CODE = 'code',
  IMAGE = 'image',
  QUOTE = 'quote',
  LINK = 'link',
}

export class CreateContentBlockDto {
  @IsEnum(ContentBlockType)
  type: ContentBlockType;

  @IsNumber()
  @Min(0)
  order: number;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  filename?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsString()
  @IsOptional()
  alt?: string;

  @IsString()
  @IsOptional()
  imageKey?: string;

  @IsString()
  @IsOptional()
  quoteAuthor?: string;

  @IsString()
  @IsOptional()
  quoteSource?: string;
}

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  description: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Article must have at least one content block' })
  contentBlocks: CreateContentBlockDto[];

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
    {
      each: true,
      message:
        'Each category must be one of: architecture, devops, backend, nestjs, databases, frontend, mobile, ai, security, typescript, javascript, nodejs, webdev, api, microservices',
    },
  )
  category: string[];

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
