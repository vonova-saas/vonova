import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { Course, CourseSchema } from '../course/schema/course.schema';
import { Chapter, ChapterSchema } from '../chapter/schema/chapter.schema';
import { Lesson, LessonSchema } from '../lesson/schema/lesson.schema';
import { Asset, AssetSchema } from './schema/asset.schema';
import { S3Service } from '../../common/utils/storage/s3.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Asset.name, schema: AssetSchema },
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService,S3Service],
})
export class ContentModule {}
