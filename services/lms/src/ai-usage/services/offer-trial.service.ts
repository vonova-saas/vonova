import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AIUsageAnalytics } from '../schema/ai-usage-analytics.schema';

export interface LimitedTimeOffer {
  offerId: string;
  discountPercent: number;
  originalPrice: number;
  discountedPrice: number;
  expiresAt: Date;
  features: string[];
  badge: string;
}

export interface TrialInfo {
  isActive: boolean;
  startedAt: Date | null;
  endsAt: Date | null;
  daysRemaining: number;
  canStart: boolean;
  hasUsedBefore: boolean;
}

/**
 * Offer & Trial Management Service
 * 
 * Manages limited-time offers and 7-day Pro trials
 * for maximum conversion optimization.
 */
@Injectable()
export class OfferTrialService {
  // Active offers storage (in production, use Redis)
  private activeOffers: Map<string, LimitedTimeOffer> = new Map();

  constructor(
    @InjectModel(AIUsageAnalytics.name)
    private analyticsModel: Model<AIUsageAnalytics>,
  ) {}

  /**
   * Generate personalized limited-time offer when user hits limit
   */
  async generateOffer(
    userId: string,
    feature: string,
    basePrice: number = 9.99,
  ): Promise<LimitedTimeOffer | null> {
    // Check if user already has an active offer
    const existingOffer = this.activeOffers.get(userId);
    if (existingOffer && existingOffer.expiresAt > new Date()) {
      return existingOffer;
    }

    // Determine discount based on user behavior
    const discountPercent = await this.calculateDiscount(userId);
    
    const offerId = `offer_${userId}_${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15-minute offer

    const discountedPrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;

    const offer: LimitedTimeOffer = {
      offerId,
      discountPercent,
      originalPrice: basePrice,
      discountedPrice,
      expiresAt,
      features: this.getOfferFeatures(feature),
      badge: this.getOfferBadge(discountPercent),
    };

    // Store offer
    this.activeOffers.set(userId, offer);

    // Track offer shown in analytics
    await this.analyticsModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        feature,
        dateKey: this.getDateKey(),
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

    return offer;
  }

  /**
   * Validate and claim an offer
   */
  async claimOffer(userId: string, offerId: string): Promise<boolean> {
    const offer = this.activeOffers.get(userId);
    
    if (!offer || offer.offerId !== offerId) {
      return false;
    }

    if (offer.expiresAt < new Date()) {
      this.activeOffers.delete(userId);
      return false;
    }

    // Mark as claimed in analytics
    await this.analyticsModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        'offerShown.offerId': offerId,
      },
      {
        $set: {
          'offerShown.claimed': true,
          'offerShown.claimedAt': new Date(),
        },
      },
    );

    // Remove from active offers
    this.activeOffers.delete(userId);

    return true;
  }

  /**
   * Start 7-day Pro trial
   */
  async startTrial(userId: string, feature: string): Promise<TrialInfo> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    await this.analyticsModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        feature,
        dateKey: this.getDateKey(),
      },
      {
        $set: {
          trialStartedAt: new Date(),
          trialEndsAt,
          trialConverted: false,
        },
      },
      { upsert: true },
    );

    return {
      isActive: true,
      startedAt: new Date(),
      endsAt: trialEndsAt,
      daysRemaining: 7,
      canStart: false,
      hasUsedBefore: true,
    };
  }

  /**
   * Get trial status for user
   */
  async getTrialStatus(userId: string, feature: string): Promise<TrialInfo> {
    const record = await this.analyticsModel.findOne({
      userId: new Types.ObjectId(userId),
      feature,
      trialStartedAt: { $exists: true },
    }).sort({ trialStartedAt: -1 });

    if (!record || !record.trialStartedAt) {
      // Check if user has used trial before
      const hasUsedBefore = await this.analyticsModel.exists({
        userId: new Types.ObjectId(userId),
        trialStartedAt: { $exists: true },
      });

      return {
        isActive: false,
        startedAt: null,
        endsAt: null,
        daysRemaining: 0,
        canStart: !hasUsedBefore,
        hasUsedBefore: !!hasUsedBefore,
      };
    }

    const now = new Date();
    const isActive = record.trialEndsAt && record.trialEndsAt > now;
    const daysRemaining = isActive
      ? Math.ceil((record.trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      isActive,
      startedAt: record.trialStartedAt,
      endsAt: record.trialEndsAt,
      daysRemaining,
      canStart: false,
      hasUsedBefore: true,
    };
  }

  /**
   * Convert trial to paid
   */
  async convertTrial(userId: string, feature: string): Promise<void> {
    await this.analyticsModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        feature,
        trialConverted: false,
      },
      {
        $set: {
          trialConverted: true,
        },
      },
    );
  }

  /**
   * Calculate personalized discount
   */
  private async calculateDiscount(userId: string): Promise<number> {
    // Check user's upgrade click history
    const clicks = await this.analyticsModel.countDocuments({
      userId: new Types.ObjectId(userId),
      upgradeClickCount: { $gt: 0 },
    });

    // Higher discount for hesitant users
    if (clicks >= 3) return 40;
    if (clicks >= 2) return 30;
    if (clicks >= 1) return 20;
    return 15; // Base discount
  }

  private getOfferFeatures(feature: string): string[] {
    const baseFeatures = [
      'Unlimited AI generations',
      'Priority processing',
      'No daily limits',
    ];

    const featureSpecific: Record<string, string[]> = {
      ROADMAP_GENERATION: ['Personalized learning paths', 'Progress tracking', 'Export options'],
      PDF_SUMMARY: ['Chat with documents', 'Multi-file upload', 'Export summaries'],
      VOICE_CHAT: ['Natural voice conversations', '24/7 availability', 'Learning assistance'],
    };

    return [...baseFeatures, ...(featureSpecific[feature] || [])];
  }

  private getOfferBadge(discountPercent: number): string {
    if (discountPercent >= 40) return '🔥 BEST DEAL';
    if (discountPercent >= 30) return '⏰ LIMITED TIME';
    if (discountPercent >= 20) return '⭐ POPULAR';
    return '🎉 SPECIAL OFFER';
  }

  private getDateKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
