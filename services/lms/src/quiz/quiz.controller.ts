import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QuizService } from './quiz.service';
import {
  CreateQuizDto,
  SubmitQuizAnswersDto,
  UpdateQuizDto,
} from './dto/quiz.dto';

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) { }

  @MessagePattern({ cmd: 'quiz.create' })
  createQuiz(@Payload('dto') dto: CreateQuizDto, @Payload('userId') userId: string) {
    return this.quizService.createQuiz(dto, userId);
  }

  @MessagePattern({ cmd: 'quiz.update' })
  updateQuiz(@Payload('quizId') quizId: string, @Payload('dto') dto: UpdateQuizDto, @Payload('userId') userId: string) {
    return this.quizService.updateQuiz(quizId, dto, userId);
  }

  @MessagePattern({ cmd: 'quiz.getAll' })
  getAllQuizzes(@Payload('userId') userId: string) {
    return this.quizService.getAllQuizzes(userId);
  }

  @MessagePattern({ cmd: 'quiz.getById' })
  getQuiz(@Payload('quizId') quizId: string) {
    return this.quizService.getQuizById(quizId);
  }

  @MessagePattern({ cmd: 'quiz.delete' })
  deleteQuiz(@Payload('quizId') quizId: string, @Payload('userId') userId: string) {
    return this.quizService.deleteQuiz(quizId, userId);
  }

  // ===== Attempts =====

  @MessagePattern({ cmd: 'quiz.submit' })
  submitQuiz(
    @Payload('quizId') quizId: string,
    @Payload('answers') dto: SubmitQuizAnswersDto['answers'],
  ) {
    return this.quizService.submitQuizAnswers(quizId, dto);
  }

  @MessagePattern({ cmd: 'quiz.getAttempt' })
  getMyAttempt(@Payload('attemptId') attemptId: string) {
    return this.quizService.getMyAttempt(attemptId);
  }

  @MessagePattern({ cmd: 'quiz.getAttemptsForQuiz' })
  getMyAttempts(@Payload('quizId') quizId: string, @Payload('userId') userId: string) {
    return this.quizService.getMyAttemptsForQuiz(quizId, userId);
  }
}
