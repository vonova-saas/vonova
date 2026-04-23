import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateReviewCourseDto } from './dto/review.dto';

@Injectable()
export class ReviewCourseGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createReview(
    courseId: string,
    userId: string,
    createdBy: string,
    dto: CreateReviewCourseDto,
  ) {
    return this.client.send(
      { cmd: 'app.courses.reviews.create' },
      {
        courseId,
        userId,
        createdBy,
        user: { id: createdBy },
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
      },
    );
  }

  getReviews(courseId: string, page?: number, limit?: number) {
    return this.client.send(
      { cmd: 'app.courses.reviews.getAll' },
      { courseId, page, limit },
    );
  }

  getMyReview(courseId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.courses.reviews.getMy' },
      { courseId, userId },
    );
  }
}
