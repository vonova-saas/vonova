import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { Course, CourseSchema } from 'src/schemas/course/course.schema';
import { Chapter, ChapterSchema } from 'src/schemas/course/chapter.schema';
import { Lesson, LessonSchema } from 'src/schemas/course/lesson.schema';
import { Asset, AssetSchema } from 'src/schemas/course/asset.schema';
import { S3Service } from 'src/utils/storage/s3.service';


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
