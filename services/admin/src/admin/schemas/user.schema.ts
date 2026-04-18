import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['ADMIN', 'INSTRUCTOR_USER', 'STUDENT_USER'] })
  role: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true, default: false })
  isVerified: boolean;

  @Prop()
  avatar?: string;

  @Prop()
  bio?: string;

  @Prop()
  phone?: string;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: 0 })
  experience?: number;

  @Prop({ type: [String], default: [] })
  specialization?: string[];

  @Prop({ enum: ['beginner', 'intermediate', 'advanced'] })
  level?: string;

  @Prop()
  preferredLearningStyle?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
