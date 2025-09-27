import mongoose, { Document, Schema, Types } from "mongoose";

export type EnrollmentStatus = "ACTIVE" | "CANCELED" | "REFUNDED";

export interface EnrollmentDocument extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: EnrollmentStatus;
  purchasedAt?: Date;
  pricePaid?: number;
  currency?: string;
  couponCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<EnrollmentDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  status: { type: String, enum: ["ACTIVE","CANCELED","REFUNDED"], default: "ACTIVE" },
  purchasedAt: { type: Date },
  pricePaid: { type: Number },
  currency: { type: String },
  couponCode: { type: String, default: null },
}, { timestamps: true });

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const EnrollmentModel = mongoose.model<EnrollmentDocument>("Enrollment", enrollmentSchema);
export default EnrollmentModel;
