/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { HydratedDocument } from 'mongoose';

export type AdminDocument = HydratedDocument<Admin>;

@Schema({ timestamps: true, strict: true })
export class Admin {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  @IsNotEmpty()
  @IsString()
  email: string;

  @Prop({ required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Prop({ required: true, select: false })
  @IsNotEmpty()
  @IsString()
  password: string;

  @Prop({ default: true })
  @IsBoolean()
  isTempPassword: boolean;

  @Prop({ type: String, default: 'admin', immutable: true })
  @IsString()
  role: string;

  @Prop({ type: String, default: null })
  profilePictureUrl?: string | null;

  @Prop({ type: String, default: '' })
  bio?: string;

  @Prop({ type: String, default: '' })
  address?: string;

  @Prop({ type: String, default: null })
  dateOfBirth?: string | null;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

// Hash password before saving
AdminSchema.pre('save', async function (next) {
  const admin = this as any;

  if (!admin.isModified('password') || !admin.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
AdminSchema.methods.comparePassword = async function (candidate: string) {
  const admin = this as any;
  if (!admin.password) {
    return false;
  }
  return bcrypt.compare(candidate, admin.password as string);
};
