import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserEventDocument = UserEvent & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class UserEvent {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const UserEventSchema = SchemaFactory.createForClass(UserEvent);
