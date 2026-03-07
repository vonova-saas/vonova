import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { Lesson, LessonSchema } from './schema/lesson.schema';
import { Course, CourseSchema } from '../course/schema/course.schema';
import { Chapter, ChapterSchema } from '../chapter/schema/chapter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lesson.name, schema: LessonSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Chapter.name, schema: ChapterSchema },
    ]),
  ],
  controllers: [LessonController],
  providers: [LessonService],
})
export class LessonModule {}
