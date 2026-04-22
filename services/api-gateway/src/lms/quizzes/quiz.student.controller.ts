/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { QuizGatewayService } from './quiz.gateway.service';
import { SubmitQuizAnswersDto } from './dto/quiz.dto';

@ApiTags('LMS Student Quizzes')
@ApiBearerAuth()
@Controller('api/v1/lms/student/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT_USER)
export class QuizStudentController {
  constructor(private readonly quizService: QuizGatewayService) {
    console.log('QuizStudentController initialized');
  }

  /**
   * Get all available quizzes for students (Student only)
   * @returns Promise<Quiz[]> - Array of available quizzes
   */
  @ApiOperation({
    summary: 'Get available quizzes (Student only)',
    description: 'Retrieves all quizzes available for students to take. Only students can access this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quizzes retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          title: { type: 'string', example: 'JavaScript Fundamentals Quiz' },
          description: {
            type: 'string',
            example: 'Test your knowledge of basic JavaScript concepts.',
          },
          topic: { type: 'string', example: 'JavaScript Programming' },
          noOfQuestions: { type: 'number', example: 10 },
          createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only students can access available quizzes',
  })
  @Get()
  async getAvailableQuizzes() {
    return firstValueFrom(this.quizService.getAvailableQuizzesForStudents());
  }

  /**
   * Submit quiz answers (Student only)
   * @param request - HTTP request containing authenticated user
   * @param quizId - The ID of the quiz being submitted
   * @param dto - Array of selected answers for each question
   * @returns Promise<QuizAttempt> - The attempt results with score
   */
  @ApiOperation({
    summary: 'Submit quiz answers (Student only)',
    description: 'Submits answers for a completed quiz and calculates score. Only students can submit quiz answers.',
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz submitted successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
        quiz: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: 'student_user_id' },
        score: { type: 'number', example: 8 },
        total: { type: 'number', example: 10 },
        percentage: { type: 'number', example: 80 },
        submittedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              questionId: { type: 'string', example: 'q_456' },
              selectedOptionId: { type: 'string', example: 'opt_123' },
              correct: { type: 'boolean', example: true },
            },
          },
        },
        quizDetails: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'JavaScript Fundamentals Quiz' },
            description: { type: 'string', example: 'Test your knowledge of basic JavaScript concepts.' },
            topic: { type: 'string', example: 'JavaScript Programming' },
            noOfQuestions: { type: 'number', example: 10 },
            questions: {
              type: 'array',
              items: {
                oneOf: [
                  {
                    type: 'object',
                    title: 'Correct answer',
                    properties: {
                      questionId: { type: 'string', example: 'q_123' },
                      questionText: { type: 'string', example: 'What is 2 + 2?' },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', example: 'opt_1' },
                            text: { type: 'string', example: '3' },
                          },
                        },
                      },
                      studentSelectedOptionId: { type: 'string', example: 'opt_2' },
                      correct: { type: 'boolean', example: true },
                    },
                  },
                  {
                    type: 'object',
                    title: 'Incorrect answer with correct answer info',
                    properties: {
                      questionId: { type: 'string', example: 'q_456' },
                      questionText: { type: 'string', example: 'What is the capital of France?' },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', example: 'opt_1' },
                            text: { type: 'string', example: 'London' },
                          },
                        },
                      },
                      studentSelectedOptionId: { type: 'string', example: 'opt_1' },
                      correct: { type: 'boolean', example: false },
                      correctOptionId: { type: 'string', example: 'opt_3' },
                      correctOptionText: { type: 'string', example: 'Paris' },
                    },
                  },
                ],
              },
            },
          },
        },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid submission data',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only students can submit quiz answers',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Student has already attempted this quiz',
  })
  @Post('/:quizId/submit')
  async submitQuiz(
    @Request() req,
    @Param('quizId') quizId: string,
    @Body() dto: SubmitQuizAnswersDto,
  ) {
    const userId = req.user._id;
    return firstValueFrom(this.quizService.submitStudentQuiz(quizId, dto, userId));
  }

  /**
   * Get all quiz attempts for the authenticated student (Student only)
   * @param request - HTTP request containing authenticated user
   * @returns Promise<QuizAttempt[]> - Array of all quiz attempts with quiz details
   */
  @ApiOperation({
    summary: 'Get all my quiz attempts (Student only)',
    description: 'Retrieves all quiz attempts made by the authenticated student with quiz details and scores. Only students can access their own attempts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz attempts retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
          quiz: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: { type: 'string', example: 'JavaScript Fundamentals Quiz' },
              description: { type: 'string', example: 'Test your knowledge of basic JavaScript concepts.' },
              topic: { type: 'string', example: 'JavaScript Programming' },
              noOfQuestions: { type: 'number', example: 10 },
              createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            },
          },
          userId: { type: 'string', example: 'student_user_id' },
          score: { type: 'number', example: 8 },
          total: { type: 'number', example: 10 },
          percentage: { type: 'number', example: 80 },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'string', example: 'q_456' },
                selectedOptionId: { type: 'string', example: 'opt_123' },
                correct: { type: 'boolean', example: true },
              },
            },
          },
          createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only students can access their own attempts',
  })
  @Get('/attempts')
  async getMyQuizAttempts(@Request() req) {
    const userId = req.user._id;
    return firstValueFrom(this.quizService.getStudentQuizAttempts(userId));
  }

  /**
   * Get a specific quiz attempt (Student only)
   * @param request - HTTP request containing authenticated user
   * @param attemptId - The ID of the attempt to retrieve
   * @returns Promise<QuizAttempt> - The attempt details
   */
  @ApiOperation({
    summary: 'Get quiz attempt (Student only)',
    description: 'Retrieves detailed information about a specific quiz attempt. Only students can view their own attempts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz attempt retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Attempt not found or access denied',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only students can view their own attempts',
  })
  @Get('/attempts/:attemptId')
  async getMyAttempt(
    @Request() req,
    @Param('attemptId') attemptId: string,
  ) {
    const userId = req.user._id;
    return firstValueFrom(this.quizService.getStudentAttempt(attemptId, userId));
  }

  /**
   * Get a specific quiz for taking (Student only)
   * @param request - HTTP request containing authenticated user
   * @param quizId - The ID of quiz to retrieve
   * @returns Promise<Quiz> - The quiz object without correct answers
   */
  @ApiOperation({
    summary: 'Get quiz for taking or viewing (Student only)',
    description: 'Retrieves a specific quiz for students. If not attempted, returns quiz without correct answers for taking. If already attempted, returns quiz with student answers and correct answers for review. Only students can access this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz retrieved successfully',
    schema: {
      oneOf: [
        {
          type: 'object',
          title: 'Quiz not yet attempted',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'JavaScript Fundamentals Quiz' },
            description: {
              type: 'string',
              example: 'Test your knowledge of basic JavaScript concepts.',
            },
            topic: { type: 'string', example: 'JavaScript Programming' },
            noOfQuestions: { type: 'number', example: 10 },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'q_123' },
                  text: { type: 'string', example: 'What is 2 + 2?' },
                  options: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'opt_1' },
                        text: { type: 'string', example: '3' },
                      },
                    },
                  },
                },
              },
            },
            alreadyAttempted: { type: 'boolean', example: false },
            attemptId: { type: 'string', example: null },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          },
        },
        {
          type: 'object',
          title: 'Quiz already attempted (view mode)',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'JavaScript Fundamentals Quiz' },
            description: {
              type: 'string',
              example: 'Test your knowledge of basic JavaScript concepts.',
            },
            topic: { type: 'string', example: 'JavaScript Programming' },
            noOfQuestions: { type: 'number', example: 10 },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'q_123' },
                  text: { type: 'string', example: 'What is 2 + 2?' },
                  options: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'opt_1' },
                        text: { type: 'string', example: '3' },
                      },
                    },
                  },
                  correctOptionId: { type: 'string', example: 'opt_2' },
                  studentSelectedOptionId: { type: 'string', example: 'opt_1' },
                  isCorrect: { type: 'boolean', example: false },
                },
              },
            },
            alreadyAttempted: { type: 'boolean', example: true },
            attemptId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            attempt: {
              type: 'object',
              properties: {
                score: { type: 'number', example: 8 },
                total: { type: 'number', example: 10 },
                percentage: { type: 'number', example: 80 },
                submittedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              },
            },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only students can access quizzes',
  })
  @Get('/:quizId')
  async getQuizForTaking(
    @Request() req,
    @Param('quizId') quizId: string,
  ) {
    const userId = req.user._id;
    return firstValueFrom(this.quizService.getQuizForStudent(quizId, userId));
  }
}
