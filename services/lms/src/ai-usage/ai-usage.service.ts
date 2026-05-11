import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AIUsage, AIUsageDocument, AIFeature } from './schema/ai-usage.schema';
import { SubscriptionService } from '../subscription/subscription.service';

export interface UsageCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
}

@Injectable()
export class AIUsageService {
  constructor(
    @InjectModel(AIUsage.name) private aiUsageModel: Model<AIUsageDocument>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async trackUsage(userId: string, feature: AIFeature): Promise<AIUsageDocument> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.aiUsageModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        feature,
        date: today,
      },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          feature,
          date: today,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    return usage;
  }

  async getDailyUsage(userId: string, feature: AIFeature): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.aiUsageModel.findOne({
      userId: new Types.ObjectId(userId),
      feature,
      date: today,
    });

    return usage?.count || 0;
  }

  async getAllDailyUsage(userId: string): Promise<Record<AIFeature, number>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usages = await this.aiUsageModel.find({
      userId: new Types.ObjectId(userId),
      date: today,
    });

    const result: Partial<Record<AIFeature, number>> = {};
    usages.forEach((usage) => {
      result[usage.feature] = usage.count;
    });

    return result as Record<AIFeature, number>;
  }

  async checkUsageLimit(
    userId: string,
    role: string,
    feature: AIFeature,
  ): Promise<UsageCheckResult> {
    const limits = await this.subscriptionService.getPlanLimits(userId, role);
    const limit = limits[feature as keyof typeof limits] || 0;

    // -1 means unlimited
    if (limit === -1) {
      return {
        allowed: true,
        currentCount: 0,
        limit: -1,
        remaining: -1,
      };
    }

    const currentCount = await this.getDailyUsage(userId, feature);
    const remaining = Math.max(0, limit - currentCount);

    return {
      allowed: currentCount < limit,
      currentCount,
      limit,
      remaining,
    };
  }

  async getUsageHistory(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AIUsageDocument[]> {
    return this.aiUsageModel.find({
      userId: new Types.ObjectId(userId),
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 });
  }

  async resetDailyUsage(): Promise<void> {
    // This would be called by a cron job at midnight
    // For now, we just rely on the date field for new day tracking
  }
}
