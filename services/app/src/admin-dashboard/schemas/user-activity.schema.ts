import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserActivityDocument = UserActivity & Document;

@Schema({ timestamps: { createdAt: false, updatedAt: true } })
export class UserActivity {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Date })
  lastSeenAt?: Date;

  @Prop({ type: String, default: '' })
  lastAction?: string;
}

export const UserActivitySchema = SchemaFactory.createForClass(UserActivity);
