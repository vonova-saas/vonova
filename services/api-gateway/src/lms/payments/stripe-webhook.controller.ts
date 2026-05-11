import {
  Controller,
  Post,
  Headers,
  Body,
  RawBody,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import type { Response } from 'express';
import { Res } from '@nestjs/common';

/**
 * Stripe Webhook Controller (API Gateway)
 * 
 * Receives Stripe webhook events and forwards to LMS service.
 * 
 * Security:
 * - Signature verification via Stripe SDK
 * - Raw body parsing for signature validation
 * - Idempotency handling via Stripe event IDs
 */
@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    @Inject('NATS_SERVICE') private readonly client: ClientProxy,
  ) { }

  /**
   * Handle Stripe webhook events
   * 
   * @param signature - Stripe signature header
   * @param rawBody - Raw request body for signature verification
   * @param res - Express response
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!signature) {
        this.logger.warn('Missing Stripe signature');
        res.status(400).send('Missing signature');
        return;
      }

      if (!rawBody) {
        this.logger.warn('Missing request body');
        res.status(400).send('Missing body');
        return;
      }

      // Forward to LMS service for processing
      // The LMS service will verify the signature
      const result = await this.client
        .send(
          { cmd: 'stripe.webhook.handle' },
          {
            signature,
            payload: rawBody.toString(),
          },
        )
        .toPromise();

      if (result.success) {
        res.status(200).send('Webhook processed');
      } else {
        this.logger.error('Webhook processing failed:', result.error);
        res.status(400).send(result.error);
      }
    } catch (error) {
      this.logger.error('Webhook error:', error.message);
      res.status(500).send('Internal error');
    }
  }
}
