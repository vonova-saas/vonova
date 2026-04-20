import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateQuizDto,
  SubmitQuizAnswersDto,
  UpdateQuizDto,
} from './dto/quiz.dto';

@Injectable()
export class QuizGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createQuiz(dto: CreateQuizDto, userId: string) {
    return this.client.send({ cmd: 'quiz.create' }, { dto, userId });
  }

  updateQuiz(quizId: string, dto: UpdateQuizDto, userId: string) {
    return this.client.send({ cmd: 'quiz.update' }, { quizId, dto, userId });
  }

  getAllQuizzes(userId: string) {
    return this.client.send({ cmd: 'quiz.getAll' }, { userId });
  }

  getAllQuizzesForStudents() {
    return this.client.send({ cmd: 'quiz.getAllForStudents' }, {});
  }

  getQuizById(quizId: string) {
    return this.client.send({ cmd: 'quiz.getById' }, { quizId });
  }

  deleteQuiz(quizId: string, userId: string) {
    return this.client.send({ cmd: 'quiz.delete' }, { quizId, userId });
  }

  submitQuiz(quizId: string, dto: SubmitQuizAnswersDto) {
    return this.client.send(
      { cmd: 'quiz.submit' },
      {
        quizId,
        answers: dto.answers,
      },
    );
  }

  getAttempt(attemptId: string) {
    return this.client.send({ cmd: 'quiz.getAttempt' }, { attemptId });
  }

  getAttemptsForQuiz(quizId: string, userId: string) {
    return this.client.send(
      { cmd: 'quiz.getAttemptsForQuiz' },
      { quizId, userId },
    );
  }
}
