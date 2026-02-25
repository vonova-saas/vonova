import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { DatabaseModule } from './lms-ai/database/database.module';
import { RoadmapModule } from './lms-ai/roadmap/roadmap.module';
import { PdfSummaryModule } from './lms-ai/pdf-summary/pdf-summary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const local = configService.get<string>('MONGO_URI_LOCAL');
        const remote = configService.get<string>('MONGO_URI_REMOTE');
        // Use LOCAL only if it's not the Docker hostname (reachable when running outside Docker)
        const uri =
          local &&
            !local.includes('mongodb://database:') &&
            !local.includes('mongodb://database/')
            ? local
            : remote || local || 'mongodb://localhost:27017/';
        return { uri };
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
    // LMS-AI (roadmap, PDF summary) – same service
    DatabaseModule,
    RoadmapModule,
    PdfSummaryModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
