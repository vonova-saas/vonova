import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { InstructorPayout, InstructorPayoutSchema } from './schemas/instructor-payout.schema';
import { StripeService } from './services/stripe.service';
import { StripeController } from './controllers/stripe.controller';
import { StripeWebhookHandler } from './webhook/stripe-webhook.handler';
import { validateStripeConfig } from './stripe.config';
import { EnrollModule } from '../course/enroll/enroll.module';

/**
 * Stripe Payment Module
 * 
 * Complete Stripe integration for:
 * - SaaS subscriptions (Pro plan)
 * - Marketplace payments (courses/materials)
 * - Stripe Connect (instructor payouts)
 * - Webhook handling
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: InstructorPayout.name, schema: InstructorPayoutSchema },
    ]),
    EnrollModule,
  ],
  controllers: [StripeController],
  providers: [StripeService, StripeWebhookHandler],
  exports: [StripeService, StripeWebhookHandler],
})
export class StripeModule implements OnModuleInit {
  onModuleInit() {
    // Validate Stripe configuration on startup
    try {
      validateStripeConfig();
      console.log('✅ Stripe configuration validated successfully');
    } catch (error) {
      console.error('❌ Stripe configuration error:', error.message);
      // Don't throw in development to allow startup without env vars
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
}
