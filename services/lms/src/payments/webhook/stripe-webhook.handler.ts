import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
// Stripe types - using any for v22 SDK compatibility
type StripeEvent = any;
type StripeCheckoutSession = any;
type StripeSubscription = any;
type StripeInvoice = any;
type StripePaymentIntent = any;
type StripeCharge = any;
type StripeAccount = any;
type StripeTransfer = any;
type StripePayout = any;
import { Payment, PaymentDocument, PaymentStatus, PaymentType } from '../schemas/payment.schema';
import { Subscription, SubscriptionDocument, SubscriptionStatus, SubscriptionTier, SubscriptionInterval } from '../schemas/subscription.schema';
import { InstructorPayout, InstructorPayoutDocument } from '../schemas/instructor-payout.schema';
import { StripeService } from '../services/stripe.service';
import { stripe, fromCents } from '../stripe.config';
import { EnrollService } from '../../course/enroll/enroll.service';

/**
 * Stripe Webhook Handler
 * 
 * Securely handles Stripe webhook events:
 * - checkout.session.completed
 * - invoice.paid
 * - payment_intent.succeeded
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * 
 * Features:
 * - Signature verification
 * - Idempotency protection
 * - Duplicate event handling
 * - Database synchronization
 */
@Injectable()
export class StripeWebhookHandler {
  private readonly logger = new Logger(StripeWebhookHandler.name);

  // Track processed events to prevent duplicates
  private processedEvents: Set<string> = new Set();

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(InstructorPayout.name) private payoutModel: Model<InstructorPayoutDocument>,
    private readonly stripeService: StripeService,
    private readonly enrollService: EnrollService,
  ) { }

  /**
   * Process incoming Stripe webhook event
   */
  async handleEvent(event: StripeEvent): Promise<void> {
    // Idempotency check
    if (this.processedEvents.has(event.id)) {
      this.logger.log(`Event ${event.id} already processed, skipping`);
      return;
    }

    this.logger.log(`Processing webhook event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        // ==================== CHECKOUT EVENTS ====================
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as any);
          break;

        case 'checkout.session.async_payment_succeeded':
          await this.handleCheckoutAsyncPaymentSucceeded(event.data.object as any);
          break;

        case 'checkout.session.async_payment_failed':
          await this.handleCheckoutAsyncPaymentFailed(event.data.object as any);
          break;

        // ==================== SUBSCRIPTION EVENTS ====================
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as any);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as any);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as any);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as any);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as any);
          break;

        // ==================== PAYMENT EVENTS ====================
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as any);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as any);
          break;

        case 'charge.succeeded':
          await this.handleChargeSucceeded(event.data.object as any);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as any);
          break;

        // ==================== CONNECT EVENTS ====================
        case 'account.updated':
          await this.handleConnectAccountUpdated(event.data.object as any);
          break;

        case 'transfer.created':
          await this.handleTransferCreated(event.data.object as any);
          break;

        case 'payout.paid':
          await this.handlePayoutPaid(event.data.object as any);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      this.processedEvents.add(event.id);

      // Cleanup old events (keep last 1000)
      if (this.processedEvents.size > 1000) {
        const iterator = this.processedEvents.values();
        this.processedEvents.delete(iterator.next().value);
      }
    } catch (error) {
      this.logger.error(`Error handling webhook event ${event.type}:`, error);
      throw error;
    }
  }

  // ==================== CHECKOUT HANDLERS ====================

  private async handleCheckoutSessionCompleted(session: any): Promise<void> {
    const { userId, type } = session.metadata || {};

    if (!userId) {
      throw new Error('No userId in session metadata');
    }

    if (session.mode === 'subscription') {
      // Subscription checkout
      await this.subscriptionModel.findOneAndUpdate(
        { stripeSubscriptionId: session.subscription },
        {
          $set: {
            status: SubscriptionStatus.ACTIVE,
            tier: SubscriptionTier.PRO,
            stripeCustomerId: session.customer as string,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            trialStart: new Date(),
            trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day trial
            paidAt: new Date(),
          },
        },
      );

      // Create payment record for subscription
      await this.paymentModel.findOneAndUpdate(
        { stripeCheckoutSessionId: session.id },
        {
          $set: {
            status: PaymentStatus.COMPLETED,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            paidAt: new Date(),
          },
        },
        { upsert: true },
      );
    } else if (session.mode === 'payment') {
      // One-time purchase (course/material)
      const paymentIntent = await this.stripeService.getPaymentIntent(session.payment_intent as string);

      await this.paymentModel.findOneAndUpdate(
        { stripeCheckoutSessionId: session.id },
        {
          $set: {
            status: PaymentStatus.COMPLETED,
            stripePaymentIntentId: session.payment_intent as string,
            stripeCustomerId: session.customer as string,
            paidAt: new Date(),
            amount: paymentIntent.amount,
            platformFee: paymentIntent.application_fee_amount || 0,
          },
        },
      );

      // Update instructor balance
      const payment = await this.paymentModel.findOne({ stripeCheckoutSessionId: session.id });
      if (payment?.instructorId) {
        await this.updateInstructorBalance(payment.instructorId.toString(), payment.instructorPayout);
      }

      const meta = session.metadata || {};
      const courseIdToEnroll =
        meta.itemType === 'course'
          ? meta.itemId
          : meta.courseId || payment?.courseId?.toString();
      const enrollUserId = meta.userId || userId;
      if (courseIdToEnroll && enrollUserId) {
        try {
          await this.enrollService.enrollCourse(
            String(courseIdToEnroll),
            String(enrollUserId),
            String(enrollUserId),
          );
          this.logger.log(
            `Enrolled user ${enrollUserId} in course ${courseIdToEnroll} after checkout`,
          );
        } catch (err) {
          this.logger.error('Post-checkout course enrollment failed', err);
        }
      }
    }
  }

  private async handleCheckoutAsyncPaymentSucceeded(session: any): Promise<void> {
    await this.handleCheckoutSessionCompleted(session);
  }

  private async handleCheckoutAsyncPaymentFailed(session: any): Promise<void> {
    await this.paymentModel.findOneAndUpdate(
      { stripeCheckoutSessionId: session.id },
      {
        $set: {
          status: PaymentStatus.FAILED,
          failureMessage: 'Async payment failed',
        },
      },
    );
  }

  // ==================== SUBSCRIPTION HANDLERS ====================

  private async handleSubscriptionCreated(subscription: any): Promise<void> {
    // Subscription already handled in checkout.session.completed
    this.logger.log(`Subscription created: ${subscription.id}`);
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const status = this.mapStripeStatus(subscription.status);

    const updateData: any = {
      status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    if (subscription.current_period_start) {
      updateData.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    }
    if (subscription.current_period_end) {
      updateData.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    }
    if (subscription.ended_at) {
      updateData.endedAt = new Date(subscription.ended_at * 1000);
    }

    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { $set: updateData },
    );
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        $set: {
          status: SubscriptionStatus.CANCELLED,
          endedAt: new Date(),
          tier: SubscriptionTier.FREE,
        },
      },
    );
  }

  private async handleInvoicePaid(invoice: any): Promise<void> {
    if (!invoice.subscription) return; // Not a subscription invoice

    // Update subscription period
    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: invoice.subscription },
      {
        $set: {
          currentPeriodStart: new Date(invoice.period_start * 1000),
          currentPeriodEnd: new Date(invoice.period_end * 1000),
        },
      },
    );

    // Create payment record for the invoice
    await this.paymentModel.findOneAndUpdate(
      { stripeInvoiceId: invoice.id },
      {
        $set: {
          status: PaymentStatus.COMPLETED,
          amount: invoice.amount_paid,
          paidAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: invoice.subscription },
      { $set: { status: SubscriptionStatus.PAST_DUE } },
    );
  }

  // ==================== PAYMENT HANDLERS ====================

  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    await this.paymentModel.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      {
        $set: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
      },
    );
  }

  private async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    await this.paymentModel.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      {
        $set: {
          status: PaymentStatus.FAILED,
          failureMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
        },
      },
    );
  }

  private async handleChargeSucceeded(charge: any): Promise<void> {
    await this.paymentModel.findOneAndUpdate(
      { stripeChargeId: charge.id },
      {
        $set: {
          stripeChargeId: charge.id,
        },
      },
    );
  }

  private async handleChargeRefunded(charge: any): Promise<void> {
    await this.paymentModel.findOneAndUpdate(
      { stripeChargeId: charge.id },
      {
        $set: {
          status: PaymentStatus.REFUNDED,
          refundAmount: charge.amount_refunded,
          refundedAt: new Date(),
        },
      },
    );
  }

  // ==================== CONNECT HANDLERS ====================

  private async handleConnectAccountUpdated(account: any): Promise<void> {
    this.logger.log(`Connect account updated: ${account.id}`);
    // Could update instructor verification status here
  }

  private async handleTransferCreated(transfer: any): Promise<void> {
    this.logger.log(`Transfer created: ${transfer.id}`);
    // Update instructor payout record
  }

  private async handlePayoutPaid(payout: any): Promise<void> {
    await this.payoutModel.findOneAndUpdate(
      { stripePayoutId: payout.id },
      {
        $set: {
          status: 'paid',
          payoutDate: new Date(),
        },
      },
    );
  }

  // ==================== HELPERS ====================

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'active': SubscriptionStatus.ACTIVE,
      'canceled': SubscriptionStatus.CANCELLED,
      'incomplete': SubscriptionStatus.INCOMPLETE,
      'incomplete_expired': SubscriptionStatus.INCOMPLETE_EXPIRED,
      'past_due': SubscriptionStatus.PAST_DUE,
      'paused': SubscriptionStatus.PAUSED,
      'trialing': SubscriptionStatus.TRIALING,
      'unpaid': SubscriptionStatus.UNPAID,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.INCOMPLETE;
  }

  private async updateInstructorBalance(instructorId: string, amount: number): Promise<void> {
    // Update or create payout record with available balance
    await this.payoutModel.findOneAndUpdate(
      { instructorId: new Types.ObjectId(instructorId) },
      {
        $inc: { availableBalance: amount, lifetimeEarnings: amount },
      },
      { upsert: true },
    );
  }
}
