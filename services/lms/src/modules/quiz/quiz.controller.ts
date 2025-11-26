import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto, SubmitQuizAnswersDto, UpdateQuizDto } from './dto/quiz.dto';

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('addQuiz')
  createQuiz(@Body() dto: CreateQuizDto) {
    return this.quizService.createQuiz(dto);
  }

  @Patch('updateQuiz/:id')
  updateQuiz(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.quizService.updateQuiz(id, dto);
  }

  @Get('getAllQuizzes')
  getAllQuizzes() {
    return this.quizService.getAllQuizzes();
  }

  @Get('getQuiz/:id')
  getQuiz(@Param('id') id: string) {
    return this.quizService.getQuizById(id);
  }

  @Delete('deleteQuiz/:id')
  deleteQuiz(@Param('id') id: string) {
    return this.quizService.deleteQuiz(id);
  }

  // ===== Attempts =====

  @Post(':quizId/submit')
  submitQuiz(
    @Param('quizId') quizId: string,
    @Body() dto: SubmitQuizAnswersDto
  ) {
    return this.quizService.submitQuizAnswers(quizId, dto.answers);
  }

  @Get('attempts/:attemptId')
  getMyAttempt(@Param('attemptId') attemptId: string) {
    return this.quizService.getMyAttempt(attemptId);
  }

  @Get(':quizId/my-attempts')
  getMyAttempts(@Param('quizId') quizId: string) {
    return this.quizService.getMyAttemptsForQuiz(quizId);
  }
}
