import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsArray, IsMongoId } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryArticlesDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by categories' })
  @IsOptional()
  category?: string | string[];

  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsOptional()
  @IsMongoId()
  author?: string;

  @ApiPropertyOptional({
    enum: ['draft', 'published', 'archived'],
    description: 'Filter by publication status'
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  publishedStatus?: 'draft' | 'published' | 'archived';



  @ApiPropertyOptional({ description: 'Search in title, description, and content' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'title'],
    description: 'Sort field'
  })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'title'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description: 'Sort order'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Filter by date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateTo?: string;
}
