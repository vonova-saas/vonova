import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import mongoose, { HydratedDocument } from 'mongoose';
import { ProviderEnum } from '../enums/provider.enum';

export type AccountDocument = HydratedDocument<Account>;

@Schema({ timestamps: true })
export class Account {
  @Prop({ type: String, enum: ProviderEnum, required: true })
  @IsString()
  @IsNotEmpty()
  provider: ProviderEnum;

  @Prop({ required: true, unique: true })
  @IsString()
  @IsNotEmpty()
  providerId: string; // Store the email, googleId, facebookId as the providerId

  @Prop({ required: true, ref: 'User', unique: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, default: null })
  @IsString()
  refreshToken?: string | null;

  @Prop({ type: Date, default: null })
  @IsString()
  tokenExpiry: Date | null;

  @Prop()
  createdAt: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
