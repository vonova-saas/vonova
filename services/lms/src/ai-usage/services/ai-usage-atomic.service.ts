import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AIUsage } from '../schema/ai-usage.schema';
import { SubscriptionService } from '../../subscription/subscription.service';
import { AIFeature } from '../schema/ai-usage.schema';
import { AIUsageAnalyticsService } from './ai-usage-analytics.service';

export interface AtomicUsageResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  isFirstRequest: boolean;
  resetAt: Date;
}

export interface UsageResponse {
  used: number;
  limit: number | null;
  remaining: number | null;
  resetAt: Date;
  upgradeCTA: {
    show: boolean;
    title: string;
    description: string;
    features: string[];
    buttonText: string;
  };
  offerCountdown?: {
    offerId: string;
    discountPercent: number;
    expiresAt: Date;
  };
}

/**
 * AI Usage Atomic Service
 * 
 * Provides concurrency-safe usage tracking with MongoDB atomic operations.
 * Prevents race conditions and abuse from parallel requests.
 * 
 * Free Plan: 1/day per feature
 * Pro Plan: Unlimited (-1 limit)
 */
@Injectable()
export class AIUsageAtomicService {
  constructor(
    @InjectModel(AIUsage.name)
    private aiUsageModel: Model<AIUsage>,
    private readonly subscriptionService: SubscriptionService,
    private readonly analyticsService: AIUsageAnalyticsService,
  ) {}

  /**
   * ATOMIC: Check and consume usage in a single operation
   * 
   * Uses MongoDB findOneAndUpdate with $inc for concurrency safety.
   * Prevents race conditions from parallel requests.
   * 
   * @returns UsageResult with allowance status
   */
  async checkAndConsume(
    userId: string,
    role: string,
    feature: AIFeature,
  ): Promise<AtomicUsageResult> {
    // Pro users bypass usage checks
    const limits = await this.subscriptionService.getPlanLimits(userId, role);
    const planLimit = limits[feature as keyof typeof limits] || 0;

    // -1 means unlimited (Pro plan)
    if (planLimit === -1) {
      return {
        allowed: true,
        currentCount: 0,
        limit: -1,
        remaining: -1,
        isFirstRequest: false,
        resetAt: this.getTomorrow(),
      };
    }

    const today = this.getToday();
    const userObjectId = new Types.ObjectId(userId);

    // ATOMIC: Find and increment in one operation
    // This prevents race conditions from concurrent requests
    const result = await this.aiUsageModel.findOneAndUpdate(
      {
        userId: userObjectId,
        feature,
        date: today,
      },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          userId: userObjectId,
          feature,
          date: today,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    const currentCount = result.count;
    const isFirstRequest = currentCount === 1;
    const remaining = Math.max(0, planLimit - currentCount);
    const allowed = currentCount <= planLimit;

    // Track analytics
    if (!allowed) {
      await this.analyticsService.trackBlockedRequest(userId, feature);
    } else {
      await this.analyticsService.trackLimitHit(userId, feature, 'FREE');
    }

    return {
      allowed,
      currentCount,
      limit: planLimit,
      remaining,
      isFirstRequest,
      resetAt: this.getTomorrow(),
    };
  }

  /**
   * Get today's usage without consuming
   */
  async getTodayUsage(
    userId: string,
    role: string,
    feature: AIFeature,
  ): Promise<UsageResponse> {
    const limits = await this.subscriptionService.getPlanLimits(userId, role);
    const planLimit = limits[feature as keyof typeof limits] || 0;

    // Pro users
    if (planLimit === -1) {
      return {
        used: 0,
        limit: null,
        remaining: null,
        resetAt: this.getTomorrow(),
        upgradeCTA: {
          show: false,
          title: '',
          description: '',
          features: [],
          buttonText: '',
        },
      };
    }

    const today = this.getToday();
    const usage = await this.aiUsageModel.findOne({
      userId: new Types.ObjectId(userId),
      feature,
      date: today,
    });

    const used = usage?.count || 0;
    const remaining = Math.max(0, planLimit - used);
    const hasHitLimit = used >= planLimit;

    return {
      used,
      limit: planLimit,
      remaining,
      resetAt: this.getTomorrow(),
      upgradeCTA: hasHitLimit
        ? this.getUpgradeCTA(feature)
        : {
            show: false,
            title: '',
            description: '',
            features: [],
            buttonText: '',
          },
    };
  }

  /**
   * Get all features usage for today
   */
  async getAllTodayUsage(
    userId: string,
    role: string,
  ): Promise<Record<AIFeature, UsageResponse>> {
    const features: AIFeature[] = [
      'ROADMAP_GENERATION',
      'PDF_SUMMARY',
      'VOICE_CHAT',
      'ARTICLE_GENERATION',
      'QUIZ_GENERATION',
      'PROBLEM_SOLVING',
    ];

    const result: Partial<Record<AIFeature, UsageResponse>> = {};

    for (const feature of features) {
      result[feature] = await this.getTodayUsage(userId, role, feature);
    }

    return result as Record<AIFeature, UsageResponse>;
  }

  /**
   * Pre-flight check without consuming
   * Used for UI state before user initiates action
   */
  async preflightCheck(
    userId: string,
    role: string,
    feature: AIFeature,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const limits = await this.subscriptionService.getPlanLimits(userId, role);
    const planLimit = limits[feature as keyof typeof limits] || 0;

    if (planLimit === -1) {
      return {
        allowed: true,
        remaining: -1,
        resetAt: this.getTomorrow(),
      };
    }

    const today = this.getToday();
    const usage = await this.aiUsageModel.findOne({
      userId: new Types.ObjectId(userId),
      feature,
      date: today,
    });

    const used = usage?.count || 0;
    const remaining = Math.max(0, planLimit - used);

    return {
      allowed: used < planLimit,
      remaining,
      resetAt: this.getTomorrow(),
    };
  }

  /**
   * Reset daily usage (for admin/testing)
   */
  async resetDailyUsage(userId: string, feature?: AIFeature): Promise<void> {
    const today = this.getToday();

    if (feature) {
      await this.aiUsageModel.deleteOne({
        userId: new Types.ObjectId(userId),
        feature,
        date: today,
      });
    } else {
      await this.aiUsageModel.deleteMany({
        userId: new Types.ObjectId(userId),
        date: today,
      });
    }
  }

  /**
   * Get upgrade CTA content based on feature
   */
  private getUpgradeCTA(feature: AIFeature) {
    const ctaMap: Record<
      AIFeature,
      { title: string; description: string; features: string[]; buttonText: string }
    > = {
      ROADMAP_GENERATION: {
        title: 'Unlock Unlimited Learning Paths',
        description: 'You\'ve reached your daily roadmap limit. Upgrade to Pro for unlimited AI-generated learning roadmaps.',
        features: [
          'Unlimited roadmap generations',
          'Personalized learning paths',
          'Progress tracking',
          'Export to PDF/JSON',
        ],
        buttonText: 'Upgrade to Pro',
      },
      PDF_SUMMARY: {
        title: 'Get Unlimited PDF Insights',
        description: 'You\'ve reached your daily PDF summary limit. Upgrade to Pro to summarize unlimited documents.',
        features: [
          'Unlimited PDF summaries',
          'Chat with your documents',
          'Export summaries',
          'Multi-language support',
        ],
        buttonText: 'Upgrade to Pro',
      },
      VOICE_CHAT: {
        title: 'Voice Chat Without Limits',
        description: 'You\'ve reached your daily voice chat limit. Upgrade to Pro for unlimited AI voice conversations.',
        features: [
          'Unlimited voice chats',
          'Natural conversations',
          'Learning assistance',
          '24/7 availability',
        ],
        buttonText: 'Upgrade to Pro',
      },
      ARTICLE_GENERATION: {
        title: 'Create Unlimited Articles',
        description: 'You\'ve reached your daily article limit. Upgrade to Pro for unlimited AI-generated content.',
        features: [
          'Unlimited article generation',
          'SEO optimization',
          'Multiple formats',
          'Plagiarism-free content',
        ],
        buttonText: 'Upgrade to Pro',
      },
      QUIZ_GENERATION: {
        title: 'Generate Unlimited Quizzes',
        description: 'You\'ve reached your daily quiz limit. Upgrade to Pro for unlimited AI-generated quizzes.',
        features: [
          'Unlimited quiz generation',
          'Smart difficulty levels',
          'Auto-grading',
          'Detailed analytics',
        ],
        buttonText: 'Upgrade to Pro',
      },
      PROBLEM_SOLVING: {
        title: 'Solve Problems Without Limits',
        description: 'You\'ve reached your daily problem-solving limit. Upgrade to Pro for unlimited AI assistance.',
        features: [
          'Unlimited problem solving',
          'Step-by-step solutions',
          'Multiple approaches',
          'Code explanations',
        ],
        buttonText: 'Upgrade to Pro',
      },
    };

    const cta = ctaMap[feature];
    return {
      show: true,
      ...cta,
    };
  }

  private getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private getTomorrow(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
}
