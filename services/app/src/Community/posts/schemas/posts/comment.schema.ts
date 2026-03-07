import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  text: string;

  @Prop({ type: String, default: null })
  image?: string;

  @Prop({ type: String, default: null })
  imageKey?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: Number, default: 0, min: 0 })
  likesCount: number;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Indexes for performance
CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });
