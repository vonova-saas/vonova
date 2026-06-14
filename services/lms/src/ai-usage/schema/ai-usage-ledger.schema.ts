import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AIFeature =
  | 'ARTICLE_GENERATION'
  | 'PDF_SUMMARY'
  | 'ROADMAP_GENERATION'
  | 'VOICE_CHAT'
  | 'QUIZ_GENERATION'
  | 'PROBLEM_SOLVING';

export interface AiUsageLedgerDocument extends Document {
  userId: Types.ObjectId;
  /** UTC month key: YYYY-MM (e.g. "2026-06") */
  monthKey: string;
  /** Atomic counter — number of credits consumed this month */
  creditsUsed: number;
  /** Breakdown of credits consumed per feature */
  featureUsage: Map<string, number>;
  /** Plan snapshot at time of last update, for audit purposes */
  planSnapshot: 'FREE' | 'PRO';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AiUsageLedger — Single source of truth for AI credit consumption.
 *
 * Design principles:
 * - append-only semantics via atomic $inc on creditsUsed
 * - monthly reset via monthKey (YYYY-MM)
 * - unique compound index on userId and monthKey prevents duplicate documents
 *
 * DO NOT read creditsUsed outside AiCreditService — always go through the service.
 */
@Schema({ collection: 'ai_usage_ledger', timestamps: true })
export class AiUsageLedger {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  /**
   * UTC month key in YYYY-MM format.
   * Credits reset automatically each calendar month — no cron needed,
   * just query with a new monthKey.
   */
  @Prop({ type: String, required: true, index: true })
  monthKey: string;

  /**
   * Atomic counter for total credits consumed in this month.
   * Modified ONLY via $inc in findOneAndUpdate — never via save().
   */
  @Prop({ type: Number, default: 0, min: 0 })
  creditsUsed: number;

  /**
   * Breakdown of credits consumed per feature.
   */
  @Prop({ type: Map, of: Number, default: {} })
  featureUsage: Map<string, number>;

  /** Plan tier snapshot for audit/analytics — not used for enforcement */
  @Prop({ type: String, enum: ['FREE', 'PRO'], default: 'FREE' })
  planSnapshot: 'FREE' | 'PRO';
}

export const AiUsageLedgerSchema = SchemaFactory.createForClass(AiUsageLedger);

/**
 * Unique compound index ensures one document per user per month.
 * This is critical for atomic pool-based credit checking.
 */
AiUsageLedgerSchema.index(
  { userId: 1, monthKey: 1 },
  { unique: true },
);
