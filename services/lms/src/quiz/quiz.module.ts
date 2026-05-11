import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from './schema/quiz.schema';
import { QuizAnswer, QuizAnswerSchema } from './schema/quiz-answer.schema';
import { EnrollModule } from '../course/enroll/enroll.module';
import { CourseModule } from '../course/course/course.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: QuizAnswer.name, schema: QuizAnswerSchema },
    ]),
    EnrollModule,
    CourseModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
