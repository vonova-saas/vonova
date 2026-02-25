import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LibraryReview, LibraryReviewDocument } from '../schema/review.schema';
import { Book, BookDocument } from '../schema/book/book.schema';
import { Guide } from '../schema/guide.schema';
import { Presentation } from '../schema/presentation.schema';
import mongoose from 'mongoose';

export type LibraryItemType = 'BOOK' | 'GUIDE' | 'PRESENTATION';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(LibraryReview.name)
    private readonly reviewModel: Model<LibraryReviewDocument>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
    @InjectModel(Guide.name)
    private readonly guideModel: Model<Guide>,
    @InjectModel(Presentation.name)
    private readonly presentationModel: Model<Presentation>,
  ) {}

  async createOrUpdate(
    itemType: LibraryItemType,
    itemId: string,
    userId: string,
    rating: number,
    title?: string,
    body?: string,
  ) {

    
    await this.ensureItemExists(itemType, itemId);

    console.log('cc');
    
    const review = await this.reviewModel.findOneAndUpdate(
      { userId, itemType, itemId },
      { $set: { rating, title, body } },
      { new: true, upsert: true },
    );

    await this.recomputeRatingAggregate(itemType, itemId);
    return review;
  }

  async list(itemType: LibraryItemType, itemId: string, page = 1, limit = 20) {
    await this.ensureItemExists(itemType, itemId);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.reviewModel
        .find({ itemType, itemId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.reviewModel.countDocuments({ itemType, itemId }),
    ]);

    return { items, total, page, limit };
  }

  async getMy(itemType: LibraryItemType, itemId: string, userId: string) {
    await this.ensureItemExists(itemType, itemId);
    const review = await this.reviewModel.findOne({ itemType, itemId, userId });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }


  async recomputeRatingAggregate(itemType: LibraryItemType, itemId: string) {
    const agg = await this.reviewModel.aggregate([
      { $match: { itemType, itemId: new mongoose.Types.ObjectId(itemId) } },
      { $group: { _id: '$itemId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const ratingAverage = agg[0]?.avg ? Math.round(agg[0].avg * 10) / 10 : 0;
    const ratingCount = agg[0]?.count || 0;
    const update = {
      $set: {
        'metrics.ratingAverage': ratingAverage,
        'metrics.ratingCount': ratingCount,
      },
    };

    if (itemType === 'BOOK') await this.bookModel.updateOne({ _id: itemId }, update);
    if (itemType === 'GUIDE') await this.guideModel.updateOne({ _id: itemId }, update);
    if (itemType === 'PRESENTATION') await this.presentationModel.updateOne({ _id: itemId }, update);

    return { ratingAverage, ratingCount };
  }

async ensureItemExists(itemType: LibraryItemType, itemId: string) {
  let exists = null;

  if (itemType === 'BOOK') {
   return exists = await this.bookModel.findById(itemId);
  } else if (itemType === 'GUIDE') {
   return exists = await this.guideModel.findById(itemId);
  } else if (itemType === 'PRESENTATION') {
   return exists = await this.presentationModel.findById(itemId);
  }

  if (!exists) throw new NotFoundException('Item not found');
}

}
