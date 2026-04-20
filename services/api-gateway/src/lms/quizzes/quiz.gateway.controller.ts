/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { QuizGatewayService } from './quiz.gateway.service';
import {
  CreateQuizDto,
  SubmitQuizAnswersDto,
  UpdateQuizDto,
} from './dto/quiz.dto';

@ApiTags('LMS Quizzes')
@ApiBearerAuth()
@Controller('api/v1/lms/quizzes')
@UseGuards(JwtAuthGuard)
export class QuizGatewayController {
  constructor(private readonly quizService: QuizGatewayService) {}

  /**
   * Create a new quiz
   * @param userId - The ID of the user creating the quiz
   * @param dto - Quiz creation data containing title, description, topic, and questions
   * @returns Promise<Quiz> - The newly created quiz object
   */
  @ApiOperation({
    summary: 'Create new quiz',
    description:
      'Creates a new quiz with questions and options for students to complete.',
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz created successfully',
    schema: {
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
        questions: { type: 'array', items: { type: 'object' } },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid quiz data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Post('/:userId')
  async createQuiz(
    @Param('userId') userId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return firstValueFrom(this.quizService.createQuiz(dto, userId));
  }

  /**
   * Update an existing quiz
   * @param userId - The ID of the user updating the quiz
   * @param quizId - The ID of the quiz to update
   * @param dto - Partial quiz data to update
   * @returns Promise<Quiz> - The updated quiz object
   */
  @ApiOperation({
    summary: 'Update quiz',
    description: 'Updates an existing quiz with new information.',
  })
  @Patch('/:userId/:quizId')
  async updateQuiz(
    @Param('userId') userId: string,
    @Param('quizId') quizId: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return firstValueFrom(this.quizService.updateQuiz(quizId, dto, userId));
  }

  /**
   * Get a specific quiz by ID (must be registered before `GET /:userId` — same path shape).
   * Path uses the literal `quiz` segment so it is not mistaken for a creator user id.
   */
  @ApiOperation({
    summary: 'Get quiz by ID',
    description: 'Retrieves a specific quiz by its ID.',
  })
  @Get('/quiz/:quizId')
  async getQuizById(@Param('quizId') quizId: string) {
    return firstValueFrom(this.quizService.getQuizById(quizId));
  }

  /**
   * Get all quizzes for a user (creator / instructor id in path)
   * @param userId - The ID of the user whose quizzes to retrieve
   * @returns Promise<Quiz[]> - Array of user's quizzes
   */
  @ApiOperation({
    summary: 'Get all user quizzes',
    description: 'Retrieves all quizzes created by a specific user.',
  })
  @Get('/:userId')
  async getAllQuizzes(@Param('userId') userId: string) {
    return firstValueFrom(this.quizService.getAllQuizzes(userId));
  }

  /**
   * Delete a quiz
   * @param userId - The ID of the user deleting the quiz
   * @param quizId - The ID of the quiz to delete
   * @returns Promise<{message: string}> - Confirmation message
   */
  @ApiOperation({
    summary: 'Delete quiz',
    description: 'Permanently deletes a quiz and all associated data.',
  })
  @Delete('/:userId/:quizId')
  async deleteQuiz(
    @Param('userId') userId: string,
    @Param('quizId') quizId: string,
  ) {
    return firstValueFrom(this.quizService.deleteQuiz(quizId, userId));
  }

  /**
   * Submit quiz answers
   * @param userId - The ID of the user submitting the quiz
   * @param quizId - The ID of the quiz being submitted
   * @param dto - Array of selected answers for each question
   * @returns Promise<QuizAttempt> - The attempt results with score
   */
  @ApiOperation({
    summary: 'Submit quiz answers',
    description: 'Submits answers for a completed quiz and calculates score.',
  })
  @Post('/:quizId/submit')
  async submitQuiz(
    @Param('quizId') quizId: string,
    @Body() dto: SubmitQuizAnswersDto,
  ) {
    return firstValueFrom(this.quizService.submitQuiz(quizId, dto));
  }

  /**
   * Get a specific quiz attempt
   * @param userId - The ID of the user requesting the attempt
   * @param attemptId - The ID of the attempt to retrieve
   * @returns Promise<QuizAttempt> - The attempt details
   */
  @ApiOperation({
    summary: 'Get quiz attempt',
    description:
      'Retrieves detailed information about a specific quiz attempt.',
  })
  @Get('/attempts/:attemptId')
  async getAttempt(@Param('attemptId') attemptId: string) {
    return firstValueFrom(this.quizService.getAttempt(attemptId));
  }

  /**
   * Get all attempts for a specific quiz
   * @param userId - The ID of the user whose attempts to retrieve
   * @param quizId - The ID of the quiz to get attempts for
   * @returns Promise<QuizAttempt[]> - Array of quiz attempts
   */
  @ApiOperation({
    summary: 'Get quiz attempts',
    description:
      'Retrieves all attempts a user has made for a particular quiz.',
  })
  @Get('/:userId/:quizId/my-attempts')
  async getAttemptsForQuiz(
    @Param('userId') userId: string,
    @Param('quizId') quizId: string,
  ) {
    return firstValueFrom(this.quizService.getAttemptsForQuiz(quizId, userId));
  }
}
