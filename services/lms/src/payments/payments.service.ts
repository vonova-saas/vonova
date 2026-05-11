import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schema/payment.schema';

// Stripe prices - these would come from environment variables in production
const STRIPE_PRICES = {
  PRO_MONTHLY: 'price_monthly_placeholder',
  PRO_YEARLY: 'price_yearly_placeholder',
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async createPayment(data: {
    userId: string;
    type: 'SUBSCRIPTION' | 'COURSE' | 'MATERIAL';
    amount: number;
    currency?: string;
    description: string;
    courseId?: string;
    materialId?: string;
    subscriptionId?: string;
    provider?: 'STRIPE' | 'PAYPAL';
  }): Promise<PaymentDocument> {
    const payment = new this.paymentModel({
      userId: new Types.ObjectId(data.userId),
      type: data.type,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: 'PENDING',
      provider: data.provider || 'STRIPE',
      description: data.description,
      courseId: data.courseId ? new Types.ObjectId(data.courseId) : undefined,
      materialId: data.materialId ? new Types.ObjectId(data.materialId) : undefined,
      subscriptionId: data.subscriptionId ? new Types.ObjectId(data.subscriptionId) : undefined,
    });

    return payment.save();
  }

  async updatePaymentStatus(
    paymentId: string,
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED',
    providerPaymentId?: string,
  ): Promise<PaymentDocument | null> {
    const update: any = { status };
    if (providerPaymentId) {
      update.providerPaymentId = providerPaymentId;
    }

    return this.paymentModel.findByIdAndUpdate(
      paymentId,
      { $set: update },
      { new: true },
    );
  }

  async getPaymentById(paymentId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findById(paymentId);
  }

  async getUserPayments(userId: string): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  async getUserBillingHistory(userId: string): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({
        userId: new Types.ObjectId(userId),
        status: { $in: ['COMPLETED', 'REFUNDED'] },
      })
      .sort({ createdAt: -1 });
  }

  async createStripeCheckoutSession(data: {
    userId: string;
    email: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    // This would integrate with Stripe in production
    // For now, return a mock session
    const mockSessionId = `cs_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // In production, you would:
    // 1. Create or retrieve Stripe customer
    // 2. Create checkout session with Stripe API
    // 3. Return the session ID and URL
    
    return {
      sessionId: mockSessionId,
      url: `${data.successUrl}?session_id=${mockSessionId}`,
    };
  }

  async handleStripeWebhook(payload: any, signature: string): Promise<void> {
    // Verify webhook signature and process events
    // In production, this would:
    // 1. Verify the webhook signature
    // 2. Handle different event types (checkout.completed, invoice.paid, etc.)
    // 3. Update subscription and payment records accordingly
    
    const event = payload;
    
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        break;
      case 'invoice.paid':
        // Handle successful payment
        break;
      case 'invoice.payment_failed':
        // Handle failed payment
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
      default:
        // Unknown event type
        break;
    }
  }

  async getSubscriptionPrice(billingCycle: 'MONTHLY' | 'YEARLY'): Promise<{
    amount: number;
    currency: string;
    priceId: string;
  }> {
    // In production, these would come from Stripe
    const prices = {
      MONTHLY: { amount: 9.99, currency: 'USD', priceId: STRIPE_PRICES.PRO_MONTHLY },
      YEARLY: { amount: 99.99, currency: 'USD', priceId: STRIPE_PRICES.PRO_YEARLY },
    };

    return prices[billingCycle];
  }
}
