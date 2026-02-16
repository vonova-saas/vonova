import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type FavoriteDocument = Favorite & Document;

export type ItemType = 'BOOK' | 'GUIDE' | 'PRESENTATION';

@Schema({ timestamps: true })
export class Favorite {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: String, enum: ['BOOK', 'GUIDE', 'PRESENTATION'], required: true, index: true })
  itemType: ItemType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  itemId: mongoose.Schema.Types.ObjectId;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

FavoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });
