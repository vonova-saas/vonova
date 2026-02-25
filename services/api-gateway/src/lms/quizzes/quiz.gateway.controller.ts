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
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { QuizGatewayService } from './quiz.gateway.service';
import {
  CreateQuizDto,
  SubmitQuizAnswersDto,
  UpdateQuizDto,
} from './dto/quiz.dto';

@Controller('api/v1/lms/quizzes')
@UseGuards(JwtAuthGuard)
export class QuizGatewayController {
  constructor(private readonly quizService: QuizGatewayService) {}

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
