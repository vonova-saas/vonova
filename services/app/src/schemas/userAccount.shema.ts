import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, minimize: false })
export class UserAccount extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true, index: true })
  email: string;

  @Prop({ default: null })
  avatarUrl?: string;

  @Prop({ maxlength: 1000, default: null })
  bio?: string;

  @Prop({ default: null })
  dateOfBirth?: string;

  @Prop({ maxlength: 500, default: null })
  address?: string;
}

export const UserAccountSchema = SchemaFactory.createForClass(UserAccount);
