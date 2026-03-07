import {
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsArray,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── File Upload DTOs ───────────────────────────────────────────────────────────

export class FileUploadDto {
  @ApiProperty({
    description: 'File to upload',
    type: 'string',
    format: 'binary',
  })
  file: any;
}

// ─── Post DTOs ────────────────────────────────────────────────────────────────

export class CreatePostDto {
  @ApiProperty({ description: 'Post content', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: 'Optional image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Image key for S3 deletion' })
  @IsOptional()
  @IsString()
  imageKey?: string;
}

export class UpdatePostDto {
  @ApiPropertyOptional({ description: 'Updated post content', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({ description: 'Updated image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Image key for S3 deletion' })
  @IsOptional()
  @IsString()
  imageKey?: string;
}

// ─── Comment DTOs ─────────────────────────────────────────────────────────────

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;

  @ApiPropertyOptional({ description: 'Optional image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Image key for S3 deletion' })
  @IsOptional()
  @IsString()
  imageKey?: string;
}

export class UpdateCommentDto {
  @ApiPropertyOptional({ description: 'Updated comment text', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text?: string;

  @ApiPropertyOptional({ description: 'Updated image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Image key for S3 deletion' })
  @IsOptional()
  @IsString()
  imageKey?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
