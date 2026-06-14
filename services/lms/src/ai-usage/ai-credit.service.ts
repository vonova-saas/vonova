import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { Model, Types } from 'mongoose';
import {
  AiUsageLedger,
  AiUsageLedgerDocument,
  AIFeature,
} from './schema/ai-usage-ledger.schema';
import {
  AiIdempotency,
  AiIdempotencyDocument,
  IdempotencyStatus,
} from './schema/ai-idempotency.schema';
import { SubscriptionService } from '../subscription/subscription.service';

// ─── Credit Costs per Feature (backend-authoritative, never from client) ────
export const AI_FEATURE_COST: Record<AIFeature, number> = {
  ARTICLE_GENERATION: 40,
  PDF_SUMMARY: 60,
  ROADMAP_GENERATION: 35,
  VOICE_CHAT: 40,
  QUIZ_GENERATION: 35,
  PROBLEM_SOLVING: 3,
};

export const TOTAL_MONTHLY_CREDITS: Record<'FREE' | 'PRO', number> = {
  FREE: 300,
  PRO: 5000,
};

// ─── Result Types ────────────────────────────────────────────────────────────

export interface CreditReservationResult {
  granted: boolean;
  creditsUsed: number;
  limit: number;
  remaining: number;
  monthKey: string;
  resetAt: Date;
}

export interface CanUseResult {
  allowed: boolean;
  creditsUsed: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  isPro: boolean;
}

export interface MonthlyCreditStats {
  feature: AIFeature;
  creditsUsed: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  isPro: boolean;
}

export type AiExecutionError =
  | 'INSUFFICIENT_CREDITS'
  | 'AI_PROVIDER_ERROR'
  | 'EXECUTION_FAILED'
  | 'DUPLICATE_REQUEST'
  | 'IDEMPOTENCY_CONFLICT';

/**
 * AiCreditService — Single authoritative enforcement layer for AI credits.
 *
 * Architecture:
 *  1. reserveCredits()  — atomic check + increment (prevents race conditions)
 *  2. executeWithCredits() — wraps reserve → AI call → release-on-failure
 *  3. releaseCredits()  — atomic decrement (rollback on AI failure)
 *  4. canUse()          — advisory check for UI (NOT enforcement gate)
 *
 * Race condition safety:
 *  Uses updateOne with $lte filter guard:
 *    { creditsUsed: { $lte: limit - cost } }
 *  This means the increment only applies when under-limit.
 *  Two parallel requests:
 *    → Only ONE gets modifiedCount=1 (the update that wins)
 *    → The other gets modifiedCount=0 → INSUFFICIENT_CREDITS
 *
 * Feature flag:
 *  ENABLE_AI_CREDITS_V2=true activates enforcement.
 *  When false: all requests are allowed (safe rollout).
 */
@Injectable()
export class AiCreditService implements OnModuleInit {
  private readonly logger = new Logger(AiCreditService.name);
  private enforcementEnabled: boolean;

  constructor(
    @InjectModel(AiUsageLedger.name)
    private readonly ledgerModel: Model<AiUsageLedgerDocument>,
    @InjectModel(AiIdempotency.name)
    private readonly idempotencyModel: Model<AiIdempotencyDocument>,
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
  ) { }

  onModuleInit() {
    this.enforcementEnabled =
      this.configService.get<string>('ENABLE_AI_CREDITS_V2') === 'true';

    if (this.enforcementEnabled) {
      this.logger.log(
        '✅ AI Credits V2 enforcement is ENABLED (ENABLE_AI_CREDITS_V2=true)',
      );
    } else {
      this.logger.warn(
        '⚠️  AI Credits V2 enforcement is DISABLED (ENABLE_AI_CREDITS_V2=false). ' +
        'All AI requests are allowed. Set ENABLE_AI_CREDITS_V2=true to enforce credits.',
      );
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Main entry point: wraps AI execution with atomic credit reservation.
   *
   * Flow:
   *   1. Check idempotency key → return cached response if duplicate
   *   2. Reserve credits atomically → throw INSUFFICIENT_CREDITS if denied
   *   3. Execute AI function
   *   4. On success: mark idempotency COMPLETED, log audit
   *   5. On failure: release credits (rollback), mark idempotency FAILED
   *
   * @param userId    - authenticated user ID (from JWT, never from client body)
   * @param feature   - AIFeature enum value (backend-defined cost)
   * @param idempotencyKey - UUID from gateway; prevents double-charging on retry
   * @param fn        - async AI execution function
   */
  async executeWithCredits<T>(
    userId: string,
    feature: AIFeature,
    idempotencyKey: string | undefined,
    fn: () => Promise<T>,
  ): Promise<T> {
    // ── Feature flag bypass (safe rollout) ────────────────────────────────
    if (!this.enforcementEnabled) {
      this.logger.debug(
        `[BYPASS] Credits V2 disabled — allowing ${feature} for user ${userId}`,
      );
      return fn();
    }

    // ── Idempotency check ─────────────────────────────────────────────────
    if (idempotencyKey) {
      const cached = await this.checkIdempotency(userId, feature, idempotencyKey);
      if (cached !== null) {
        this.logger.log(
          `[IDEMPOTENCY] Returning cached response for key=${idempotencyKey}`,
        );
        return cached as T;
      }
    }

    // ── Atomic credit reservation ─────────────────────────────────────────
    const reservation = await this.reserveCredits(userId, feature);
    if (!reservation.granted) {
      this.logger.warn(
        `[DENIED] INSUFFICIENT_CREDITS: userId=${userId}, feature=${feature}, ` +
        `used=${reservation.creditsUsed}/${reservation.limit}`,
      );
      throw new RpcException({
        statusCode: 429,
        code: 'INSUFFICIENT_CREDITS' satisfies AiExecutionError,
        message: `Monthly AI limit reached for ${feature}. Used ${reservation.creditsUsed} of ${reservation.limit}.`,
        data: {
          feature,
          creditsUsed: reservation.creditsUsed,
          limit: reservation.limit,
          remaining: reservation.remaining,
          resetAt: reservation.resetAt,
          upgradeRequired: true,
        },
      });
    }

    this.logger.log(
      `[RESERVED] userId=${userId}, feature=${feature}, ` +
      `used=${reservation.creditsUsed}/${reservation.limit}`,
    );

    // ── Execute AI function with rollback on failure ───────────────────────
    try {
      const result = await fn();

      // Commit: mark idempotency as COMPLETED
      if (idempotencyKey) {
        await this.commitIdempotency(
          idempotencyKey,
          result as Record<string, unknown>,
        );
      }

      this.logger.log(
        `[COMMITTED] userId=${userId}, feature=${feature}, idempotencyKey=${idempotencyKey}`,
      );

      return result;
    } catch (err: unknown) {
      // Classify the error
      const errorCode = this.classifyError(err);

      // Release credits on AI failure (rollback)
      await this.releaseCredits(userId, feature);

      // Mark idempotency as FAILED
      if (idempotencyKey) {
        await this.failIdempotency(idempotencyKey, errorCode);
      }

      this.logger.error(
        `[RELEASED] Credits rolled back for userId=${userId}, feature=${feature}, ` +
        `errorCode=${errorCode}: ${(err as Error)?.message}`,
      );

      // Re-throw the original error (don't wrap AI provider errors)
      throw err;
    }
  }

  /**
   * Advisory check for UI: "Can this user use this feature?"
   * NOT an enforcement gate — for display purposes only.
   * Enforcement happens inside executeWithCredits.
   */
  async canUse(userId: string, feature: AIFeature): Promise<CanUseResult> {
    const monthKey = this.getMonthKey();
    const resetAt = this.getMonthReset();
    const plan = await this.getUserPlan(userId);
    const limit = TOTAL_MONTHLY_CREDITS[plan];
    const cost = AI_FEATURE_COST[feature];
    const isPro = plan === 'PRO';

    const ledger = await this.ledgerModel
      .findOne({
        userId: new Types.ObjectId(userId),
        monthKey,
      })
      .lean();

    const creditsUsed = ledger?.creditsUsed ?? 0;
    const remaining = Math.max(0, limit - creditsUsed);

    return {
      allowed: creditsUsed + cost <= limit,
      creditsUsed,
      limit,
      remaining,
      resetAt,
      isPro,
    };
  }

  /**
   * Get monthly credit stats for all features (for UI display).
   */
  async getMonthlyStats(userId: string): Promise<MonthlyCreditStats[]> {
    const monthKey = this.getMonthKey();
    const resetAt = this.getMonthReset();
    const plan = await this.getUserPlan(userId);
    const limit = TOTAL_MONTHLY_CREDITS[plan];
    const isPro = plan === 'PRO';

    const features: AIFeature[] = [
      'ROADMAP_GENERATION',
      'PDF_SUMMARY',
      'VOICE_CHAT',
      'ARTICLE_GENERATION',
      'QUIZ_GENERATION',
      'PROBLEM_SOLVING',
    ];

    // Fetch ledger entry for this user/month
    const ledger = await this.ledgerModel
      .findOne({
        userId: new Types.ObjectId(userId),
        monthKey,
      })
      .lean();

    const totalCreditsUsed = ledger?.creditsUsed ?? 0;
    const remaining = Math.max(0, limit - totalCreditsUsed);

    return features.map((feature) => {
      const featureUsageObj = ledger?.featureUsage || {};
      const featureCreditsUsed = featureUsageObj instanceof Map
        ? (featureUsageObj.get(feature) ?? 0)
        : (featureUsageObj[feature] ?? 0);

      return {
        feature,
        creditsUsed: featureCreditsUsed,
        limit,
        remaining,
        resetAt,
        isPro,
      };
    });
  }

  // ─── Internal: Atomic Reservation ─────────────────────────────────────────

  /**
   * ATOMIC credit reservation using MongoDB's conditional update.
   *
   * The $lte guard in the filter ensures the increment only fires
   * when creditsUsed + cost is still under the limit — preventing race conditions.
   */
  private async reserveCredits(
    userId: string,
    feature: AIFeature,
  ): Promise<CreditReservationResult> {
    const monthKey = this.getMonthKey();
    const resetAt = this.getMonthReset();
    const plan = await this.getUserPlan(userId);
    const limit = TOTAL_MONTHLY_CREDITS[plan];
    const cost = AI_FEATURE_COST[feature];
    const userObjectId = new Types.ObjectId(userId);

    // Let's first check if the document exists.
    const ledger = await this.ledgerModel
      .findOne({ userId: userObjectId, monthKey })
      .lean();

    if (!ledger) {
      // Create it
      try {
        await this.ledgerModel.create({
          userId: userObjectId,
          monthKey,
          creditsUsed: cost,
          featureUsage: { [feature]: cost },
          planSnapshot: plan,
        });

        return {
          granted: true,
          creditsUsed: cost,
          limit,
          remaining: Math.max(0, limit - cost),
          monthKey,
          resetAt,
        };
      } catch (err: unknown) {
        const isE11000 =
          err &&
          typeof err === 'object' &&
          (err as { code?: number }).code === 11000;

        if (!isE11000) {
          throw err;
        }
        // If E11000, it means a parallel request created it first.
        // Fall through to update block.
      }
    }

    // Document exists (or was just created by a parallel request).
    // Perform atomic conditional update: we ONLY increment if current creditsUsed <= limit - cost.
    const updateResult = await this.ledgerModel.updateOne(
      {
        userId: userObjectId,
        monthKey,
        creditsUsed: { $lte: limit - cost },
      },
      {
        $inc: {
          creditsUsed: cost,
          [`featureUsage.${feature}`]: cost,
        },
        $set: { planSnapshot: plan },
      },
    );

    if (updateResult.modifiedCount > 0) {
      // Reservation granted! Fetch updated values.
      const updatedLedger = await this.ledgerModel
        .findOne({ userId: userObjectId, monthKey })
        .lean();
      const currentCreditsUsed = updatedLedger?.creditsUsed ?? cost;

      return {
        granted: true,
        creditsUsed: currentCreditsUsed,
        limit,
        remaining: Math.max(0, limit - currentCreditsUsed),
        monthKey,
        resetAt,
      };
    }

    // Reservation denied due to insufficient credits! Fetch current values to return.
    const currentLedger = await this.ledgerModel
      .findOne({ userId: userObjectId, monthKey })
      .lean();
    const currentCreditsUsed = currentLedger?.creditsUsed ?? 0;

    return {
      granted: false,
      creditsUsed: currentCreditsUsed,
      limit,
      remaining: Math.max(0, limit - currentCreditsUsed),
      monthKey,
      resetAt,
    };
  }

  /**
   * Release (roll back) credits after AI execution failure.
   */
  private async releaseCredits(
    userId: string,
    feature: AIFeature,
  ): Promise<void> {
    const monthKey = this.getMonthKey();
    const cost = AI_FEATURE_COST[feature];

    try {
      await this.ledgerModel.updateOne(
        {
          userId: new Types.ObjectId(userId),
          monthKey,
          creditsUsed: { $gte: cost }, // Prevent negative counts
        },
        {
          $inc: {
            creditsUsed: -cost,
            [`featureUsage.${feature}`]: -cost,
          },
        },
      );

      this.logger.debug(
        `[RELEASE] Credit released for userId=${userId}, feature=${feature}`,
      );
    } catch (err) {
      // Log but don't rethrow — we don't want a release failure to mask the original error
      this.logger.error(
        `[RELEASE FAILED] Could not release credit for userId=${userId}, feature=${feature}: ${(err as Error)?.message}`,
      );
    }
  }


  // ─── Internal: Idempotency ─────────────────────────────────────────────────

  /**
   * Check if this idempotency key has been seen before.
   * Returns cached response if COMPLETED, null if new or FAILED.
   * Throws IDEMPOTENCY_CONFLICT if PENDING (in-flight duplicate).
   */
  private async checkIdempotency(
    userId: string,
    feature: AIFeature,
    idempotencyKey: string,
  ): Promise<Record<string, unknown> | null> {
    const existing = await this.idempotencyModel
      .findOne({ idempotencyKey })
      .lean();

    if (!existing) {
      // New key — register it as PENDING to claim it
      try {
        await this.idempotencyModel.create({
          idempotencyKey,
          userId: new Types.ObjectId(userId),
          feature,
          status: 'PENDING' satisfies IdempotencyStatus,
        });
      } catch (err: unknown) {
        const isE11000 =
          err &&
          typeof err === 'object' &&
          (err as { code?: number }).code === 11000;

        if (isE11000) {
          // Race: another request registered this key simultaneously
          throw new RpcException({
            statusCode: 409,
            code: 'IDEMPOTENCY_CONFLICT' satisfies AiExecutionError,
            message:
              'Duplicate request detected. Please wait for the original request to complete.',
          });
        }
        throw err;
      }
      return null;
    }

    if (existing.status === 'COMPLETED' && existing.cachedResponse) {
      return existing.cachedResponse;
    }

    if (existing.status === 'PENDING') {
      throw new RpcException({
        statusCode: 409,
        code: 'IDEMPOTENCY_CONFLICT' satisfies AiExecutionError,
        message:
          'A request with this idempotency key is already in progress. Please wait and retry.',
      });
    }

    // FAILED status — allow retry with same key (AI errors are retriable)
    // Re-set to PENDING for the retry
    await this.idempotencyModel.updateOne(
      { idempotencyKey },
      { $set: { status: 'PENDING', cachedResponse: undefined, errorCode: undefined } },
    );

    return null;
  }

  private async commitIdempotency(
    idempotencyKey: string,
    response: Record<string, unknown>,
  ): Promise<void> {
    try {
      // Store a lightweight summary (avoid storing huge AI responses in DB)
      const summary = this.summarizeResponse(response);
      await this.idempotencyModel.updateOne(
        { idempotencyKey },
        { $set: { status: 'COMPLETED' satisfies IdempotencyStatus, cachedResponse: summary } },
      );
    } catch (err) {
      this.logger.warn(
        `[IDEMPOTENCY] Failed to commit key=${idempotencyKey}: ${(err as Error)?.message}`,
      );
      // Non-fatal — don't throw
    }
  }

  private async failIdempotency(
    idempotencyKey: string,
    errorCode: string,
  ): Promise<void> {
    try {
      await this.idempotencyModel.updateOne(
        { idempotencyKey },
        { $set: { status: 'FAILED' satisfies IdempotencyStatus, errorCode } },
      );
    } catch (err) {
      this.logger.warn(
        `[IDEMPOTENCY] Failed to mark FAILED for key=${idempotencyKey}: ${(err as Error)?.message}`,
      );
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async getUserPlan(userId: string): Promise<'FREE' | 'PRO'> {
    try {
      const { plan } = await this.subscriptionService.checkUserPlan(userId);
      return plan === 'PRO' ? 'PRO' : 'FREE';
    } catch {
      // Default to FREE if subscription check fails (fail safe)
      return 'FREE';
    }
  }

  /**
   * UTC month key: YYYY-MM
   * Consistent across all server instances regardless of timezone.
   */
  private getMonthKey(): string {
    return new Date().toISOString().slice(0, 7);
  }

  /**
   * First moment of the next UTC month (credit reset time).
   */
  private getMonthReset(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  }

  private classifyError(err: unknown): AiExecutionError {
    if (!err || typeof err !== 'object') return 'EXECUTION_FAILED';
    const msg = String((err as { message?: string }).message ?? '').toLowerCase();
    if (
      msg.includes('openai') ||
      msg.includes('gemini') ||
      msg.includes('timeout') ||
      msg.includes('rate limit') ||
      msg.includes('provider')
    ) {
      return 'AI_PROVIDER_ERROR';
    }
    return 'EXECUTION_FAILED';
  }

  /**
   * Store a lightweight summary of the response for idempotency cache.
   * Avoids storing massive AI-generated documents in MongoDB.
   */
  private summarizeResponse(
    response: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!response || typeof response !== 'object') return {};
    const keys = Object.keys(response).slice(0, 5); // max 5 top-level keys
    const summary: Record<string, unknown> = {};
    for (const key of keys) {
      const val = response[key];
      // Store primitives and IDs, truncate strings
      if (val === null || val === undefined) {
        summary[key] = val;
      } else if (typeof val === 'string') {
        summary[key] = val.slice(0, 200);
      } else if (
        typeof val === 'number' ||
        typeof val === 'boolean'
      ) {
        summary[key] = val;
      } else {
        summary[key] = '[truncated]';
      }
    }
    return summary;
  }
}
