import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from '../course/schema/course.schema';
import { Enrollment, EnrollmentDocument } from './schema/enrollment.schema';
import { Lesson } from '../lesson/schema/lesson.schema';

@Injectable()
export class EnrollService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
  ) {}

  async enrollCourse(courseId: string, userId: string, couponCode?: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.enrollmentModel.findOne({ courseId, userId });
    if (existing) return existing;

    return this.enrollmentModel.create({
      courseId,
      userId,
      status: 'ACTIVE',
      purchasedAt: new Date(),
      pricePaid: course.price?.amount,
      currency: course.price?.currency,
      couponCode,
    });
  }

  async getEnrollment(courseId: string, userId: string) {
    const enrollment = await this.enrollmentModel.findOne({ courseId, userId });
    if (!enrollment) throw new NotFoundException('Not enrolled');
    return enrollment;
  }

  async isEnrolled(courseId: string, userId: string): Promise<boolean> {
    const enrollment = await this.enrollmentModel.findOne({
      courseId,
      userId,
      status: 'ACTIVE',
    });
    return !!enrollment;
  }

  async getLessonAccess(courseId: string, lessonId: string, userId: string) {
    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    if (lesson.previewable) {
      return { access: true, reason: 'preview' };
    }

    const enrolled = await this.isEnrolled(courseId, userId);
    return {
      access: enrolled,
      reason: enrolled ? 'enrolled' : 'not_enrolled',
    };
  }
}
