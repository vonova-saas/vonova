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

  createQuiz(dto: CreateQuizDto) {
    return this.client.send({ cmd: 'quiz.create' }, dto);
  }

  updateQuiz(id: string, dto: UpdateQuizDto) {
    return this.client.send({ cmd: 'quiz.update' }, { id, dto });
  }

  getAllQuizzes() {
    return this.client.send({ cmd: 'quiz.getAll' }, {});
  }

  getQuizById(id: string) {
    return this.client.send({ cmd: 'quiz.getById' }, { id });
  }

  deleteQuiz(id: string) {
    return this.client.send({ cmd: 'quiz.delete' }, { id });
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

  getAttemptsForQuiz(quizId: string) {
    return this.client.send({ cmd: 'quiz.getAttemptsForQuiz' }, { quizId });
  }
}
