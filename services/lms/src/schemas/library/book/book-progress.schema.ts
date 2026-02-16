import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookProgressDocument = BookProgress & Document;

@Schema({ timestamps: true })
export class BookProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LibraryBook', required: true, index: true })
  bookId: Types.ObjectId;

  @Prop({ default: 0 })
  lastPage: number;

  @Prop({ default: 0 })
  timeSpentSec: number;

  @Prop({ default: false })
  completed: boolean;

  @Prop()
  completedAt?: Date;
}

export const BookProgressSchema = SchemaFactory.createForClass(BookProgress);
BookProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });
