import { IsEnum, IsOptional, IsString, Matches, IsArray, ArrayMinSize } from 'class-validator';

export type LibraryMaterialType = 'book' | 'guide' | 'presentation';

export class AttachLessonMaterialDto {
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/)
  materialId!: string;

  @IsEnum(['book', 'guide', 'presentation'])
  materialType!: LibraryMaterialType;

  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';
}

export class AttachLessonQuizDto {
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/)
  quizId!: string;
}

export class AttachLessonProblemDto {
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/)
  problemId!: string;
}

export class ReorderLessonMaterialsDto {
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  orderedMaterialIds!: string[];
}

export class ReorderLessonQuizzesDto {
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  orderedQuizIds!: string[];
}

export class ReorderLessonProblemsDto {
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  orderedProblemIds!: string[];
}
