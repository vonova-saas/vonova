import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createPayment(data: {
    userId: string;
    type: 'SUBSCRIPTION' | 'COURSE' | 'MATERIAL';
    amount: number;
    currency?: string;
    description: string;
    courseId?: string;
    materialId?: string;
    subscriptionId?: string;
  }) {
    return this.client.send(
      { cmd: 'payment.create' },
      data,
    );
  }

  getUserPayments(userId: string) {
    return this.client.send(
      { cmd: 'payment.getUserPayments' },
      { userId },
    );
  }

  getBillingHistory(userId: string) {
    return this.client.send(
      { cmd: 'payment.getBillingHistory' },
      { userId },
    );
  }

  createCheckoutSession(data: {
    userId: string;
    email: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    successUrl: string;
    cancelUrl: string;
  }) {
    return this.client.send(
      { cmd: 'payment.createCheckoutSession' },
      data,
    );
  }

  getSubscriptionPrice(billingCycle: 'MONTHLY' | 'YEARLY') {
    return this.client.send(
      { cmd: 'payment.getSubscriptionPrice' },
      { billingCycle },
    );
  }
}
