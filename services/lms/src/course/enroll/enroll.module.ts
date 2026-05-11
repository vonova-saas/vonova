import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Enrollment, EnrollmentSchema } from './schema/enrollment.schema';
import { EnrollService } from './enroll.service';
import { EnrollController } from './enroll.controller';
import { CourseModule } from '../course/course.module';
import {
  LessonProgress,
  LessonProgressSchema,
} from '../progress/schema/lesson-progress.schema';
import { QuizAnswer, QuizAnswerSchema } from '../../quiz/schema/quiz-answer.schema';
import { Quiz, QuizSchema } from '../../quiz/schema/quiz.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: QuizAnswer.name, schema: QuizAnswerSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
    CourseModule,
  ],
  controllers: [EnrollController],
  providers: [EnrollService],
  exports: [EnrollService],
})
export class EnrollModule {}
