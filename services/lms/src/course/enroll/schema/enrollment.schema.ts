import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EnrollmentDocument = HydratedDocument<Enrollment>;

export type EnrollmentStatus = 'ACTIVE' | 'CANCELED' | 'REFUNDED';

@Schema({ timestamps: true })
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true, index: true })
  courseId: Types.ObjectId;

  @Prop({ type: String, enum: ['ACTIVE', 'CANCELED', 'REFUNDED'], default: 'ACTIVE' })
  status: EnrollmentStatus;

  @Prop({ type: Date })
  purchasedAt?: Date;

  @Prop({ type: Number })
  pricePaid?: number;

  @Prop({ type: String })
  currency?: string;

  @Prop({ type: String, default: null })  
  couponCode: string | null;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
