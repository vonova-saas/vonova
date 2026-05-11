import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QuizService } from './quiz.service';
import {
  CreateQuizDto,
  SubmitQuizAnswersDto,
  SubmitAnswerItemDto,
  UpdateQuizDto,
} from './dto/quiz.dto';

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) { }

  // ===== INSTRUCTOR-SPECIFIC MESSAGE PATTERNS =====

  @MessagePattern({ cmd: 'quiz.createInstructor' })
  createInstructorQuiz(
    @Payload('dto') dto: CreateQuizDto,
    @Payload('userId') userId: string,
  ) {
    return this.quizService.createInstructorQuiz(dto, userId);
  }

  @MessagePattern({ cmd: 'quiz.updateInstructor' })
  updateInstructorQuiz(
    @Payload('quizId') quizId: string,
    @Payload('dto') dto: UpdateQuizDto,
    @Payload('userId') userId: string,
  ) {
    return this.quizService.updateInstructorQuiz(quizId, dto, userId);
  }

  @MessagePattern({ cmd: 'quiz.getInstructorQuizzes' })
  getInstructorQuizzes(
    @Payload('userId') userId: string,
    @Payload('courseId') courseId?: string,
  ) {
    return this.quizService.getInstructorQuizzes(userId, courseId);
  }

  @MessagePattern({ cmd: 'quiz.getInstructorQuizzesByCourse' })
  getInstructorQuizzesByCourse(
    @Payload('userId') userId: string,
    @Payload('courseId') courseId: string,
  ) {
    return this.quizService.getInstructorQuizzesByCourse(userId, courseId);
  }

  @MessagePattern({ cmd: 'quiz.getInstructorQuizById' })
  getInstructorQuizById(
    @Payload('quizId') quizId: string,
    @Payload('userId') userId: string,
  ) {
    return this.quizService.getInstructorQuizById(quizId, userId);
  }

  @MessagePattern({ cmd: 'quiz.deleteInstructor' })
  deleteInstructorQuiz(
    @Payload('quizId') quizId: string,
    @Payload('userId') userId: string,
  ) {
    return this.quizService.deleteInstructorQuiz(quizId, userId);
  }

  @MessagePattern({ cmd: 'quiz.getInstructorAttempts' })
  getInstructorQuizAttempts(
    @Payload('quizId') quizId: string,
    @Payload('userId') userId: string,
  ) {
    return this.quizService.getInstructorQuizAttempts(quizId, userId);
  }

  @MessagePattern({ cmd: 'quiz.getInstructorStatistics' })
  getInstructorQuizStatistics(
    @Payload('quizId') quizId: string,
    @Payload('userId') userId: string,
  ) {
    return this.quizService.getInstructorQuizStatistics(quizId, userId);
  }

  // ===== STUDENT-SPECIFIC MESSAGE PATTERNS =====

  @MessagePattern({ cmd: 'quiz.getAvailableForStudents' })
  getAvailableQuizzesForStudents(
    @Payload('userId') userId?: string,
    @Payload('enrolledCourseIds') enrolledCourseIds?: string[],
  ) {
    return this.quizService.getAvailableQuizzesForStudents(userId, enrolledCourseIds);
  }

  @MessagePattern({ cmd: 'quiz.getQuizForStudent' })
  getQuizForStudent(
    @Payload('quizId') quizId: string,
    @Payload('userId') userId: string,
    @Payload('enrolledCourseIds') enrolledCourseIds?: string[],
  ) {
    return this.quizService.getQuizForStudent(quizId, userId, enrolledCourseIds);
  }

  @MessagePattern({ cmd: 'quiz.submitStudent' })
  submitStudentQuiz(
    @Payload('quizId') quizId: string,
    @Payload('answers') answers: SubmitAnswerItemDto[],
    @Payload('userId') userId: string,
    @Payload('enrolledCourseIds') enrolledCourseIds?: string[],
  ) {
    return this.quizService.submitStudentQuiz(quizId, answers, userId, enrolledCourseIds);
  }

  @MessagePattern({ cmd: 'quiz.getStudentAttempt' })
  getStudentAttempt(
    @Payload('attemptId') attemptId: string,
    @Payload('userId') userId: string,
  ) {
    return this.quizService.getStudentAttempt(attemptId, userId);
  }

  @MessagePattern({ cmd: 'quiz.getStudentAttempts' })
  getStudentQuizAttempts(@Payload('userId') userId: string) {
    return this.quizService.getStudentQuizAttempts(userId);
  }
}
