import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsBoolean,
  ArrayMinSize,
  IsUrl,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  index?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsEnum(['VIDEO', 'ARTICLE', 'QUIZ'])
  type?: 'VIDEO' | 'ARTICLE' | 'QUIZ';

  @IsOptional()
  @IsBoolean()
  previewable?: boolean;

  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  index?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsEnum(['VIDEO', 'ARTICLE', 'QUIZ'])
  type?: 'VIDEO' | 'ARTICLE' | 'QUIZ';

  @IsOptional()
  @IsBoolean()
  previewable?: boolean;

  @IsOptional()
  @IsString()
  content?: string;
}

export class ReorderLessonItemDto {
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid ObjectId format for lessonId',
  })
  lessonId: string;

  @IsNumber()
  @Min(0)
  index: number;
}

export class ReorderLessonDto {
  @ValidateNested({ each: true })
  @Type(() => ReorderLessonItemDto)
  @ArrayMinSize(1)
  order: ReorderLessonItemDto[];
}

export class VideoUploadUrlDto {
  @IsString()
  objectKey: string;

  @IsString()
  contentType: string;
}

export class VideoUploadResponseDto {
  @IsString()
  uploadUrl: string;

  @IsString()
  objectKey: string;

  @IsNumber()
  size: number;
}

export class VideoUrlResponseDto {
  @IsString()
  videoUrl: string;
}
