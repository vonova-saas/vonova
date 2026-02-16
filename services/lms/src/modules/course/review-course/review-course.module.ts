import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewCourseService } from './review-course.service';
import { ReviewCourseController } from './review-course.controller';
import { ReviewCourse, ReviewCourseSchema } from 'src/schemas/course/review-course.schema';
import { Enrollment, EnrollmentSchema } from 'src/schemas/course/enrollment.schema';
import { Course, CourseSchema } from 'src/schemas/course/course.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ReviewCourse.name, schema: ReviewCourseSchema }]),

    MongooseModule.forFeature([{ name: Enrollment.name, schema: EnrollmentSchema }]),
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
],
  providers: [ReviewCourseService],
  controllers: [ReviewCourseController],
})
export class ReviewCourseModule {}
