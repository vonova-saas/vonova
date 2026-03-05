import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReviewService } from './review.service';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @MessagePattern({ cmd: 'library.reviews.createOrUpdate' })
  async createOrUpdateReview(
    @Payload()
    data: {
      itemType: any;
      itemId: string;
      userId: string;
      rating: number;
      title: string;
      body: string;
    },
  ) {
    const { itemType, itemId, userId, rating, title, body } = data;
    if (!itemType || !itemId || !userId || !rating)
      throw new Error('itemType, itemId, userId and rating are required');

    const review = await this.reviewService.createOrUpdate(
      itemType,
      itemId,
      userId,
      rating,
      title,
      body,
    );
    return { message: 'Review created or updated successfully', data: review };
  }

  @MessagePattern({ cmd: 'library.reviews.getAll' })
  async listReviews(
    @Payload()
    data: {
      itemType: any;
      itemId: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { itemType, itemId, page = 1, limit = 20 } = data;
    if (!itemType || !itemId)
      throw new Error('itemType and itemId are required');

    const result = await this.reviewService.list(itemType, itemId, page, limit);
    return { message: 'Reviews list fetched successfully', data: result };
  }

  @MessagePattern({ cmd: 'library.reviews.getMy' })
  async getMyReview(
    @Payload() data: { itemType: any; itemId: string; userId: string },
  ) {
    const { itemType, itemId, userId } = data;
    if (!itemType || !itemId || !userId)
      throw new Error('itemType, itemId and userId are required');

    const review = await this.reviewService.getMy(itemType, itemId, userId);
    return { message: 'User review fetched successfully', data: review };
  }
}
