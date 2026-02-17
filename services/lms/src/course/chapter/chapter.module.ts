import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { ChapterController } from './chapter.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from 'src/schemas/course/chapter.schema';
import { Course, CourseSchema } from 'src/schemas/course/course.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Chapter.name, schema: ChapterSchema },
    { name: Course.name, schema: CourseSchema },
  ])],
  controllers: [ChapterController],
  providers: [ChapterService],
})
export class ChapterModule {}
