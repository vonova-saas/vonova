import { IsString, IsArray, IsOptional, IsEnum, IsNumber, IsBoolean, IsMongoId, Min, Max, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentBlockType } from '../interfaces/content-block.interface';

export class CreateContentBlockDto {
  @ApiProperty({ enum: ContentBlockType, description: 'Type of content block' })
  @IsEnum(ContentBlockType)
  type: ContentBlockType;

  @ApiProperty({ description: 'Order of the block in the article' })
  @IsNumber()
  @Min(0)
  order: number;

  @ApiPropertyOptional({ description: 'Content for paragraph, heading, or quote blocks' })
  @IsString()
  @IsOptional()
  content?: string;


  @ApiPropertyOptional({ description: 'Programming language for code blocks' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Code content for code blocks' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Optional filename for code blocks' })
  @IsString()
  @IsOptional()
  filename?: string;

  @ApiPropertyOptional({ description: 'Image URL for image blocks' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Image caption' })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiPropertyOptional({ description: 'Alt text for image' })
  @IsString()
  @IsOptional()
  alt?: string;

  @ApiPropertyOptional({ description: 'AWS S3 key for image' })
  @IsString()
  @IsOptional()
  imageKey?: string;

  @ApiPropertyOptional({ description: 'Quote author' })
  @IsString()
  @IsOptional()
  quoteAuthor?: string;

  @ApiPropertyOptional({ description: 'Quote source' })
  @IsString()
  @IsOptional()
  quoteSource?: string;
}

export class CreateArticleDto {
  @ApiProperty({ description: 'Article title', maxLength: 200 })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'SEO-friendly slug', pattern: '^[a-z0-9-]+$' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'Article description', maxLength: 500 })
  @IsString()
  description: string;

  @ApiProperty({
    type: [CreateContentBlockDto],
    description: 'Array of content blocks',
    minItems: 1
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Article must have at least one content block' })
  contentBlocks: CreateContentBlockDto[];


  @ApiProperty({ description: 'Article categories' })
  @IsArray()
  @IsEnum(['architecture', 'devops', 'backend', 'databases', 'frontend', 'mobile', 'ai', 'security'], { each: true })
  category: string[];



  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'AWS S3 key for cover image' })
  @IsString()
  @IsOptional()
  coverImageKey?: string;

  @ApiPropertyOptional({
    description: 'SEO metadata',
    type: 'object',
    properties: {
      metaTitle: { type: 'string' },
      metaDescription: { type: 'string' },
      keywords: { type: 'array', items: { type: 'string' } }
    }
  })
  @IsOptional()
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}
