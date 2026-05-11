import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AIUsageAnalytics, LimitHitEventDocument } from '../schema/ai-usage-analytics.schema';

export interface MonetizationMetrics {
  limitHitRate: number;
  upgradeConversionRate: number;
  trialConversionRate: number;
  revenuePerUser: number;
  topConversionFeature: string;
}

export interface DailyRevenue {
  date: string;
  totalRevenue: number;
  newSubscriptions: number;
  renewals: number;
  trialConversions: number;
  offerConversions: number;
}

export interface FeatureUsageStats {
  feature: string;
  totalRequests: number;
  limitHits: number;
  conversionRate: number;
  avgRevenue: number;
}

/**
 * AI Usage Analytics Service
 * Tracks monetization events and provides conversion insights
 */
@Injectable()
export class AIUsageAnalyticsService {
  constructor(
    @InjectModel(AIUsageAnalytics.name)
    private analyticsModel: Model<LimitHitEventDocument>,
  ) { }

  /**
   * Track when user hits daily limit
   */
  async trackLimitHit(userId: string, feature: string, planType: string): Promise<void> {
    const dateKey = this.getDateKey();

    await this.analyticsModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        feature,
        dateKey,
      },
      {
        $inc: { limitHitCount: 1, totalRequests: 1 },
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          feature,
          planType,
          dateKey,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  /**
   * Track upgrade click from limit modal
   */
  async trackUpgradeClick(userId: string, feature: string, source: string): Promise<void> {
    const dateKey = this.getDateKey();

    await this.analyticsModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        feature,
        dateKey,
      },
      {
        $inc: { upgradeClickCount: 1 },
        $set: { upgradeSource: source },
      },
      { upsert: true },
    );
  }

  /**
   * Track successful upgrade after hitting limit
   */
  async trackUpgradeConversion(
    userId: string,
    feature: string,
    revenue: number,
    isTrialConversion: boolean = false,
  ): Promise<void> {
    const dateKey = this.getDateKey();

    await this.analyticsModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        feature,
        dateKey,
      },
      {
        $set: {
          upgradedAfterHit: true,
          upgradedAt: new Date(),
          ...(isTrialConversion && { trialConverted: true }),
        },
      },
    );
  }

  /**
   * Track blocked request (abuse prevention)
   */
  async trackBlockedRequest(userId: string, feature: string): Promise<void> {
    const dateKey = this.getDateKey();

    await this.analyticsModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        feature,
        dateKey,
      },
      {
        $inc: { blockedRequests: 1, totalRequests: 1 },
      },
      { upsert: true },
    );
  }

  /**
   * Track offer shown to user
   */
  async trackOfferShown(
    userId: string,
    feature: string,
    offerId: string,
    discountPercent: number,
  ): Promise<void> {
    const dateKey = this.getDateKey();

    await this.analyticsModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        feature,
        dateKey,
      },
      {
        $set: {
          offerShown: {
            offerId,
            discountPercent,
            shownAt: new Date(),
            claimed: false,
          },
        },
      },
      { upsert: true },
    );
  }

  /**
   * Track trial start
   */
  async trackTrialStart(userId: string, feature: string): Promise<void> {
    const dateKey = this.getDateKey();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    await this.analyticsModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        feature,
        dateKey,
      },
      {
        $set: {
          trialStartedAt: new Date(),
          trialEndsAt,
        },
      },
      { upsert: true },
    );
  }

  /**
   * Get monetization metrics for date range
   */
  async getMonetizationMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<MonetizationMetrics> {
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalLimitHits: { $sum: '$limitHitCount' },
          totalConversions: { $sum: { $cond: ['$upgradedAfterHit', 1, 0] } },
          totalTrials: { $sum: { $cond: ['$trialStartedAt', 1, 0] } },
          trialConversions: { $sum: { $cond: ['$trialConverted', 1, 0] } },
        },
      },
    ];

    const result = await this.analyticsModel.aggregate(pipeline);
    const data = result[0] || {
      totalLimitHits: 0,
      totalConversions: 0,
      totalTrials: 0,
      trialConversions: 0,
    };

    return {
      limitHitRate: data.totalLimitHits,
      upgradeConversionRate: data.totalLimitHits > 0
        ? (data.totalConversions / data.totalLimitHits) * 100
        : 0,
      trialConversionRate: data.totalTrials > 0
        ? (data.trialConversions / data.totalTrials) * 100
        : 0,
      revenuePerUser: 0, // Requires payment data integration
      topConversionFeature: await this.getTopConversionFeature(startDate, endDate),
    };
  }

  /**
   * Get daily revenue aggregation
   */
  async getDailyRevenue(days: number = 30): Promise<DailyRevenue[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate },
          upgradedAfterHit: true,
        },
      },
      {
        $group: {
          _id: '$dateKey',
          newSubscriptions: { $sum: 1 },
          trialConversions: { $sum: { $cond: ['$trialConverted', 1, 0] } },
        },
      },
      {
        $sort: { _id: 1 as const },
      },
    ];

    const results = await this.analyticsModel.aggregate(pipeline as any);

    return results.map((r: { _id: string; newSubscriptions: number; trialConversions: number }) => ({
      date: r._id,
      totalRevenue: 0, // Integrate with payment service
      newSubscriptions: r.newSubscriptions,
      renewals: 0,
      trialConversions: r.trialConversions,
      offerConversions: 0,
    }));
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureStats(days: number = 30): Promise<FeatureUsageStats[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$feature',
          totalRequests: { $sum: '$totalRequests' },
          limitHits: { $sum: '$limitHitCount' },
          conversions: { $sum: { $cond: ['$upgradedAfterHit', 1, 0] } },
        },
      },
    ];

    const results = await this.analyticsModel.aggregate(pipeline);

    return results.map((r: { _id: string; totalRequests: number; limitHits: number; conversions: number }) => ({
      feature: r._id,
      totalRequests: r.totalRequests,
      limitHits: r.limitHits,
      conversionRate: r.limitHits > 0 ? (r.conversions / r.limitHits) * 100 : 0,
      avgRevenue: 0,
    }));
  }

  /**
   * Get top converting feature
   */
  private async getTopConversionFeature(startDate: Date, endDate: Date): Promise<string> {
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          upgradedAfterHit: true,
        },
      },
      {
        $group: {
          _id: '$feature',
          conversions: { $sum: 1 },
        },
      },
      {
        $sort: { conversions: -1 as const },
      },
      {
        $limit: 1,
      },
    ];

    const result = await this.analyticsModel.aggregate(pipeline as any);
    return result[0]?._id || 'ROADMAP_GENERATION';
  }

  private getDateKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
