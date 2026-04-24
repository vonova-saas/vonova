import {
  IsInt,
  IsBoolean,
  IsDefined,
  IsIn,
  IsArray,
  ArrayMinSize,
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
  @IsDefined()
  input: unknown;

  @IsDefined()
  expected: unknown;

  @IsOptional()
  @IsBoolean()
  ignoreArrayOrder?: boolean;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
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
  @IsNotEmpty()
  functionName: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  parameterNames: string[];

  @IsOptional()
  @IsBoolean()
  allowUnorderedArrayOutput?: boolean;

  @IsOptional()
  @IsInt()
  timeLimit?: number;

  @IsOptional()
  @IsInt()
  memoryLimit?: number;

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
