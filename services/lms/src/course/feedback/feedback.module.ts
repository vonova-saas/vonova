import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseFeedbackService } from './feedback.service';
import { Course, CourseSchema } from '../course/schema/course.schema';
import {
  Enrollment,
  EnrollmentSchema,
} from '../enroll/schema/enrollment.schema';
import { Feedback, FeedbackSchema } from './schema/feedback.schema';
import { CourseFeedbackController } from './feedback.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Feedback.name, schema: FeedbackSchema },
    ]),
  ],
  providers: [CourseFeedbackService],
  controllers: [CourseFeedbackController],
})
export class CourseFeedbackModule {}