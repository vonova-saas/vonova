import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewCourseService } from './review-course.service';
import { ReviewCourseController } from './review-course.controller';
import { ReviewCourse, ReviewCourseSchema } from './schema/review-course.schema';
import { Enrollment, EnrollmentSchema } from '../enroll/schema/enrollment.schema';
import { Course, CourseSchema } from '../course/schema/course.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ReviewCourse.name, schema: ReviewCourseSchema }]),

    MongooseModule.forFeature([{ name: Enrollment.name, schema: EnrollmentSchema }]),
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
],
  providers: [ReviewCourseService],
  controllers: [ReviewCourseController],
})
export class ReviewCourseModule {}
