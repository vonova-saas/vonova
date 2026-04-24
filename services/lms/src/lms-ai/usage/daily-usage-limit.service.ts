import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { FeatureUsageRepository } from '../database/repositories/feature-usage.repository';

type FeatureKey = 'ai_roadmap' | 'pdf_summary' | 'pdf_voice';
type PlanKey = 'free' | 'pro' | 'startup';
type UsageUnit = 'count' | 'minutes';

const DAILY_LIMITS: Record<PlanKey, Record<FeatureKey, number | null>> = {
  free: {
    ai_roadmap: 1,
    pdf_summary: 1,
    pdf_voice: 1,
  },
  pro: {
    ai_roadmap: null,
    pdf_summary: null,
    pdf_voice: null,
  },
  startup: {
    ai_roadmap: null,
    pdf_summary: null,
    pdf_voice: null,
  },
};

@Injectable()
export class DailyUsageLimitService {
  constructor(private readonly usageRepository: FeatureUsageRepository) {}

  private isStudentRole(role?: string): boolean {
    const normalized = String(role ?? '')
      .trim()
      .toLowerCase();
    return normalized === 'student' || normalized === 'student_user';
  }

  private normalizePlan(plan?: string): PlanKey {
    const normalized = String(plan ?? '')
      .trim()
      .toLowerCase();
    if (normalized === 'pro' || normalized === 'startup') return normalized;
    if (normalized === 'basic' || normalized === 'free' || normalized === '')
      return 'free';
    return 'free';
  }

  private getUtcDateKey(): string {
    // UTC date key guarantees globally consistent daily reset.
    return new Date().toISOString().slice(0, 10);
  }

  private getLimit(plan: PlanKey, feature: FeatureKey): number | null {
    return DAILY_LIMITS[plan][feature];
  }

  private getFeatureUsageMode(feature: FeatureKey): UsageUnit {
    // Keep current behavior count-based; ready to switch e.g. pdf_voice -> 'minutes'.
    const modes: Record<FeatureKey, UsageUnit> = {
      ai_roadmap: 'count',
      pdf_summary: 'count',
      pdf_voice: 'count',
    };
    return modes[feature];
  }

  private normalizeUsagePayload(params: {
    used: number;
    limit: number | null;
    unit: UsageUnit;
  }) {
    const remaining =
      params.limit === null ? null : Math.max(params.limit - params.used, 0);
    return {
      used: params.used,
      limit: params.limit,
      remaining,
      unit: params.unit,
    };
  }

  async consumeOrThrow(params: {
    userId: string;
    role?: string;
    plan?: string;
    feature: FeatureKey;
    incrementBy?: number;
  }): Promise<void> {
    if (!params.userId) {
      return;
    }
    if (!this.isStudentRole(params.role)) {
      return;
    }

    const date = this.getUtcDateKey();
    const plan = this.normalizePlan(params.plan);
    const limitCount = this.getLimit(plan, params.feature);
    const usageUnit = this.getFeatureUsageMode(params.feature);
    const incrementBy = Math.max(1, params.incrementBy ?? 1);
    const limitDurationMinutes: number | null = null;

    const consumeResult = await this.usageRepository.consumeUsageAtomically({
      userId: params.userId,
      feature: params.feature,
      date,
      usageUnit,
      incrementBy,
      limitCount,
      limitDurationMinutes,
    });

    if (!consumeResult.allowed) {
      const usage = await this.usageRepository.findOne(
        params.userId,
        params.feature,
        date,
      );
      const used =
        usageUnit === 'minutes'
          ? (usage?.usedDurationMinutes ?? 0)
          : (usage?.usedCount ?? 0);
      const limit = usageUnit === 'minutes' ? limitDurationMinutes : limitCount;
      const remaining = limit === null ? null : Math.max(limit - used, 0);
      throw new RpcException({
        statusCode: 429,
        code: 'DAILY_LIMIT_EXCEEDED',
        message: "You've reached today's limit. Try again tomorrow or upgrade.",
        details: {
          feature: params.feature,
          date,
          used,
          limit,
          remaining,
          unit: usageUnit,
        },
      });
    }
  }

  async getTodayUsage(params: {
    userId: string;
    role?: string;
    plan?: string;
  }) {
    if (!params.userId) {
      return {
        ai_roadmap: this.normalizeUsagePayload({
          used: 0,
          limit: null,
          unit: 'count',
        }),
        pdf_summary: this.normalizeUsagePayload({
          used: 0,
          limit: null,
          unit: 'count',
        }),
        pdf_voice: this.normalizeUsagePayload({
          used: 0,
          limit: null,
          unit: 'count',
        }),
      };
    }
    const plan = this.normalizePlan(params.plan);
    const date = this.getUtcDateKey();

    const features: FeatureKey[] = ['ai_roadmap', 'pdf_summary', 'pdf_voice'];
    const entries = await Promise.all(
      features.map(async (feature) => {
        const usageUnit = this.getFeatureUsageMode(feature);
        const doc = await this.usageRepository.findOne(
          params.userId,
          feature,
          date,
        );
        const limit = this.isStudentRole(params.role)
          ? this.getLimit(plan, feature)
          : null;
        const used =
          usageUnit === 'minutes'
            ? (doc?.usedDurationMinutes ?? 0)
            : (doc?.usedCount ?? 0);
        return [
          feature,
          this.normalizeUsagePayload({ used, limit, unit: usageUnit }),
        ] as const;
      }),
    );

    return {
      date,
      timezone: 'UTC',
      ...Object.fromEntries(entries),
    };
  }
}
