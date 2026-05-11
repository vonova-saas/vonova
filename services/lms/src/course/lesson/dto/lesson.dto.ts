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

export type LessonTypeDto = 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT' | 'MIXED';

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
  @IsEnum(['VIDEO', 'ARTICLE', 'QUIZ', 'ASSIGNMENT', 'MIXED'])
  type?: LessonTypeDto;

  @IsOptional()
  @IsBoolean()
  previewable?: boolean;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid ObjectId format for quizId',
  })
  quizId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid ObjectId format for assignmentId',
  })
  assignmentId?: string;

  /** S3 object key for uploaded video (stored as videoObjectKey on the document). */
  @IsOptional()
  @IsString()
  videoKey?: string;

  /** Same as videoKey; preferred wire name (matches Mongoose field). */
  @IsOptional()
  @IsString()
  videoObjectKey?: string;

  @IsOptional()
  @IsString()
  thumbnailKey?: string;
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
  @IsEnum(['VIDEO', 'ARTICLE', 'QUIZ', 'ASSIGNMENT', 'MIXED'])
  type?: LessonTypeDto;

  @IsOptional()
  @IsBoolean()
  previewable?: boolean;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid ObjectId format for quizId',
  })
  quizId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid ObjectId format for assignmentId',
  })
  assignmentId?: string;

  @IsOptional()
  @IsString()
  videoKey?: string;

  @IsOptional()
  @IsString()
  videoObjectKey?: string;

  @IsOptional()
  @IsString()
  thumbnailKey?: string;
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

export class VideoPlaybackPresignResponseDto {
  @IsString()
  streamUrl: string;
}
