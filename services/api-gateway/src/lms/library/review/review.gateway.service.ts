import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrUpdateReviewDto, ListReviewsQuery } from './dto/review.dto';

@Injectable()
export class ReviewGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createOrUpdateReview(itemType: string, itemId: string, userId: string, dto: CreateOrUpdateReviewDto) {
    return this.client.send({ cmd: 'library.reviews.createOrUpdate' }, { 
      itemType, 
      itemId, 
      userId, 
      rating: dto.rating, 
      title: dto.title, 
      body: dto.body 
    });
  }

  listReviews(itemType: string, itemId: string, query: ListReviewsQuery) {
    return this.client.send({ cmd: 'library.reviews.getAll' }, { 
      itemType, 
      itemId, 
      page: query.page, 
      limit: query.limit 
    });
  }

  getMyReview(itemType: string, itemId: string, userId: string) {
    return this.client.send({ cmd: 'library.reviews.getMy' }, { itemType, itemId, userId });
  }
}
