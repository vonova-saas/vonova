import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { S3Service } from '../../common/utils/storage/s3.service';
import { Course, CourseSchema } from './schema/course.schema';
import { Chapter, ChapterSchema } from '../chapter/schema/chapter.schema';
import { Lesson, LessonSchema } from '../lesson/schema/lesson.schema';
import {
  Enrollment,
  EnrollmentSchema,
} from '../enroll/schema/enrollment.schema';
import { Asset, AssetSchema } from '../content/schema/asset.schema';
import { Book, BookSchema } from '../../library/schema/book/book.schema';
import { Guide, GuideSchema } from '../../library/schema/guide.schema';
import {
  Presentation,
  PresentationSchema,
} from '../../library/schema/presentation.schema';
import {
  LibraryAsset,
  LibraryAssetSchema,
} from '../../library/schema/library-asset.schema';
import { Quiz, QuizSchema } from '../../quiz/schema/quiz.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: Book.name, schema: BookSchema },
      { name: Guide.name, schema: GuideSchema },
      { name: Presentation.name, schema: PresentationSchema },
      { name: LibraryAsset.name, schema: LibraryAssetSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
  ],
  controllers: [CourseController],
  providers: [CourseService, S3Service],
  exports: [CourseService, MongooseModule],
})
export class CourseModule {}
