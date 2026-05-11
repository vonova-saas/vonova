import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StripeService } from '../services/stripe.service';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { Subscription, SubscriptionDocument, SubscriptionStatus, SubscriptionTier } from '../schemas/subscription.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

/**
 * Stripe Payment Controller
 * 
 * Handles payment-related NATS message patterns
 * for subscription and marketplace purchases.
 */
@Controller()
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeService: StripeService,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  // ==================== SUBSCRIPTION CHECKOUT ====================

  @MessagePattern({ cmd: 'stripe.create-subscription-checkout' })
  async createSubscriptionCheckout(
    @Payload() data: {
      userId: string;
      email: string;
      interval: 'monthly' | 'yearly';
      name?: string;
    },
  ) {
    try {
      const session = await this.stripeService.createSubscriptionCheckout(
        data.userId,
        data.email,
        data.interval,
        data.name,
      );

      return {
        success: true,
        data: session,
      };
    } catch (error) {
      this.logger.error('Failed to create subscription checkout:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'stripe.cancel-subscription' })
  async cancelSubscription(@Payload('userId') userId: string) {
    try {
      await this.stripeService.cancelSubscription(userId);
      return {
        success: true,
        message: 'Subscription will be cancelled at period end',
      };
    } catch (error) {
      this.logger.error('Failed to cancel subscription:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'stripe.reactivate-subscription' })
  async reactivateSubscription(@Payload('userId') userId: string) {
    try {
      await this.stripeService.reactivateSubscription(userId);
      return {
        success: true,
        message: 'Subscription reactivated',
      };
    } catch (error) {
      this.logger.error('Failed to reactivate subscription:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'stripe.update-subscription' })
  async updateSubscription(
    @Payload() data: { userId: string; newInterval: 'monthly' | 'yearly' },
  ) {
    try {
      await this.stripeService.updateSubscriptionTier(data.userId, data.newInterval);
      return {
        success: true,
        message: 'Subscription updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update subscription:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== MARKETPLACE CHECKOUT ====================

  @MessagePattern({ cmd: 'stripe.create-marketplace-checkout' })
  async createMarketplaceCheckout(
    @Payload() data: {
      userId: string;
      email: string;
      itemType: 'course' | 'material';
      itemId: string;
      itemName: string;
      amount: number;
      instructorId: string;
      instructorStripeAccountId: string;
      name?: string;
    },
  ) {
    try {
      const session = await this.stripeService.createMarketplaceCheckout(
        data.userId,
        data.email,
        data.itemType,
        data.itemId,
        data.itemName,
        data.amount,
        data.instructorId,
        data.instructorStripeAccountId,
        data.name,
      );

      return {
        success: true,
        data: session,
      };
    } catch (error) {
      this.logger.error('Failed to create marketplace checkout:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== CONNECT (INSTRUCTOR) ====================

  @MessagePattern({ cmd: 'stripe.create-connect-account' })
  async createConnectAccount(
    @Payload() data: { email: string; country: string },
  ) {
    try {
      const accountId = await this.stripeService.createConnectAccount(
        data.email,
        data.country,
      );

      return {
        success: true,
        data: { accountId },
      };
    } catch (error) {
      this.logger.error('Failed to create connect account:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'stripe.create-connect-onboarding' })
  async createConnectOnboarding(@Payload('accountId') accountId: string) {
    try {
      const url = await this.stripeService.createConnectOnboardingLink(accountId);
      return {
        success: true,
        data: { url },
      };
    } catch (error) {
      this.logger.error('Failed to create onboarding link:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'stripe.create-connect-dashboard' })
  async createConnectDashboard(@Payload('accountId') accountId: string) {
    try {
      const url = await this.stripeService.createConnectDashboardLink(accountId);
      return {
        success: true,
        data: { url },
      };
    } catch (error) {
      this.logger.error('Failed to create dashboard link:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== GET CHECKOUT SESSION ====================

  @MessagePattern({ cmd: 'stripe.get-session' })
  async getCheckoutSession(@Payload('sessionId') sessionId: string) {
    try {
      const session = await this.stripeService.getCheckoutSession(sessionId);
      return {
        success: true,
        data: session,
      };
    } catch (error) {
      this.logger.error('Failed to get checkout session:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== SUBSCRIPTION STATUS ====================

  @MessagePattern({ cmd: 'stripe.get-subscription' })
  async getUserSubscription(@Payload('userId') userId: string) {
    try {
      const subscription = await this.subscriptionModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!subscription) {
        return {
          success: true,
          data: {
            status: SubscriptionStatus.INCOMPLETE,
            tier: SubscriptionTier.FREE,
          },
        };
      }

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      this.logger.error('Failed to get subscription:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== BILLING HISTORY ====================

  @MessagePattern({ cmd: 'stripe.get-billing-history' })
  async getBillingHistory(@Payload('userId') userId: string) {
    try {
      const payments = await this.paymentModel.find({
        userId: new Types.ObjectId(userId),
        status: { $in: ['completed', 'refunded'] },
      })
        .sort({ createdAt: -1 })
        .limit(50);

      return {
        success: true,
        data: payments,
      };
    } catch (error) {
      this.logger.error('Failed to get billing history:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
