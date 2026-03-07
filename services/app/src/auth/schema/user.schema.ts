/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { HydratedDocument } from 'mongoose';
import { Role } from '../enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  @IsNotEmpty()
  @IsString()
  email: string;

  @Prop({ select: true })
  @IsString()
  password?: string;

  @Prop({ type: String, default: null })
  @IsString()
  profilePictureUrl: string | null;

  @Prop({ type: String, enum: Role, default: Role.PENDING })
  role: Role;

  @Prop({ default: false })
  @IsBoolean()
  isVerified: boolean;

  @Prop({ type: String, lowercase: true, trim: true, default: null })
  @IsString()
  knowAboutUs: string | null;

  @Prop({ type: String, default: null })
  @IsString()
  couponCode?: string | null;

  @Prop({ default: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000) }) // 3 months
  expireCouponCode: Date;

  @Prop({ default: false })
  @IsBoolean()
  isPremiumAccount: boolean;

  @Prop({ default: true })
  @IsBoolean()
  isActive: boolean;

  @Prop({ type: Date, default: null })
  lastLogin: Date | null;

  @Prop({ type: String, maxlength: 1000, default: null })
  @IsString()
  bio?: string;

  @Prop({ type: String, default: null })
  @IsString()
  dateOfBirth?: string;

  @Prop({ type: String, maxlength: 500, default: null })
  @IsString()
  address?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  const user = this as any;

  if (!user.isModified('password') || !user.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  const user = this as any;
  if (!user.password) {
    return false;
  }
  return bcrypt.compare(candidate, user.password as string);
};
