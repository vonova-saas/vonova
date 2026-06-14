import { Schema } from 'mongoose';

export const SANCTION_TYPES = ['MUTE', 'SUSPEND', 'BAN'] as const;

export const PlatformUserSanctionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: SANCTION_TYPES,
      required: true,
      index: true,
    },
    until: { type: Date, default: null, index: true },
    reason: { type: String, default: '', maxlength: 2000 },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    active: { type: Boolean, default: true, index: true },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'ContentReport',
      default: null,
    },
  },
  { timestamps: true },
);

PlatformUserSanctionSchema.index({ userId: 1, type: 1, active: 1 });
