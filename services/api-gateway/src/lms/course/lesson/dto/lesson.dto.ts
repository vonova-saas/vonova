import { IsString, IsOptional, IsNumber, Min, IsEnum, IsBoolean, ArrayMinSize } from 'class-validator';

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
  index: number =0;

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

export class ReorderLessonDto {
  @ArrayMinSize(1)
  order: Array<{ lessonId: string; index: number }>;
}
