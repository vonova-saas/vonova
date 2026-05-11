import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class SubscriptionGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createSubscription(userId: string, plan: 'FREE' | 'PRO', billingCycle: 'MONTHLY' | 'YEARLY') {
    return this.client.send(
      { cmd: 'subscription.create' },
      { userId, plan, billingCycle },
    );
  }

  getUserSubscription(userId: string) {
    return this.client.send(
      { cmd: 'subscription.getUser' },
      { userId },
    );
  }

  getUserSubscriptions(userId: string) {
    return this.client.send(
      { cmd: 'subscription.getUserAll' },
      { userId },
    );
  }

  updateSubscription(subscriptionId: string, updates: any) {
    return this.client.send(
      { cmd: 'subscription.update' },
      { subscriptionId, dto: updates },
    );
  }

  cancelSubscription(subscriptionId: string) {
    return this.client.send(
      { cmd: 'subscription.cancel' },
      { subscriptionId },
    );
  }

  activateSubscription(subscriptionId: string) {
    return this.client.send(
      { cmd: 'subscription.activate' },
      { subscriptionId },
    );
  }

  checkUserPlan(userId: string) {
    return this.client.send(
      { cmd: 'subscription.checkPlan' },
      { userId },
    );
  }

  getPlanLimits(userId: string, role: string) {
    return this.client.send(
      { cmd: 'subscription.getLimits' },
      { userId, role },
    );
  }

  renewSubscription(subscriptionId: string) {
    return this.client.send(
      { cmd: 'subscription.renew' },
      { subscriptionId },
    );
  }
}
