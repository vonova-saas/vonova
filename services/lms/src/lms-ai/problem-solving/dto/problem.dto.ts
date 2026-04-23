import {
  IsIn,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PROBLEM_CATEGORIES,
  PROBLEM_DIFFICULTIES,
} from '../schemas/problem.schema';

export class ProblemTestCaseDto {
  @IsString()
  @IsNotEmpty()
  input: string;

  @IsString()
  @IsNotEmpty()
  output: string;
}

export class CreateProblemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  constraints: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProblemTestCaseDto)
  testCases: ProblemTestCaseDto[];

  @IsString()
  @IsIn(PROBLEM_DIFFICULTIES)
  difficulty: (typeof PROBLEM_DIFFICULTIES)[number];

  @IsArray()
  @IsString({ each: true })
  @IsIn(PROBLEM_CATEGORIES, { each: true })
  categories: (typeof PROBLEM_CATEGORIES)[number][];
}

export class DeleteProblemDto {
  @IsMongoId()
  id: string;
}

export class ListProblemsDto {
  @IsOptional()
  @IsString()
  @IsIn(PROBLEM_DIFFICULTIES)
  difficulty?: (typeof PROBLEM_DIFFICULTIES)[number];

  @IsOptional()
  @IsString()
  @IsIn(PROBLEM_CATEGORIES)
  category?: (typeof PROBLEM_CATEGORIES)[number];
}

