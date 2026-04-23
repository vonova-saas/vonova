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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { QuizGatewayService } from './quiz.gateway.service';
import {
  CreateQuizDto,
  SubmitQuizAnswersDto,
  UpdateQuizDto,
} from './dto/quiz.dto';

@ApiTags('LMS Instructor Quizzes')
@ApiBearerAuth()
@Controller('api/v1/lms/instructor/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTRUCTOR_USER)
export class QuizInstructorController {
  constructor(private readonly quizService: QuizGatewayService) {}

  /**
   * Create a new quiz (Instructor only)
   * @param request - HTTP request containing authenticated user
   * @param dto - Quiz creation data containing title, description, topic, and questions
   * @returns Promise<Quiz> - The newly created quiz object
   */
  @ApiOperation({
    summary: 'Create new quiz (Instructor only)',
    description:
      'Creates a new quiz with questions and options for students to complete. Only instructors can create quizzes.',
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
        createdBy: { type: 'string', example: 'instructor_user_id' },
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only instructors can create quizzes',
  })
  @Post()
  async createQuiz(@Request() req, @Body() dto: CreateQuizDto) {
    const userId = req.user._id;
    return firstValueFrom(this.quizService.createInstructorQuiz(dto, userId));
  }

  /**
   * Update an existing quiz (Instructor only)
   * @param request - HTTP request containing authenticated user
   * @param quizId - The ID of the quiz to update
   * @param dto - Partial quiz data to update
   * @returns Promise<Quiz> - The updated quiz object
   */
  @ApiOperation({
    summary: 'Update quiz (Instructor only)',
    description:
      'Updates an existing quiz with new information. Only instructors can update quizzes they created.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found or access denied',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only instructors can update quizzes',
  })
  @Patch('/:quizId')
  async updateQuiz(
    @Request() req,
    @Param('quizId') quizId: string,
    @Body() dto: UpdateQuizDto,
  ) {
    const userId = req.user._id;
    return firstValueFrom(
      this.quizService.updateInstructorQuiz(quizId, dto, userId),
    );
  }

  /**
   * Get all quizzes created by the instructor (Instructor only)
   * @param request - HTTP request containing authenticated user
   * @returns Promise<Quiz[]> - Array of instructor's quizzes
   */
  @ApiOperation({
    summary: 'Get instructor quizzes (Instructor only)',
    description:
      'Retrieves all quizzes created by the authenticated instructor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quizzes retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only instructors can access their quizzes',
  })
  @Get()
  async getInstructorQuizzes(@Request() req) {
    const userId = req.user._id;
    return firstValueFrom(this.quizService.getInstructorQuizzes(userId));
  }

  /**
   * Get a specific quiz by ID (Instructor only)
   * @param request - HTTP request containing authenticated user
   * @param quizId - The ID of the quiz to retrieve
   * @returns Promise<Quiz> - The quiz object
   */
  @ApiOperation({
    summary: 'Get quiz by ID (Instructor only)',
    description:
      'Retrieves a specific quiz by its ID. Only instructors can access quizzes they created.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found or access denied',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only instructors can access quizzes',
  })
  @Get('/:quizId')
  async getQuizById(@Request() req, @Param('quizId') quizId: string) {
    const userId = req.user._id;
    return firstValueFrom(
      this.quizService.getInstructorQuizById(quizId, userId),
    );
  }

  /**
   * Delete a quiz (Instructor only)
   * @param request - HTTP request containing authenticated user
   * @param quizId - The ID of the quiz to delete
   * @returns Promise<{message: string}> - Confirmation message
   */
  @ApiOperation({
    summary: 'Delete quiz (Instructor only)',
    description:
      'Permanently deletes a quiz and all associated data. Only instructors can delete quizzes they created.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found or access denied',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only instructors can delete quizzes',
  })
  @Delete('/:quizId')
  async deleteQuiz(@Request() req, @Param('quizId') quizId: string) {
    const userId = req.user._id;
    return firstValueFrom(
      this.quizService.deleteInstructorQuiz(quizId, userId),
    );
  }

  /**
   * Get all attempts for a specific quiz (Instructor only)
   * @param request - HTTP request containing authenticated user
   * @param quizId - The ID of the quiz to get attempts for
   * @returns Promise<QuizAttempt[]> - Array of all quiz attempts
   */
  @ApiOperation({
    summary: 'Get quiz attempts (Instructor only)',
    description:
      'Retrieves all attempts made for a particular quiz. Only instructors can view attempts for their quizzes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz attempts retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found or access denied',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only instructors can view quiz attempts',
  })
  @Get('/:quizId/attempts')
  async getQuizAttempts(@Request() req, @Param('quizId') quizId: string) {
    const userId = req.user._id;
    return firstValueFrom(
      this.quizService.getInstructorQuizAttempts(quizId, userId),
    );
  }

  /**
   * Get quiz statistics and analytics (Instructor only)
   * @param request - HTTP request containing authenticated user
   * @param quizId - The ID of the quiz to get statistics for
   * @returns Promise<QuizStats> - Quiz statistics including average score, completion rate, etc.
   */
  @ApiOperation({
    summary: 'Get quiz statistics (Instructor only)',
    description:
      'Retrieves detailed statistics and analytics for a quiz. Only instructors can view statistics for their quizzes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz statistics retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found or access denied',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only instructors can view quiz statistics',
  })
  @Get('/:quizId/statistics')
  async getQuizStatistics(@Request() req, @Param('quizId') quizId: string) {
    const userId = req.user._id;
    return firstValueFrom(
      this.quizService.getInstructorQuizStatistics(quizId, userId),
    );
  }
}
