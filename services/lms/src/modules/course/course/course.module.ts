import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { Course, CourseSchema } from 'src/schemas/course/course.schema';
import { Chapter } from 'src/schemas/course/chapter.schema';
import { Lesson, LessonSchema } from 'src/schemas/course/lesson.schema';



@Module({
  imports: [MongooseModule.forFeature([
    { name: Course.name, schema: CourseSchema },
    {name : Chapter.name ,schema: CourseSchema },
    {name : Lesson.name ,schema: LessonSchema }

  ])],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService,MongooseModule],
})
export class CourseModule {}
