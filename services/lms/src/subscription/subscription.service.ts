import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schema/subscription.schema';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';

export const PLAN_LIMITS = {
  FREE: {
    STUDENT: {
      ARTICLE_GENERATION: 1,
      PDF_SUMMARY: 1,
      ROADMAP_GENERATION: 1,
      VOICE_CHAT: 1,
    },
    INSTRUCTOR: {
      QUIZ_GENERATION: 1,
      ARTICLE_GENERATION: 1,
    },
  },
  PRO: {
    STUDENT: {
      ARTICLE_GENERATION: -1, // unlimited
      PDF_SUMMARY: -1,
      ROADMAP_GENERATION: -1,
      VOICE_CHAT: -1,
      PROBLEM_SOLVING: -1,
    },
    INSTRUCTOR: {
      QUIZ_GENERATION: -1,
      ARTICLE_GENERATION: -1,
      PROBLEM_GENERATION: -1,
    },
  },
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async createSubscription(dto: CreateSubscriptionDto): Promise<SubscriptionDocument> {
    const now = new Date();
    const periodEnd = new Date(now);
    
    if (dto.billingCycle === 'YEARLY') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const subscription = new this.subscriptionModel({
      userId: new Types.ObjectId(dto.userId),
      plan: dto.plan,
      billingCycle: dto.billingCycle,
      status: dto.plan === 'FREE' ? 'ACTIVE' : 'PENDING',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      paymentMethodId: dto.paymentMethodId,
    });

    return subscription.save();
  }

  async getUserSubscription(userId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: { $in: ['ACTIVE', 'PENDING'] },
    }).sort({ createdAt: -1 });
  }

  async getUserSubscriptions(userId: string): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel.find({
      userId: new Types.ObjectId(userId),
    }).sort({ createdAt: -1 });
  }

  async updateSubscription(
    subscriptionId: string,
    dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { $set: dto },
      { new: true },
    );
  }

  async cancelSubscription(subscriptionId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { $set: { cancelAtPeriodEnd: true } },
      { new: true },
    );
  }

  async activateSubscription(subscriptionId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { $set: { status: 'ACTIVE', cancelAtPeriodEnd: false } },
      { new: true },
    );
  }

  async checkUserPlan(userId: string): Promise<{ plan: string; status: string }> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      return { plan: 'FREE', status: 'ACTIVE' };
    }
    return { plan: subscription.plan, status: subscription.status };
  }

  async getPlanLimits(userId: string, role: string) {
    const { plan } = await this.checkUserPlan(userId);
    const roleKey = role.includes('INSTRUCTOR') ? 'INSTRUCTOR' : 'STUDENT';
    return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS][roleKey];
  }

  async expireSubscription(subscriptionId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { $set: { status: 'EXPIRED' } },
      { new: true },
    );
  }

  async renewSubscription(subscriptionId: string): Promise<SubscriptionDocument | null> {
    const subscription = await this.subscriptionModel.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const now = new Date();
    const newPeriodEnd = new Date(subscription.currentPeriodEnd);
    
    if (subscription.billingCycle === 'YEARLY') {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    } else {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    }

    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      {
        $set: {
          currentPeriodStart: now,
          currentPeriodEnd: newPeriodEnd,
          status: 'ACTIVE',
          cancelAtPeriodEnd: false,
        },
      },
      { new: true },
    );
  }
}
