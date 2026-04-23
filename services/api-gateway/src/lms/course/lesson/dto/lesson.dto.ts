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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @ApiProperty({
    description: 'Title of the lesson',
    example: 'Introduction to JavaScript Variables',
    type: String,
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Order index of the lesson within the chapter',
    example: 0,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  index?: number;

  @ApiPropertyOptional({
    description: 'Duration of the lesson in minutes',
    example: 45,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Type of lesson content',
    enum: ['VIDEO', 'ARTICLE', 'QUIZ'],
    example: 'VIDEO',
    type: String,
  })
  @IsOptional()
  @IsEnum(['VIDEO', 'ARTICLE', 'QUIZ'])
  type?: 'VIDEO' | 'ARTICLE' | 'QUIZ';

  @ApiPropertyOptional({
    description: 'Whether the lesson can be previewed without enrollment',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  previewable?: boolean;

  @ApiPropertyOptional({
    description: 'Content of the lesson (text, video URL, or quiz data)',
    example: 'In this lesson, we will learn about JavaScript variables...',
    type: String,
  })
  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateLessonDto {
  @ApiPropertyOptional({
    description: 'Updated title of the lesson',
    example: 'Advanced JavaScript Variables',
    type: String,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated order index of the lesson within the chapter',
    example: 1,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  index?: number;

  @ApiPropertyOptional({
    description: 'Updated duration of the lesson in minutes',
    example: 60,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Updated type of lesson content',
    enum: ['VIDEO', 'ARTICLE', 'QUIZ'],
    example: 'ARTICLE',
    type: String,
  })
  @IsOptional()
  @IsEnum(['VIDEO', 'ARTICLE', 'QUIZ'])
  type?: 'VIDEO' | 'ARTICLE' | 'QUIZ';

  @ApiPropertyOptional({
    description: 'Updated preview status of the lesson',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  previewable?: boolean;

  @ApiPropertyOptional({
    description: 'Updated content of the lesson',
    example: 'Updated lesson content with more details...',
    type: String,
  })
  @IsOptional()
  @IsString()
  content?: string;
}

export class ReorderLessonItemDto {
  @ApiProperty({
    description: 'ID of the lesson to reorder',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid ObjectId format for lessonId',
  })
  lessonId: string;

  @ApiProperty({
    description: 'New index position for lesson',
    example: 2,
    minimum: 0,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  index: number;
}

export class ReorderLessonDto {
  @ApiProperty({
    description: 'Array of lessons with their new order positions',
    type: Array,
    items: {
      type: 'object',
      properties: {
        lessonId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        index: { type: 'number', example: 2, minimum: 0 },
      },
    },
    minItems: 1,
  })
  @ValidateNested({ each: true })
  @Type(() => ReorderLessonItemDto)
  @ArrayMinSize(1)
  order: ReorderLessonItemDto[];
}

export class VideoUploadDto {
  @ApiProperty({
    description: 'Original filename of the video file being uploaded',
    example: 'lesson-1-introduction.mp4',
    type: String,
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'MIME content type of the video file',
    example: 'video/mp4',
    enum: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    type: String,
  })
  @IsString()
  contentType: string;
}

export class VideoAttachDto {
  @ApiProperty({
    description:
      'External video URL (YouTube, Vimeo, etc.) to attach to the lesson',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: String,
  })
  @IsUrl()
  videoUrl: string;

  @ApiProperty({
    description: 'Duration of the video in minutes',
    example: 45,
    minimum: 0,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  durationMinutes: number;
}

export class VideoAttachAutomaticDto {
  @ApiProperty({
    description:
      'Duration of the uploaded video in minutes. This should match the actual video length.',
    example: 45,
    minimum: 0,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  durationMinutes: number;
}

export class VideoUploadUrlDto {
  @ApiProperty({
    description: 'Object key of the video in S3',
    example: 'userId/courses/courseId/lessons/lessonId/uuid-video.mp4',
    type: String,
  })
  @IsString()
  objectKey: string;

  @ApiProperty({
    description: 'Content type of the video file',
    example: 'video/mp4',
    type: String,
  })
  @IsString()
  contentType: string;
}

export class VideoUploadResponseDto {
  @ApiProperty({
    description: 'Presigned URL for uploading video directly to S3',
    example:
      'https://your-bucket.s3.amazonaws.com/videos/...?presigned-parameters',
    type: String,
  })
  @IsString()
  uploadUrl: string;

  @ApiProperty({
    description: 'Object key of the uploaded video',
    example: 'userId/courses/courseId/lessons/lessonId/uuid-video.mp4',
    type: String,
  })
  @IsString()
  objectKey: string;

  @ApiProperty({
    description: 'Size of the uploaded video in bytes',
    example: 724519,
    type: Number,
  })
  @IsNumber()
  size: number;
}

export class VideoUrlResponseDto {
  @ApiProperty({
    description: 'Presigned URL for accessing the video',
    example:
      'https://your-bucket.s3.amazonaws.com/videos/...?presigned-parameters',
    type: String,
  })
  @IsString()
  videoUrl: string;
}
