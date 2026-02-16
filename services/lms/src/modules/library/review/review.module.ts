import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { LibraryReview, LibraryReviewSchema } from 'src/schemas/library/review.schema';
import { Book, BookSchema } from '../../../schemas/library/book/book.schema';
import { Guide, GuideSchema } from 'src/schemas/library/guide.schema';
import { Presentation, PresentationSchema } from 'src/schemas/library/presentation.schema';

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
