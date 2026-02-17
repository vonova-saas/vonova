import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import mongoose, { HydratedDocument } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({ timestamps: true, expires: 600 })
export class RefreshToken {
  @Prop({ required: true, ref: 'User' })
  @IsString()
  @IsNotEmpty()
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  tokenHash: string;

  @Prop({ required: true, unique: true })
  @IsString()
  @IsNotEmpty()
  jti: string;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  deviceHash: string;

  @Prop({
    required: true,
  })
  expiresAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Add TTL index to automatically delete documents after expiresAt
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
