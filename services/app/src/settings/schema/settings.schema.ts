import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Model } from 'mongoose';

export type UserSettingsDocument = UserSettings & Document;

export interface IUserSettingsModel extends Model<UserSettingsDocument> {
  getDefaultSettings(): any;
}

@Schema({ timestamps: true, minimize: false })
export class UserSettings {
  @Prop({ ref: 'User', required: true, index: true })
  userId: mongoose.Types.ObjectId;

  // General Settings
  @Prop({
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system',
  })
  theme: 'light' | 'dark' | 'system';

  @Prop({ type: String, default: 'en' })
  language: string;

  // Notifications
  @Prop({
    type: String,
    enum: ['all', 'mentions', 'none'],
    default: 'all',
  })
  type: 'all' | 'mentions' | 'none';

  @Prop({ type: Boolean, default: false })
  communication_emails: boolean;

  @Prop({ type: Boolean, default: false })
  marketing_emails: boolean;

  @Prop({ type: Boolean, default: false })
  social_emails: boolean;

  @Prop({ type: Boolean, default: true })
  security_emails: boolean;

  @Prop({ type: Boolean, default: false })
  mobile: boolean;

  // Metadata
  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettings);

// Add indexes
UserSettingsSchema.index({ userId: 1 }, { unique: true });

// Static methods
UserSettingsSchema.statics.getDefaultSettings = function (): any {
  return {
    theme: 'system',
    language: 'en',
    // notifications part
    type: 'all',
    communication_emails: false,
    marketing_emails: false,
    social_emails: false,
    security_emails: true,
    mobile: false,
    lastUpdated: new Date(),
    isActive: true,
  };
};

export { UserSettingsSchema as default };
