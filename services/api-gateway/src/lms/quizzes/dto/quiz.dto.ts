import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===== OPTION DTO =====
/**
 * Data Transfer Object for Quiz Options
 * Represents a single option that can be selected for a quiz question
 */
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

// ===== QUESTION DTO =====
/**
 * Data Transfer Object for Quiz Questions
 * Represents a single quiz question with multiple choice options
 */
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
    example:
      'What is the most popular programming language for web development?',
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

// ===== CREATE QUIZ DTO =====
/**
 * Data Transfer Object for Creating New Quizzes
 * Contains all required fields to create a new quiz with questions
 */
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

  @ApiPropertyOptional({
    description: 'Visibility of the quiz - PUBLIC (visible globally) or PRIVATE (visible only within course)',
    example: 'PUBLIC',
    enum: ['PUBLIC', 'PRIVATE'],
    default: 'PUBLIC',
  })
  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';

  @ApiPropertyOptional({
    description: 'Course ID to associate this quiz with (for private visibility)',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid ObjectId format for courseId',
  })
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Lesson ID to associate this quiz with',
    example: '507f1f77bcf86cd799439012',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid ObjectId format for lessonId',
  })
  lessonId?: string;
}

// ===== UPDATE QUIZ DTO =====
/**
 * Data Transfer Object for Updating Existing Quizzes
 * Allows partial updates to quiz fields
 */
export class UpdateQuizDto extends PartialType(CreateQuizDto) { }

// ===== SUBMIT ANSWER ITEM DTO =====
/**
 * Data Transfer Object for Individual Quiz Answers
 * Represents a single answer submitted for a specific question
 */
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

// ===== SUBMIT QUIZ ANSWERS DTO =====
/**
 * Data Transfer Object for Submitting Complete Quiz Answers
 * Contains an array of all answers submitted for a quiz
 */
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
