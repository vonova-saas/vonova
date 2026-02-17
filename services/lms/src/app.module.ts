import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/config/configuration';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizModule } from './quiz/quiz.module';
import { AssignmentModule } from './assignment/assignment.module';
import { BookModule } from './library/book/book.module';
import { PresentationModule } from './library/presentation/presentation.module';
import { GuideModule } from './library/guide/guide.module';
import { FavoriteModule } from './library/favorite/favorite.module';
import { ReviewModule } from './library/review/review.module';
import { CourseModule } from './course/course/course.module';
import { ChapterModule } from './course/chapter/chapter.module';
import { LessonModule } from './course/lesson/lesson.module';
import { ReaderModule } from './library/reader/reader.module';
import { UploadModule } from './library/upload/upload.module';
import { EnrollModule } from './course/enroll/enroll.module';
import { ContentModule } from './course/content/content.module';
import { ReviewCourseModule } from './course/review-course/review-course.module';
import { ProgressModule } from './course/progress/progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    MongooseModule.forRoot(configuration().MONGO_URI_LOCAL!),
    QuizModule,
    AssignmentModule,
    QuizModule,
    AssignmentModule,
    BookModule,
    PresentationModule,
    GuideModule,
    FavoriteModule,
    ReviewModule,
    CourseModule,
    ChapterModule,
    LessonModule,
    ReaderModule,
    UploadModule,
    EnrollModule,
    ContentModule,
    ReviewCourseModule,
    ProgressModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
