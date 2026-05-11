import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EnrollmentDocument = HydratedDocument<Enrollment>;

export type EnrollmentStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELED'
  | 'REFUNDED';

@Schema({ timestamps: true })
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true, index: true })
  courseId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'CANCELED', 'REFUNDED'],
    default: 'ACTIVE',
  })
  status: EnrollmentStatus;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progressPercentage?: number;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Date })
  purchasedAt?: Date;

  @Prop({ type: Number })
  pricePaid?: number;

  @Prop({ type: String })
  currency?: string;

  @Prop({ type: String, default: null })
  couponCode: string | null;

  /** Last lesson the student interacted with (resume / Continue learning). */
  @Prop({ type: Types.ObjectId, ref: 'Lesson', default: null })
  lastLessonId?: Types.ObjectId | null;

  @Prop({ type: Date })
  lastAccessedAt?: Date;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
