import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from '../course/schema/course.schema';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enroll/schema/enrollment.schema';
import {
  ReviewCourse,
  ReviewCourseDocument,
} from './schema/review-course.schema';

@Injectable()
export class ReviewCourseService {
  constructor(
    @InjectModel(ReviewCourse.name)
    private reviewModel: Model<ReviewCourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async createReview(
    courseId: string,
    userId: string,
    createdBy: string,
    rating: number,
    title?: string,
    body?: string,
  ) {
    // Must be enrolled
    const enrolled = await this.enrollmentModel.findOne({
      courseId,
      userId,
      status: 'ACTIVE',
    });
    if (!enrolled)
      throw new ForbiddenException(
        'You must be enrolled to review this course',
      );

    const review = await this.reviewModel.findOneAndUpdate(
      { userId, courseId },
      { $set: { rating, title, body, createdBy } },
      { new: true, upsert: true },
    );

    await this.recomputeCourseRatingAggregate(courseId);
    return review;
  }

  async recomputeCourseRatingAggregate(courseId: string) {
    const agg = await this.reviewModel.aggregate([
      { $match: { courseId: new Types.ObjectId(courseId) } },
      {
        $group: {
          _id: '$courseId',
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const averageRating = agg[0]?.avg ? Math.round(agg[0].avg * 10) / 10 : 0;
    const ratingCount = agg[0]?.count || 0;

    await this.courseModel.findByIdAndUpdate(courseId, {
      averageRating,
      ratingCount,
    });
    return { averageRating, ratingCount };
  }

  async getReviews(courseId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.reviewModel
        .find({ courseId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.reviewModel.countDocuments({ courseId }),
    ]);
    return { items, total, page, limit };
  }

  async getMyReview(courseId: string, userId: string) {
    const review = await this.reviewModel.findOne({ courseId, userId });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }
}
