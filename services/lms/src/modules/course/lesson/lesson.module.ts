import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { Lesson, LessonSchema } from 'src/schemas/course/lesson.schema';
import { Course, CourseSchema } from 'src/schemas/course/course.schema';
import { Chapter, ChapterSchema } from 'src/schemas/course/chapter.schema';


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
