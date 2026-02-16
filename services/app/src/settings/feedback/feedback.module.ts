import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { UserFeedbackSchema } from '../../schemas/feedback.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'UserFeedback', schema: UserFeedbackSchema },
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
