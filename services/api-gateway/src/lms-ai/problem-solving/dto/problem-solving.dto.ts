import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PROBLEM_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const PROBLEM_CATEGORIES = [
  'arrays',
  'strings',
  'hashmap',
  'math',
  'dp',
  'recursion',
  'sorting',
] as const;

export class ProblemTestCaseDto {
  @ApiProperty({
    description:
      'Input payload passed into the target function. Can be object, array, or primitive.',
    example: { nums: [2, 7, 11, 15], target: 9 },
  })
  @IsDefined()
  input: unknown;

  @ApiProperty({
    description: 'Expected output for this test case.',
    example: [0, 1],
  })
  @IsDefined()
  expected: unknown;

  @ApiPropertyOptional({
    description:
      'If true, output arrays are compared as unordered multisets for this case.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  ignoreArrayOrder?: boolean;

  @ApiPropertyOptional({
    description: 'Hide this case from student-facing APIs.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}

export class CreateProblemDto {
  @ApiProperty({
    description: 'Problem title shown in the problem list.',
    example: 'Two Sum',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Full problem statement.',
    example:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Problem constraints and limits.',
    example:
      '2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, only one valid answer exists.',
  })
  @IsString()
  @IsNotEmpty()
  constraints: string;

  @ApiProperty({
    description: 'List of test cases used for judging submissions.',
    type: [ProblemTestCaseDto],
    example: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProblemTestCaseDto)
  testCases: ProblemTestCaseDto[];

  @ApiProperty({
    description: 'Entry function name expected in user submissions.',
    example: 'twoSum',
  })
  @IsString()
  @IsNotEmpty()
  functionName: string;

  @ApiPropertyOptional({
    description:
      'If true, output arrays are compared as unordered multisets by default.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allowUnorderedArrayOutput?: boolean;

  @ApiPropertyOptional({
    description: 'Per-test time limit in milliseconds.',
    example: 2000,
    default: 2000,
  })
  @IsOptional()
  timeLimit?: number;

  @ApiPropertyOptional({
    description: 'Per-test memory limit in MB.',
    example: 128,
    default: 128,
  })
  @IsOptional()
  memoryLimit?: number;

  @ApiProperty({
    description: 'Problem difficulty level.',
    enum: PROBLEM_DIFFICULTIES,
    example: 'easy',
  })
  @IsString()
  @IsIn(PROBLEM_DIFFICULTIES)
  difficulty: (typeof PROBLEM_DIFFICULTIES)[number];

  @ApiProperty({
    description: 'Problem categories/tags.',
    enum: PROBLEM_CATEGORIES,
    isArray: true,
    example: ['arrays', 'hashmap'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsIn(PROBLEM_CATEGORIES, { each: true })
  categories: (typeof PROBLEM_CATEGORIES)[number][];
}

export class ListProblemsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by difficulty.',
    enum: PROBLEM_DIFFICULTIES,
    example: 'easy',
  })
  @IsOptional()
  @IsString()
  @IsIn(PROBLEM_DIFFICULTIES)
  difficulty?: (typeof PROBLEM_DIFFICULTIES)[number];

  @ApiPropertyOptional({
    description: 'Filter by category.',
    enum: PROBLEM_CATEGORIES,
    example: 'arrays',
  })
  @IsOptional()
  @IsString()
  @IsIn(PROBLEM_CATEGORIES)
  category?: (typeof PROBLEM_CATEGORIES)[number];
}

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'Mongo ObjectId of the target problem.',
    example: '665f7d4a3f0f8d0f42c5b8a1',
  })
  @IsMongoId()
  problemId: string;

  @ApiProperty({
    description: 'Student source code to evaluate.',
    example:
      'function twoSum(nums, target){ const map = new Map(); for(let i=0;i<nums.length;i++){ const diff = target-nums[i]; if(map.has(diff)) return [map.get(diff), i]; map.set(nums[i], i);} return []; }',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Programming language of the submitted code.',
    example: 'javascript',
  })
  @IsString()
  @IsNotEmpty()
  language: string;
}

export class RequestHintDto {
  @ApiPropertyOptional({
    description:
      'Problem id can be passed in route param and is optional in body.',
    example: '665f7d4a3f0f8d0f42c5b8a1',
  })
  @IsMongoId()
  @IsOptional()
  problemId: string;

  @ApiProperty({
    description:
      'Current student code used by AI to generate a contextual hint.',
    example:
      'function twoSum(nums, target){ for(let i=0;i<nums.length;i++){ for(let j=i+1;j<nums.length;j++){ if(nums[i]+nums[j]===target) return [i,j]; } } }',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    description: 'Language for hint explanation text.',
    example: 'english',
    default: 'english',
  })
  @IsString()
  @IsOptional()
  languageHint?: string;
}

export class RequestSolutionDto {
  @ApiPropertyOptional({
    description:
      'Problem id can be passed in route param and is optional in body.',
    example: '665f7d4a3f0f8d0f42c5b8a1',
  })
  @IsMongoId()
  @IsOptional()
  problemId: string;

  @ApiPropertyOptional({
    description: 'Preferred programming language for generated solution.',
    example: 'typescript',
    default: 'typescript',
  })
  @IsString()
  @IsOptional()
  language?: string;
}
