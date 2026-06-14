import {
  IsString,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsArray,
  IsEnum,
  IsBoolean,
  IsMongoId,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── File Upload DTOs ───────────────────────────────────────────────────────────

export class FileUploadDto {
  file: any;
}

// ─── Post DTOs ────────────────────────────────────────────────────────────────

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  imageKey?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(40)
  hashtags?: string[];

  @IsOptional()
  @IsEnum(['PUBLIC', 'FOLLOWERS'])
  visibility?: 'PUBLIC' | 'FOLLOWERS';

  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  instructorOnly?: boolean;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  imageKey?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(40)
  hashtags?: string[];

  @IsOptional()
  @IsEnum(['PUBLIC', 'FOLLOWERS'])
  visibility?: 'PUBLIC' | 'FOLLOWERS';

  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  instructorOnly?: boolean;
}

// ─── Comment DTOs ─────────────────────────────────────────────────────────────

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  imageKey?: string;
}

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  imageKey?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
