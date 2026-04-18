import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { Lesson, LessonSchema } from './schema/lesson.schema';
import { Course, CourseSchema } from '../course/schema/course.schema';
import { Chapter, ChapterSchema } from '../chapter/schema/chapter.schema';
import { Asset, AssetSchema } from '../content/schema/asset.schema';
import { S3ConfigService } from './config/s3.config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lesson.name, schema: LessonSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Asset.name, schema: AssetSchema },
    ]),
  ],
  controllers: [LessonController],
  providers: [LessonService, S3ConfigService],
})
export class LessonModule {}
