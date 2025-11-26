import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizModule } from './modules/quiz/quiz.module';
import { AssignmentModule } from './modules/assignment/assignment.module';

@Module({
  imports: [
    QuizModule,
    AssignmentModule,
    MongooseModule.forRoot('mongodb://localhost:27017/lms')
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
