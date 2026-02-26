import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ReviewGatewayService } from './review.gateway.service';
import { CreateOrUpdateReviewDto, ListReviewsQuery } from './dto/review.dto';

@Controller('api/v1/lms/library/items')
@UseGuards(JwtAuthGuard)
export class ReviewGatewayController {
  constructor(private readonly reviewService: ReviewGatewayService) {}

  @Post(':itemType/:itemId/reviews')
  async createOrUpdateReview(
    @Param('itemType') itemType: any,
    @Param('itemId') itemId: string,
    @Body() dto: CreateOrUpdateReviewDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    const review = await firstValueFrom(this.reviewService.createOrUpdateReview(
      itemType,
      itemId,
      userId,
      dto,
    ));

    return { message: 'Review created or updated successfully', data: review };
  }

  @Get(':itemType/:itemId/reviews')
  async listReviews(
    @Param('itemType') itemType: any,
    @Param('itemId') itemId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const data = await firstValueFrom(this.reviewService.listReviews(itemType, itemId, { page, limit }));
    return { message: 'Reviews list fetched successfully', data };
  }

  @Get(':itemType/:itemId/reviews/me')
  async getMyReview(
    @Param('itemType') itemType: any,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    const review = await firstValueFrom(this.reviewService.getMyReview(itemType, itemId, userId));
    return { message: 'User review fetched successfully', data: review };
  }
}
