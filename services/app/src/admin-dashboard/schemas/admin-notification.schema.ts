import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminNotificationDocument = AdminNotification & Document;
export type AdminNotificationType = 'NEW_SUPPORT' | 'INSTRUCTOR_APPLICATION';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AdminNotification {
  @Prop({
    type: String,
    required: true,
    enum: ['NEW_SUPPORT', 'INSTRUCTOR_APPLICATION'],
  })
  type: AdminNotificationType;

  @Prop({ type: Types.ObjectId, index: true })
  userId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Boolean, default: false, index: true })
  isRead: boolean;

  @Prop({ type: Types.ObjectId })
  supportTicketId?: Types.ObjectId;

  createdAt?: Date;
}

export const AdminNotificationSchema =
  SchemaFactory.createForClass(AdminNotification);
