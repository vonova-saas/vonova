import { IsString, IsOptional, IsNumber, Min, IsEnum, IsBoolean, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  index: number = 0;

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
  @ArrayMinSize(1)
  order: Array<{ lessonId: string; index: number }>;
}
