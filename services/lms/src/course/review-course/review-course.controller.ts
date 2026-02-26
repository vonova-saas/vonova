import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReviewCourseService } from './review-course.service';

@Controller()
export class ReviewCourseController {
  constructor(private readonly reviewService: ReviewCourseService) {}

  @MessagePattern({ cmd: 'app.courses.reviews.create' })
  async createReview(@Payload() data: { courseId: string; userId: string; rating: number; title: string; body: string }) {
    const { courseId, userId, rating, title, body } = data;
    if (!courseId || !userId || !rating) throw new Error('courseId, userId and rating are required');

    const review = await this.reviewService.createReview(courseId, userId, rating, title, body);
    return { message: 'Review saved', data: review };
  }

  @MessagePattern({ cmd: 'app.courses.reviews.getAll' })
  async getReviews(@Payload() data: { courseId: string; page?: number; limit?: number }) {
    const { courseId, page = 1, limit = 20 } = data;
    if (!courseId) throw new Error('courseId is required');

    const result = await this.reviewService.getReviews(courseId, page, limit);
    return { message: 'Course reviews', data: result };
  }

  @MessagePattern({ cmd: 'app.courses.reviews.getMy' })
  async getMyReview(@Payload() data: { courseId: string; userId: string }) {
    const { courseId, userId } = data;
    if (!courseId || !userId) throw new Error('courseId and userId are required');

    const review = await this.reviewService.getMyReview(courseId, userId);
    return { message: 'My review', data: review };
  }
}