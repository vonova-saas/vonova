import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProblemTestCaseDto {
  @ApiProperty({
    description: 'Input string for a single test case.',
    example: 'nums = [2,7,11,15], target = 9',
  })
  @IsString()
  @IsNotEmpty()
  input: string;

  @ApiProperty({
    description: 'Expected output for the input test case.',
    example: '[0,1]',
  })
  @IsString()
  @IsNotEmpty()
  output: string;
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
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProblemTestCaseDto)
  testCases: ProblemTestCaseDto[];
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
