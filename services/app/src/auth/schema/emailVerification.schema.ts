import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { HydratedDocument } from 'mongoose';

export type EmailVerificationDocument = HydratedDocument<EmailVerification>;

@Schema({ timestamps: true })
export class EmailVerification {
  @Prop({ required: true, lowercase: true, trim: true })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  verificationCode: string;

  @Prop({
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000),
  })
  expiresAt: Date;

  @Prop({ default: false })
  @IsBoolean()
  used: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const EmailVerificationSchema =
  SchemaFactory.createForClass(EmailVerification);

// Add TTL index to automatically delete documents after expiresAt
EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
