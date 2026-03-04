import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===== Option DTO =====
export class OptionDto {
  @ApiProperty({
    description: 'Unique identifier for the option',
    example: 'opt_123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Text content of the option',
    example: 'JavaScript',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}

// ===== Question DTO =====
export class QuestionDto {
  @ApiProperty({
    description: 'Unique identifier for the question',
    example: 'q_456',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Question text',
    example: 'What is the most popular programming language for web development?',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Array of available options for the question',
    type: [OptionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options: OptionDto[];

  @ApiProperty({
    description: 'ID of the correct option',
    example: 'opt_123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  correctOptionId: string;
}

// ===== Create Quiz DTO =====
export class CreateQuizDto {
  @ApiProperty({
    description: 'Title of the quiz',
    example: 'JavaScript Fundamentals Quiz',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the quiz',
    example: 'Test your knowledge of basic JavaScript concepts and syntax.',
    type: String,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Topic or subject area of the quiz',
    example: 'JavaScript Programming',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({
    description: 'Number of questions in the quiz',
    example: 10,
    minimum: 1,
    type: Number,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  noOfQuestions: number;

  @ApiProperty({
    description: 'Array of questions for the quiz',
    type: [QuestionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

// ===== Update Quiz DTO =====
export class UpdateQuizDto extends PartialType(CreateQuizDto) { }

// ===== Submit Answers DTO =====
export class SubmitAnswerItemDto {
  @ApiProperty({
    description: 'ID of the question being answered',
    example: 'q_456',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    description: 'ID of the selected option',
    example: 'opt_123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  selectedOptionId: string;
}

export class SubmitQuizAnswersDto {
  @ApiProperty({
    description: 'Array of submitted answers for the quiz',
    type: [SubmitAnswerItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerItemDto)
  answers: SubmitAnswerItemDto[];
}
