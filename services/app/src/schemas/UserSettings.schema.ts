import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';

export type UserSettingsDocument = UserSettings & Document;

export interface IUserSettingsModel extends Model<UserSettingsDocument> {
  getDefaultSettings(): any;
}

@Schema({ timestamps: true, minimize: false })
export class UserSettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // General Settings
  @Prop({ type: String, default: 'Inter' })
  font: string;

  @Prop({ type: String, default: '16' })
  fontSize: string;

  @Prop({
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system',
  })
  theme: 'light' | 'dark' | 'system';

  @Prop({ type: String, default: 'en' })
  language: string;

  @Prop({ type: String, default: () => Intl.DateTimeFormat().resolvedOptions().timeZone })
  timezone: string;

  @Prop({ type: String, default: 'MM/DD/YYYY' })
  dateFormat: string;

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
    font: 'Inter',
    fontSize: '16',
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    lastUpdated: new Date(),
    isActive: true,
  };
};

export { UserSettingsSchema as default };