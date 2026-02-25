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
  constructor(private readonly quizService: QuizService) {}

  @MessagePattern({ cmd: 'quiz.create' })
  createQuiz(@Payload() dto: CreateQuizDto) {
    return this.quizService.createQuiz(dto);
  }

  @MessagePattern({ cmd: 'quiz.update' })
  updateQuiz(@Payload('id') id: string, @Payload('dto') dto: UpdateQuizDto) {
    return this.quizService.updateQuiz(id, dto);
  }

  @MessagePattern({ cmd: 'quiz.getAll' })
  getAllQuizzes() {
    return this.quizService.getAllQuizzes();
  }

  @MessagePattern({ cmd: 'quiz.getById' })
  getQuiz(@Payload('id') id: string) {
    return this.quizService.getQuizById(id);
  }

  @MessagePattern({ cmd: 'quiz.delete' })
  deleteQuiz(@Payload('id') id: string) {
    return this.quizService.deleteQuiz(id);
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
  getMyAttempts(@Payload('quizId') quizId: string) {
    return this.quizService.getMyAttemptsForQuiz(quizId);
  }
}
