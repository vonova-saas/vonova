import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { stripe, stripeConfig, toCents } from '../stripe.config';
import { Payment, PaymentDocument, PaymentStatus, PaymentType } from '../schemas/payment.schema';
import { Subscription, SubscriptionDocument, SubscriptionStatus, SubscriptionTier, SubscriptionInterval } from '../schemas/subscription.schema';
import { InstructorPayout, PayoutStatus } from '../schemas/instructor-payout.schema';

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  clientSecret: string | null;
  status: string;
}

/**
 * Stripe Service
 * 
 * Core Stripe integration handling:
 * - Subscription management
 * - One-time payments (courses/materials)
 * - Stripe Connect (instructor payouts)
 * - Customer management
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(InstructorPayout.name) private payoutModel: Model<InstructorPayout>,
  ) {}

  // ==================== CUSTOMER MANAGEMENT ====================

  /**
   * Create or retrieve Stripe customer
   */
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
    // Check if user already has a Stripe customer ID
    const existingSub = await this.subscriptionModel.findOne({ userId: new Types.ObjectId(userId) });
    
    if (existingSub?.stripeCustomerId) {
      // Update customer info
      await stripe.customers.update(existingSub.stripeCustomerId, {
        email,
        name: name || email,
      });
      return existingSub.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || email,
      metadata: { userId },
    });

    return customer.id;
  }

  /**
   * Get customer from Stripe
   */
  async getCustomer(customerId: string) {
    return stripe.customers.retrieve(customerId);
  }

  // ==================== SUBSCRIPTION CHECKOUT ====================

  /**
   * Create checkout session for Pro subscription
   */
  async createSubscriptionCheckout(
    userId: string,
    email: string,
    interval: 'monthly' | 'yearly',
    name?: string,
  ): Promise<CheckoutSessionResult> {
    const customerId = await this.getOrCreateCustomer(userId, email, name);
    
    const priceId = interval === 'yearly' 
      ? stripeConfig.products.proYearly 
      : stripeConfig.products.proMonthly;

    if (!priceId) {
      throw new Error(`Price ID not configured for ${interval} subscription`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: { userId },
      },
      success_url: `${stripeConfig.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: stripeConfig.cancelUrl,
      metadata: {
        userId,
        type: 'subscription',
        interval,
      },
      client_reference_id: userId,
    });

    // Create pending subscription record
    await this.subscriptionModel.create({
      userId: new Types.ObjectId(userId),
      status: SubscriptionStatus.INCOMPLETE,
      tier: SubscriptionTier.PRO,
      interval: interval === 'yearly' ? SubscriptionInterval.YEARLY : SubscriptionInterval.MONTHLY,
      stripeCustomerId: customerId,
      stripeSubscriptionId: session.subscription as string,
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  /**
   * Create checkout session for marketplace purchase (course/material)
   */
  async createMarketplaceCheckout(
    userId: string,
    email: string,
    itemType: 'course' | 'material',
    itemId: string,
    itemName: string,
    amount: number,
    instructorId: string,
    instructorStripeAccountId: string,
    name?: string,
  ): Promise<CheckoutSessionResult> {
    const customerId = await this.getOrCreateCustomer(userId, email, name);
    
    const amountCents = toCents(amount);
    const platformFee = Math.round(amountCents * (stripeConfig.platformFeePercent / 100));

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: itemName,
              metadata: {
                itemType,
                itemId,
                instructorId,
              },
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: instructorStripeAccountId,
        },
        metadata: {
          userId,
          itemType,
          itemId,
          instructorId,
        },
      },
      success_url: `${stripeConfig.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: stripeConfig.cancelUrl,
      metadata: {
        userId,
        type: 'marketplace',
        itemType,
        itemId,
        instructorId,
        platformFee,
      },
      client_reference_id: userId,
    });

    // Create pending payment record
    await this.paymentModel.create({
      userId: new Types.ObjectId(userId),
      type: itemType === 'course' ? PaymentType.COURSE_PURCHASE : PaymentType.MATERIAL_PURCHASE,
      status: PaymentStatus.PENDING,
      amount: amountCents,
      description: itemName,
      stripeCustomerId: customerId,
      stripeCheckoutSessionId: session.id,
      courseId: itemType === 'course' ? new Types.ObjectId(itemId) : undefined,
      materialId: itemType === 'material' ? new Types.ObjectId(itemId) : undefined,
      instructorId: new Types.ObjectId(instructorId),
      platformFee,
      instructorPayout: amountCents - platformFee,
      platformFeePercent: stripeConfig.platformFeePercent,
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.subscriptionModel.updateOne(
      { _id: subscription._id },
      { cancelAtPeriodEnd: true, cancelledAt: new Date() },
    );
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(userId: string): Promise<void> {
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      cancelAtPeriodEnd: true,
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No cancelled subscription found');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await this.subscriptionModel.updateOne(
      { _id: subscription._id },
      { cancelAtPeriodEnd: false, cancelledAt: null },
    );
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscriptionTier(
    userId: string,
    newInterval: 'monthly' | 'yearly',
  ): Promise<void> {
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: SubscriptionStatus.ACTIVE,
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    const newPriceId = newInterval === 'yearly'
      ? stripeConfig.products.proYearly
      : stripeConfig.products.proMonthly;

    if (!newPriceId) {
      throw new Error('Price ID not configured');
    }

    // Get current subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const currentItem = stripeSubscription.items.data[0];

    // Update subscription with new price
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    // Update database record
    await this.subscriptionModel.updateOne(
      { _id: subscription._id },
      {
        interval: newInterval === 'yearly' ? SubscriptionInterval.YEARLY : SubscriptionInterval.MONTHLY,
        stripePriceId: newPriceId,
      },
    );
  }

  // ==================== STRIPE CONNECT (INSTRUCTORS) ====================

  /**
   * Create Stripe Connect account for instructor
   */
  async createConnectAccount(email: string, country: string): Promise<string> {
    const account = await stripe.accounts.create({
      type: 'standard',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: stripeConfig.connect.payoutSchedule.interval,
          },
        },
      },
    });

    return account.id;
  }

  /**
   * Create onboarding link for Connect account
   */
  async createConnectOnboardingLink(accountId: string): Promise<string> {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${stripeConfig.frontendUrl}/instructor/connect/refresh`,
      return_url: `${stripeConfig.frontendUrl}/instructor/connect/success`,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }

  /**
   * Get Connect account dashboard login link
   */
  async createConnectDashboardLink(accountId: string): Promise<string> {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return loginLink.url;
  }

  /**
   * Get Connect account details
   */
  async getConnectAccount(accountId: string) {
    return stripe.accounts.retrieve(accountId);
  }

  // ==================== RETRIEVE SESSION/PAYMENT ====================

  /**
   * Retrieve checkout session
   */
  async getCheckoutSession(sessionId: string) {
    return stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'payment_intent', 'line_items'],
    });
  }

  /**
   * Retrieve payment intent
   */
  async getPaymentIntent(paymentIntentId: string) {
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Retrieve subscription
   */
  async getSubscription(subscriptionId: string) {
    return stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'default_payment_method'],
    });
  }

  // ==================== WEBHOOK VERIFICATION ====================

  /**
   * Verify webhook signature
   */
  constructWebhookEvent(payload: Buffer, signature: string) {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeConfig.webhookSecret,
    );
  }
}
