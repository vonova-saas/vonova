import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { HydratedDocument } from 'mongoose';

export type PasswordResetDocument = HydratedDocument<PasswordReset>;

@Schema({ timestamps: true, expires: 600 })
export class PasswordReset {
  @Prop({ required: true, lowercase: true, trim: true })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  resetCode: string;

  @Prop({
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000),
    index: { expireAfterSeconds: 0 },
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

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);

// Add TTL index to automatically delete documents after expiresAt
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
