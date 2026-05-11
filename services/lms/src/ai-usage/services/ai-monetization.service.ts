import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AIUsage, AIUsageDocument, AIFeature } from '../schema/ai-usage.schema';
import { Subscription, SubscriptionDocument, SubscriptionStatus, SubscriptionTier } from '../../payments/schemas/subscription.schema';
import { Payment, PaymentDocument, PaymentStatus } from '../../payments/schemas/payment.schema';

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  isPro: boolean;
  upgradeCTA?: UpgradeCTA;
  offer?: TimeOffer;
  trial?: TrialOffer;
}

export interface UpgradeCTA {
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  price: string;
  priceNote: string;
}

export interface TimeOffer {
  offerId: string;
  discountPercent: number;
  expiresAt: Date;
  originalPrice: number;
  discountedPrice: number;
}

export interface TrialOffer {
  available: boolean;
  durationDays: number;
  features: string[];
}

export interface MonetizationAnalytics {
  limitHitRate: number;
  upgradeConversionRate: number;
  trialConversionRate: number;
  revenuePerFeature: Record<string, number>;
  mostProfitableFeature: string;
  totalUpgradeRevenue: number;
  totalTrialsStarted: number;
  totalTrialsConverted: number;
}

/**
 * AI Monetization Engine
 * 
 * Smart revenue optimization system that:
 * - Detects AI usage limits
 * - Triggers monetization flows
 * - Manages offers and trials
 * - Tracks conversion analytics
 */
@Injectable()
export class AIMonetizationService {
  private readonly logger = new Logger(AIMonetizationService.name);

  // Track user upgrade attempts for offer personalization
  private upgradeAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  constructor(
    @InjectModel(AIUsage.name) private usageModel: Model<AIUsageDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) { }

  // ==================== USAGE CHECK & MONETIZATION ====================

  /**
   * Check AI usage with integrated monetization trigger
   * Returns upgrade CTA when limit is reached
   */
  async checkAndTrackUsage(
    userId: string,
    feature: AIFeature,
  ): Promise<UsageCheckResult> {
    const today = this.getTodayKey();

    // Check subscription status
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    const isPro = subscription?.status === SubscriptionStatus.ACTIVE &&
      subscription?.tier === SubscriptionTier.PRO;

    // Pro users bypass limits
    if (isPro) {
      return {
        allowed: true,
        used: 0,
        limit: -1, // Unlimited
        remaining: -1,
        resetAt: this.getTomorrow(),
        isPro: true,
      };
    }

    // Get or create usage record
    let usage = await this.usageModel.findOne({
      userId: new Types.ObjectId(userId),
      featureName: feature,
      dateKey: today,
    });

    if (!usage) {
      usage = await this.usageModel.create({
        userId: new Types.ObjectId(userId),
        featureName: feature,
        dateKey: today,
        usedCount: 0,
        planType: 'free',
        limitCount: this.getFreeLimit(feature),
      });
    }

    const remaining = Math.max(0, usage.limitCount - usage.usedCount);
    const resetAt = this.getTomorrow();

    // If limit reached, return upgrade CTA
    if (remaining === 0) {
      await this.trackLimitHit(userId, feature);

      return {
        allowed: false,
        used: usage.usedCount,
        limit: usage.limitCount,
        remaining: 0,
        resetAt,
        isPro: false,
        upgradeCTA: this.generateUpgradeCTA(feature),
        offer: this.generateTimeOffer(userId),
        trial: await this.getTrialOffer(userId),
      };
    }

    return {
      allowed: true,
      used: usage.usedCount,
      limit: usage.limitCount,
      remaining,
      resetAt,
      isPro: false,
    };
  }

  /**
   * Consume AI usage (call after successful check)
   */
  async consumeUsage(userId: string, feature: AIFeature): Promise<void> {
    const today = this.getTodayKey();

    await this.usageModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        featureName: feature,
        dateKey: today,
      },
      {
        $inc: { usedCount: 1, remainingCount: -1 },
        $set: { updatedAt: new Date() },
      },
    );
  }

  // ==================== OFFER GENERATION ====================

  /**
   * Generate personalized time-limited offer
   */
  private generateTimeOffer(userId: string): TimeOffer | undefined {
    const attempts = this.upgradeAttempts.get(userId);
    const attemptCount = attempts?.count || 0;

    // Dynamic discount based on engagement
    // More attempts = higher discount
    let discountPercent = 20;
    if (attemptCount >= 3) discountPercent = 30;
    if (attemptCount >= 5) discountPercent = 40;

    // 15-minute countdown offer
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const monthlyPrice = 999; // $9.99 in cents
    const discountedPrice = Math.round(monthlyPrice * (1 - discountPercent / 100));

    return {
      offerId: `offer_${userId}_${Date.now()}`,
      discountPercent,
      expiresAt,
      originalPrice: monthlyPrice,
      discountedPrice,
    };
  }

  /**
   * Get trial offer availability
   */
  private async getTrialOffer(userId: string): Promise<TrialOffer> {
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    // Trial only available if never had Pro
    const available = !subscription ||
      (subscription.tier === SubscriptionTier.FREE && !subscription.trialStart);

    return {
      available,
      durationDays: 7,
      features: [
        'Unlimited AI roadmaps',
        'Unlimited PDF summaries',
        'AI voice chat',
        'Priority support',
      ],
    };
  }

  /**
   * Generate upgrade CTA content
   */
  private generateUpgradeCTA(feature: AIFeature): UpgradeCTA {
    const featureNames: Record<AIFeature, string> = {
      ROADMAP_GENERATION: 'AI Roadmaps',
      PDF_SUMMARY: 'PDF Summaries',
      VOICE_CHAT: 'AI Voice Chat',
      ARTICLE_GENERATION: 'AI Articles',
      QUIZ_GENERATION: 'AI Quizzes',
      PROBLEM_SOLVING: 'Problem Solving',
    };

    return {
      title: `You've reached your daily ${featureNames[feature]} limit`,
      description: 'Upgrade to Pro and unlock unlimited AI features for your learning journey.',
      features: [
        `Unlimited ${featureNames[feature]}`,
        'Access to all AI features',
        'Priority processing',
        'Export to PDF/JSON',
        '7-day free trial',
      ],
      buttonText: 'Upgrade to Pro',
      price: '$9.99',
      priceNote: '/month after trial',
    };
  }

  // ==================== ANALYTICS ====================

  /**
   * Get comprehensive monetization analytics
   */
  async getAnalytics(days: number = 30): Promise<MonetizationAnalytics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      limitHits,
      upgrades,
      trials,
      revenueByFeature,
      mostProfitableFeature,
    ] = await Promise.all([
      this.getLimitHitCount(startDate),
      this.getUpgradeCount(startDate),
      this.getTrialStats(startDate),
      this.getRevenueByFeature(startDate),
      this.getMostProfitableFeature(startDate),
    ]);

    const totalLimitHits = limitHits.reduce((sum, h) => sum + h.count, 0);
    const totalUpgrades = upgrades.length;

    return {
      limitHitRate: totalLimitHits / (totalLimitHits + totalUpgrades) || 0,
      upgradeConversionRate: totalUpgrades / totalLimitHits || 0,
      trialConversionRate: trials.converted / (trials.started || 1),
      revenuePerFeature: revenueByFeature,
      mostProfitableFeature,
      totalUpgradeRevenue: upgrades.reduce((sum, u) => sum + u.amount, 0),
      totalTrialsStarted: trials.started,
      totalTrialsConverted: trials.converted,
    };
  }

  /**
   * Get limit hit analytics by feature
   */
  async getLimitHitAnalytics(days: number = 30): Promise<Array<{ feature: string; hits: number; conversions: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          dateKey: { $gte: this.formatDateKey(startDate) },
          usedCount: { $gte: 1 },
        },
      },
      {
        $group: {
          _id: '$featureName',
          hits: { $sum: 1 },
          users: { $addToSet: '$userId' },
        },
      },
      { $sort: { hits: -1 as const } },
    ];

    const results = await this.usageModel.aggregate(pipeline);

    // Get conversions for each feature
    const withConversions = await Promise.all(
      results.map(async (r) => {
        const conversions = await this.paymentModel.countDocuments({
          status: PaymentStatus.COMPLETED,
          type: 'subscription',
          createdAt: { $gte: startDate },
        });

        return {
          feature: r._id,
          hits: r.hits,
          conversions,
        };
      }),
    );

    return withConversions;
  }

  /**
   * Track conversion from limit hit to upgrade
   */
  async trackConversion(
    userId: string,
    feature: AIFeature,
    source: 'direct' | 'offer' | 'trial',
  ): Promise<void> {
    this.logger.log(`Conversion tracked: ${userId} upgraded via ${source} after ${feature}`);

    // Store conversion event for analytics
    await this.paymentModel.create({
      userId: new Types.ObjectId(userId),
      type: 'subscription_upgrade',
      status: PaymentStatus.COMPLETED,
      amount: 999, // $9.99
      currency: 'usd',
      metadata: {
        convertedFrom: feature,
        conversionSource: source,
        convertedAt: new Date(),
      },
    });
  }

  // ==================== PRIVATE HELPERS ====================

  private async trackLimitHit(userId: string, feature: AIFeature): Promise<void> {
    // Track upgrade attempt for offer personalization
    const existing = this.upgradeAttempts.get(userId);
    if (existing) {
      existing.count++;
      existing.lastAttempt = new Date();
    } else {
      this.upgradeAttempts.set(userId, { count: 1, lastAttempt: new Date() });
    }

    this.logger.log(`Limit hit tracked: ${userId} - ${feature}`);
  }

  private async getLimitHitCount(startDate: Date) {
    return this.usageModel.aggregate([
      {
        $match: {
          dateKey: { $gte: this.formatDateKey(startDate) },
          usedCount: { $gte: 1 },
        },
      },
      {
        $group: {
          _id: '$featureName',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  private async getUpgradeCount(startDate: Date) {
    return this.paymentModel.find({
      status: PaymentStatus.COMPLETED,
      type: 'subscription',
      createdAt: { $gte: startDate },
    }).lean();
  }

  private async getTrialStats(startDate: Date) {
    const started = await this.subscriptionModel.countDocuments({
      trialStart: { $gte: startDate },
    });

    const converted = await this.subscriptionModel.countDocuments({
      trialStart: { $gte: startDate },
      tier: SubscriptionTier.PRO,
      status: SubscriptionStatus.ACTIVE,
    });

    return { started, converted };
  }

  private async getRevenueByFeature(startDate: Date): Promise<Record<string, number>> {
    // Analyze which features drove the most revenue
    const pipeline = [
      {
        $match: {
          status: PaymentStatus.COMPLETED,
          type: 'subscription_upgrade',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$metadata.convertedFrom',
          revenue: { $sum: '$amount' },
        },
      },
    ];

    const results = await this.paymentModel.aggregate(pipeline);

    const revenueByFeature: Record<string, number> = {};
    results.forEach((r) => {
      revenueByFeature[r._id || 'unknown'] = r.revenue / 100; // Convert to dollars
    });

    return revenueByFeature;
  }

  private async getMostProfitableFeature(startDate: Date): Promise<string> {
    const revenue = await this.getRevenueByFeature(startDate);

    let maxRevenue = 0;
    let mostProfitable = 'ROADMAP_GENERATION';

    for (const [feature, amount] of Object.entries(revenue)) {
      if (amount > maxRevenue) {
        maxRevenue = amount;
        mostProfitable = feature;
      }
    }

    return mostProfitable;
  }

  private getFreeLimit(feature: AIFeature): number {
    const limits: Record<AIFeature, number> = {
      ROADMAP_GENERATION: 1,
      PDF_SUMMARY: 1,
      VOICE_CHAT: 1,
      ARTICLE_GENERATION: 1,
      QUIZ_GENERATION: 1,
      PROBLEM_SOLVING: 1,
    };
    return limits[feature] || 1;
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private formatDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private getTomorrow(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
}
