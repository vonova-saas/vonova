import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProviderEnum, ProviderEnumType } from '../../enums/account-provider.enum';

export type AccountDocument = Account & Document;

@Schema({ timestamps: true })
export class Account {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ProviderEnum), required: true })
  provider!: ProviderEnumType;

  @Prop({ required: true, unique: true })
  providerId!: string;

  @Prop({ type: String, default: null })
  refreshToken?: string | null;

  @Prop({ type: Date, default: null })
  tokenExpiry?: Date | null;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

AccountSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.refreshToken;
  },
});

