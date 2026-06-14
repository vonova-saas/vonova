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
import { OutboundNatsModule } from '../../common/nats/outbound-nats.module';
import { CourseAnalyticsService } from './course-analytics.service';
import {
  ProblemSheet,
  ProblemSheetSchema,
} from '../../lms-ai/problem-solving/schemas/problem-sheet.schema';
import {
  Problem,
  ProblemSchema,
} from '../../lms-ai/problem-solving/schemas/problem.schema';
import {
  ProblemSolvingProgress,
  ProblemSolvingProgressSchema,
} from '../../lms-ai/problem-solving/schemas/problem-solving-progress.schema';
import { LMS_AI_CONNECTION_NAME } from '../../lms-ai/database/constants';

@Module({
  imports: [
    OutboundNatsModule,
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: QuizAnswer.name, schema: QuizAnswerSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
    MongooseModule.forFeature(
      [
        { name: ProblemSheet.name, schema: ProblemSheetSchema },
        { name: Problem.name, schema: ProblemSchema },
        {
          name: ProblemSolvingProgress.name,
          schema: ProblemSolvingProgressSchema,
        },
      ],
      LMS_AI_CONNECTION_NAME,
    ),
    CourseModule,
  ],
  controllers: [EnrollController],
  providers: [EnrollService, CourseAnalyticsService],
  exports: [EnrollService, CourseAnalyticsService],
})
export class EnrollModule {}
