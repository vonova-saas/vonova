import { Schema } from 'mongoose';

export const AiPlan = ['FREE', 'PRO'] as const;

export const AiUserSubscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    plan: { type: String, enum: AiPlan, default: 'FREE', index: true },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);
