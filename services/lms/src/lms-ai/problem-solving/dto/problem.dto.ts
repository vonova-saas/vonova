import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
}

export class DeleteProblemDto {
  @IsMongoId()
  id: string;
}

