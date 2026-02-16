import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizModule } from './modules/quiz/quiz.module';
import { AssignmentModule } from './modules/assignment/assignment.module';
import { BookModule } from './modules/library/book/book.module';
import { PresentationModule } from './modules/library/presentation/presentation.module';
import { GuideModule } from './modules/library/guide/guide.module';
import { FavoriteModule } from './modules/library/favorite/favorite.module';
import { ReviewModule } from './modules/library/review/review.module';
import { CourseModule } from './modules/course/course/course.module';
import { ChapterModule } from './modules/course/chapter/chapter.module';
import { LessonModule } from './modules/course/lesson/lesson.module';
import { ReaderModule } from './modules/library/reader/reader.module';
import { UploadModule } from './modules/library/upload/upload.module';
import { EnrollModule } from './modules/course/enroll/enroll.module';
import { ContentModule } from './modules/course/content/content.module';
import { ReviewCourseModule } from './modules/course/review-course/review-course.module';
import { ProgressModule } from './modules/course/progress/progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    QuizModule,
    AssignmentModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const mongoUri = configService.get<string>('MONGO_URI_RMOTE');

        if (!mongoUri) {
          throw new Error(
            'MONGO_URI_RMOTE environment variable is required but not set',
          );
        }

        return {
          uri: mongoUri,
        };
      },
      inject: [ConfigService],
    }),
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
  providers: [AppService],
})
export class AppModule {}
