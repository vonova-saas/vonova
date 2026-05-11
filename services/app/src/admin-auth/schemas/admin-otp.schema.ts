import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { HydratedDocument } from 'mongoose';

export type AdminOtpDocument = HydratedDocument<AdminOtp>;

@Schema({ timestamps: true, strict: true })
export class AdminOtp {
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  @IsNotEmpty()
  @IsString()
  email: string;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  code: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  @IsBoolean()
  used: boolean;

  @Prop({ default: 0 })
  @IsNumber()
  failedAttempts: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const AdminOtpSchema = SchemaFactory.createForClass(AdminOtp);

// TTL index for automatic cleanup of expired OTPs (field has index: true, adding TTL option)
AdminOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
