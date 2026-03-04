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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
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
  constructor(private readonly quizService: QuizGatewayService) { }

  @ApiOperation({
    summary: 'Create new quiz',
    description: 'Creates a new quiz with questions and options for students to complete.',
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
  @Post()
  async createQuiz(@Body() dto: CreateQuizDto, @Request() _req: any) {
    return firstValueFrom(this.quizService.createQuiz(dto));
  }

  @Patch(':id')
  async updateQuiz(
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.quizService.updateQuiz(id, dto));
  }

  @Get()
  async getAllQuizzes() {
    return firstValueFrom(this.quizService.getAllQuizzes());
  }

  @Get(':id')
  async getQuizById(@Param('id') id: string) {
    return firstValueFrom(this.quizService.getQuizById(id));
  }

  @Delete(':id')
  async deleteQuiz(@Param('id') id: string, @Request() _req: any) {
    return firstValueFrom(this.quizService.deleteQuiz(id));
  }

  @Post(':quizId/submit')
  async submitQuiz(
    @Param('quizId') quizId: string,
    @Body() dto: SubmitQuizAnswersDto,
  ) {
    return firstValueFrom(this.quizService.submitQuiz(quizId, dto));
  }

  @Get('attempts/:attemptId')
  async getAttempt(@Param('attemptId') attemptId: string) {
    return firstValueFrom(this.quizService.getAttempt(attemptId));
  }

  @Get(':quizId/my-attempts')
  async getAttemptsForQuiz(@Param('quizId') quizId: string) {
    return firstValueFrom(this.quizService.getAttemptsForQuiz(quizId));
  }
}
