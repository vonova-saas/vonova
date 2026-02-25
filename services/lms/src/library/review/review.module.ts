import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { LibraryReview, LibraryReviewSchema } from '../schema/review.schema';
import { Book, BookSchema } from '../schema/book/book.schema';
import { Guide, GuideSchema } from '../schema/guide.schema';
import { Presentation, PresentationSchema } from '../schema/presentation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LibraryReview.name, schema: LibraryReviewSchema },
      { name: Book.name, schema: BookSchema },
      { name: Guide.name, schema: GuideSchema },
      { name: Presentation.name, schema: PresentationSchema },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
