import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ required: true, type: String })
  courseId: string;

  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String })
  text: string;

  @Prop({ required: true, enum: ['positive', 'negative', 'neutral'] })
  sentiment: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);