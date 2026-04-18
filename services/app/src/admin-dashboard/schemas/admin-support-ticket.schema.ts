import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminSupportTicketDocument = AdminSupportTicket & Document;

export type AdminSupportType = 'BUG' | 'FEEDBACK';
export type AdminSupportStatus = 'OPEN' | 'REPLIED';

@Schema({ timestamps: true })
export class AdminSupportTicket {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, required: true, enum: ['BUG', 'FEEDBACK'] })
  type: AdminSupportType;

  @Prop({ type: String, required: true, enum: ['OPEN', 'REPLIED'], default: 'OPEN' })
  status: AdminSupportStatus;

  @Prop({ type: String })
  adminReply?: string;
}

export const AdminSupportTicketSchema =
  SchemaFactory.createForClass(AdminSupportTicket);
