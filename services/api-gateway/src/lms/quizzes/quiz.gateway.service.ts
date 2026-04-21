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

  
  // ===== INSTRUCTOR-SPECIFIC METHODS =====

  createInstructorQuiz(dto: CreateQuizDto, userId: string) {
    return this.client.send({ cmd: 'quiz.createInstructor' }, { dto, userId });
  }

  updateInstructorQuiz(quizId: string, dto: UpdateQuizDto, userId: string) {
    return this.client.send({ cmd: 'quiz.updateInstructor' }, { quizId, dto, userId });
  }

  getInstructorQuizzes(userId: string) {
    return this.client.send({ cmd: 'quiz.getInstructorQuizzes' }, { userId });
  }

  getInstructorQuizById(quizId: string, userId: string) {
    return this.client.send({ cmd: 'quiz.getInstructorQuizById' }, { quizId, userId });
  }

  deleteInstructorQuiz(quizId: string, userId: string) {
    return this.client.send({ cmd: 'quiz.deleteInstructor' }, { quizId, userId });
  }

  getInstructorQuizAttempts(quizId: string, userId: string) {
    return this.client.send({ cmd: 'quiz.getInstructorAttempts' }, { quizId, userId });
  }

  getInstructorQuizStatistics(quizId: string, userId: string) {
    return this.client.send({ cmd: 'quiz.getInstructorStatistics' }, { quizId, userId });
  }

  // ===== STUDENT-SPECIFIC METHODS =====

  getAvailableQuizzesForStudents() {
    return this.client.send({ cmd: 'quiz.getAvailableForStudents' }, {});
  }

  getQuizForStudent(quizId: string, userId: string) {
    return this.client.send({ cmd: 'quiz.getQuizForStudent' }, { quizId, userId });
  }

  submitStudentQuiz(quizId: string, dto: SubmitQuizAnswersDto, userId: string) {
    return this.client.send(
      { cmd: 'quiz.submitStudent' },
      {
        quizId,
        answers: dto.answers,
        userId,
      },
    );
  }

  getStudentAttempt(attemptId: string, userId: string) {
    return this.client.send({ cmd: 'quiz.getStudentAttempt' }, { attemptId, userId });
  }

  getStudentQuizAttempts(userId: string) {
    return this.client.send({ cmd: 'quiz.getStudentAttempts' }, { userId });
  }

  
  }
