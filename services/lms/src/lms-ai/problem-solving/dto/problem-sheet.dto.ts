import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EmbeddedSheetQuestionDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
}

export class CreateProblemSheetDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsMongoId()
  courseId?: string | null;

  @IsOptional()
  @IsMongoId()
  chapterId?: string | null;

  @IsOptional()
  @IsMongoId()
  lessonId?: string | null;

  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsOptional()
  @IsEnum(['private', 'public'])
  visibility?: 'private' | 'public';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmbeddedSheetQuestionDto)
  embeddedQuestions?: EmbeddedSheetQuestionDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  timerMinutes?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  coverImage?: string;
}

export class UpdateProblemSheetDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: 'draft' | 'published';

  @IsOptional()
  @IsEnum(['private', 'public'])
  visibility?: 'private' | 'public';

  @IsOptional()
  @IsMongoId()
  courseId?: string | null;

  @IsOptional()
  @IsMongoId()
  chapterId?: string | null;

  @IsOptional()
  @IsMongoId()
  lessonId?: string | null;

  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmbeddedSheetQuestionDto)
  embeddedQuestions?: EmbeddedSheetQuestionDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  timerMinutes?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  coverImage?: string;
}

export class CreateSheetPayloadDto {
  @IsMongoId()
  userId: string;

  @ValidateNested()
  @Type(() => CreateProblemSheetDto)
  dto: CreateProblemSheetDto;
}

export class UpdateSheetPayloadDto {
  @IsMongoId()
  id: string;

  @IsMongoId()
  userId: string;

  @ValidateNested()
  @Type(() => UpdateProblemSheetDto)
  dto: UpdateProblemSheetDto;
}
