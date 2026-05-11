import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AIUsageService } from '../../ai-usage/ai-usage.service';
import { AIFeature } from '../../ai-usage/schema/ai-usage.schema';

/**
 * Feature mapping from old feature keys to new AIFeature enum
 */
const FEATURE_MAPPING: Record<string, AIFeature> = {
  'ai_roadmap': 'ROADMAP_GENERATION',
  'pdf_summary': 'PDF_SUMMARY',
  'pdf_voice': 'VOICE_CHAT',
  // Additional mappings for future features
  'article_generation': 'ARTICLE_GENERATION',
  'quiz_generation': 'QUIZ_GENERATION',
  'problem_solving': 'PROBLEM_SOLVING',
};

type OldFeatureKey = 'ai_roadmap' | 'pdf_summary' | 'pdf_voice';

type UsageUnit = 'count' | 'minutes';

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  unit: UsageUnit;
  feature: string;
  date: string;
}

/**
 * @deprecated Use AIUsageService directly for new code.
 * This service provides backward compatibility for existing controllers.
 * 
 * Refactored to use the centralized AIUsageService with subscription-based limits:
 * - Free Plan: 1/day for each feature
 * - Pro Plan: Unlimited (-1 limit)
 */
@Injectable()
export class DailyUsageLimitService {
  constructor(private readonly aiUsageService: AIUsageService) {}

  private isStudentRole(role?: string): boolean {
    const normalized = String(role ?? '')
      .trim()
      .toLowerCase();
    return normalized === 'student' || normalized === 'student_user';
  }

  private getUtcDateKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private mapFeature(oldFeature: OldFeatureKey | string): AIFeature {
    const mapped = FEATURE_MAPPING[oldFeature];
    if (!mapped) {
      throw new RpcException({
        statusCode: 400,
        message: `Unknown feature: ${oldFeature}`,
      });
    }
    return mapped;
  }

  private normalizeUsagePayload(params: {
    used: number;
    limit: number | null;
    unit: UsageUnit;
  }) {
    const remaining =
      params.limit === null || params.limit === -1
        ? null
        : Math.max(params.limit - params.used, 0);
    return {
      used: params.used,
      limit: params.limit === -1 ? null : params.limit,
      remaining,
      unit: params.unit,
    };
  }

  /**
   * Check and consume usage for a feature.
   * Throws RpcException if limit is exceeded.
   * 
   * Free Plan: 1/day for each feature
   * Pro Plan: Unlimited
   */
  async consumeOrThrow(params: {
    userId: string;
    role?: string;
    plan?: string;
    feature: OldFeatureKey | string;
    incrementBy?: number;
  }): Promise<void> {
    // Skip usage check for non-student roles or missing userId
    if (!params.userId) {
      return;
    }
    if (!this.isStudentRole(params.role)) {
      return;
    }

    const aiFeature = this.mapFeature(params.feature);
    const checkResult = await this.aiUsageService.checkUsageLimit(
      params.userId,
      params.role || 'student',
      aiFeature,
    );

    if (!checkResult.allowed) {
      const date = this.getUtcDateKey();
      throw new RpcException({
        statusCode: 429,
        code: 'DAILY_LIMIT_EXCEEDED',
        message: "You've reached today's limit. Try again tomorrow or upgrade to Pro for unlimited access.",
        details: {
          feature: params.feature,
          aiFeature,
          date,
          used: checkResult.currentCount,
          limit: checkResult.limit,
          remaining: 0,
          unit: 'count',
          upgradeCTA: true,
        },
      });
    }

    // Track usage
    await this.aiUsageService.trackUsage(params.userId, aiFeature);
  }

  /**
   * Get today's usage for all AI features.
   * Returns usage data compatible with the old format.
   */
  async getTodayUsage(params: {
    userId: string;
    role?: string;
    plan?: string;
  }) {
    if (!params.userId) {
      return {
        date: this.getUtcDateKey(),
        timezone: 'UTC',
        ai_roadmap: this.normalizeUsagePayload({ used: 0, limit: null, unit: 'count' }),
        pdf_summary: this.normalizeUsagePayload({ used: 0, limit: null, unit: 'count' }),
        pdf_voice: this.normalizeUsagePayload({ used: 0, limit: null, unit: 'count' }),
      };
    }

    const date = this.getUtcDateKey();
    const role = params.role || 'student';

    // Get all daily usage
    const allUsage = await this.aiUsageService.getAllDailyUsage(params.userId);

    // Map features and check limits
    const features: OldFeatureKey[] = ['ai_roadmap', 'pdf_summary', 'pdf_voice'];
    const entries = await Promise.all(
      features.map(async (oldFeature) => {
        const aiFeature = FEATURE_MAPPING[oldFeature];
        const checkResult = await this.aiUsageService.checkUsageLimit(
          params.userId,
          role,
          aiFeature,
        );

        return [
          oldFeature,
          this.normalizeUsagePayload({
            used: checkResult.currentCount,
            limit: checkResult.limit === -1 ? null : checkResult.limit,
            unit: 'count',
          }),
        ] as const;
      }),
    );

    return {
      date,
      timezone: 'UTC',
      ...Object.fromEntries(entries),
    };
  }

  /**
   * Get detailed usage check result for a specific feature.
   * Use this for pre-flight checks to show remaining usage in UI.
   */
  async checkUsage(params: {
    userId: string;
    role?: string;
    feature: OldFeatureKey | string;
  }): Promise<UsageCheckResult> {
    const aiFeature = this.mapFeature(params.feature);
    const checkResult = await this.aiUsageService.checkUsageLimit(
      params.userId,
      params.role || 'student',
      aiFeature,
    );

    return {
      allowed: checkResult.allowed,
      used: checkResult.currentCount,
      limit: checkResult.limit === -1 ? null : checkResult.limit,
      remaining: checkResult.remaining === -1 ? null : checkResult.remaining,
      unit: 'count',
      feature: params.feature,
      date: this.getUtcDateKey(),
    };
  }
}
