import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { Course, CourseSchema } from './schema/course.schema';
import { Chapter, ChapterSchema } from '../chapter/schema/chapter.schema';
import { Lesson, LessonSchema } from '../lesson/schema/lesson.schema';



@Module({
  imports: [MongooseModule.forFeature([
    { name: Course.name, schema: CourseSchema },
    { name: Chapter.name, schema: ChapterSchema },
    {name : Lesson.name ,schema: LessonSchema }

  ])],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService,MongooseModule],
})
export class CourseModule {}
