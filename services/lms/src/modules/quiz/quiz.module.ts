import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizSchema } from 'src/schemas/quiz/quiz.schema';
import { QuizAnswerSchema } from 'src/schemas/quiz/quiz-answer.schema';
import { Quiz } from 'src/schemas/quiz/quiz.schema';
import { QuizAnswer } from 'src/schemas/quiz/quiz-answer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema },
      { name: QuizAnswer.name, schema: QuizAnswerSchema }
    ])
  ],
  controllers: [QuizController],
  providers: [QuizService]
})
export class QuizModule {}
