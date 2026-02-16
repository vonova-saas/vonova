import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type LibraryReviewDocument = LibraryReview & Document;

@Schema({ timestamps: true })
export class LibraryReview {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: String, enum: ['BOOK', 'GUIDE', 'PRESENTATION'], required: true, index: true })
  itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION';

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  itemId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String })
  title?: string;

  @Prop({ type: String })
  body?: string;
}

export const LibraryReviewSchema = SchemaFactory.createForClass(LibraryReview);

LibraryReviewSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });
