import { IsArray, IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class AttachLessonMaterialBodyDto {
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/)
  materialId!: string;

  @IsEnum(['book', 'guide', 'presentation'])
  materialType!: 'book' | 'guide' | 'presentation';

  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';
}

export class AttachLessonQuizBodyDto {
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/)
  quizId!: string;
}

export class AttachLessonProblemBodyDto {
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/)
  problemId!: string;
}

export class ReorderLessonMaterialsBodyDto {
  @IsArray()
  @IsString({ each: true })
  orderedMaterialIds!: string[];
}

export class ReorderLessonQuizzesBodyDto {
  @IsArray()
  @IsString({ each: true })
  orderedQuizIds!: string[];
}

export class ReorderLessonProblemsBodyDto {
  @IsArray()
  @IsString({ each: true })
  orderedProblemIds!: string[];
}
