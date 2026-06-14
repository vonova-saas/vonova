import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { Course, CourseSchema } from '../course/schema/course.schema';
import { Chapter, ChapterSchema } from '../chapter/schema/chapter.schema';
import { Lesson, LessonSchema } from '../lesson/schema/lesson.schema';
import { Asset, AssetSchema } from './schema/asset.schema';
import { S3Service } from '../../common/utils/storage/s3.service';
import { S3ConfigService } from '../lesson/config/s3.config';
import { EnrollModule } from '../enroll/enroll.module';
import { Quiz, QuizSchema } from '../../quiz/schema/quiz.schema';
import { Book, BookSchema } from '../../library/schema/book/book.schema';
import { Guide, GuideSchema } from '../../library/schema/guide.schema';
import {
  Presentation,
  PresentationSchema,
} from '../../library/schema/presentation.schema';
import {
  Problem,
  ProblemSchema,
} from '../../lms-ai/problem-solving/schemas/problem.schema';
import {
  LessonProgress,
  LessonProgressSchema,
} from '../progress/schema/lesson-progress.schema';
import { ProgressModule } from '../progress/progress.module';
import {
  ProblemSheet,
  ProblemSheetSchema,
} from '../../lms-ai/problem-solving/schemas/problem-sheet.schema';
import {
  SheetProgress,
  SheetProgressSchema,
} from '../../lms-ai/problem-solving/schemas/sheet-progress.schema';
import { LMS_AI_CONNECTION_NAME } from '../../lms-ai/database/constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: Book.name, schema: BookSchema },
      { name: Guide.name, schema: GuideSchema },
      { name: Presentation.name, schema: PresentationSchema },
      { name: Problem.name, schema: ProblemSchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
    ]),
    MongooseModule.forFeature(
      [
        { name: ProblemSheet.name, schema: ProblemSheetSchema },
        { name: SheetProgress.name, schema: SheetProgressSchema },
      ],
      LMS_AI_CONNECTION_NAME,
    ),
    EnrollModule,
    ProgressModule,
  ],
  controllers: [ContentController],
  providers: [ContentService, S3Service, S3ConfigService],
})
export class ContentModule {}
