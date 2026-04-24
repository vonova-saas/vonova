import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AdminSettingsDocument = HydratedDocument<AdminSettings>;

@Schema({ timestamps: true, minimize: false })
export class AdminSettings {
  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true, unique: true })
  adminId: Types.ObjectId;

  @Prop({ type: String, default: 'cairo' })
  font: string;

  @Prop({ type: String, default: '16' })
  fontSize: string;

  @Prop({ type: String, enum: ['light', 'dark'], default: 'light' })
  theme: 'light' | 'dark';

  @Prop({ type: String, default: 'en' })
  language: string;

  @Prop({ type: String, enum: ['all', 'mentions', 'none'], default: 'all' })
  notifyMe: 'all' | 'mentions' | 'none';

  @Prop({ type: Boolean, default: false })
  communicationEmails: boolean;

  @Prop({ type: Boolean, default: false })
  marketingEmails: boolean;

  @Prop({ type: Boolean, default: false })
  socialEmails: boolean;

  @Prop({ type: Boolean, default: true })
  securityEmails: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminSettingsSchema = SchemaFactory.createForClass(AdminSettings);
