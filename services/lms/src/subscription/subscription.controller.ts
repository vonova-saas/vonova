import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @MessagePattern({ cmd: 'subscription.create' })
  async createSubscription(@Payload() dto: CreateSubscriptionDto) {
    const subscription = await this.subscriptionService.createSubscription(dto);
    return { message: 'Subscription created successfully', data: subscription };
  }

  @MessagePattern({ cmd: 'subscription.getUser' })
  async getUserSubscription(@Payload('userId') userId: string) {
    const subscription = await this.subscriptionService.getUserSubscription(userId);
    return { message: 'Subscription retrieved successfully', data: subscription };
  }

  @MessagePattern({ cmd: 'subscription.getUserAll' })
  async getUserSubscriptions(@Payload('userId') userId: string) {
    const subscriptions = await this.subscriptionService.getUserSubscriptions(userId);
    return { message: 'Subscriptions retrieved successfully', data: subscriptions };
  }

  @MessagePattern({ cmd: 'subscription.update' })
  async updateSubscription(
    @Payload('subscriptionId') subscriptionId: string,
    @Payload('dto') dto: UpdateSubscriptionDto,
  ) {
    const subscription = await this.subscriptionService.updateSubscription(subscriptionId, dto);
    return { message: 'Subscription updated successfully', data: subscription };
  }

  @MessagePattern({ cmd: 'subscription.cancel' })
  async cancelSubscription(@Payload('subscriptionId') subscriptionId: string) {
    const subscription = await this.subscriptionService.cancelSubscription(subscriptionId);
    return { message: 'Subscription cancellation scheduled', data: subscription };
  }

  @MessagePattern({ cmd: 'subscription.activate' })
  async activateSubscription(@Payload('subscriptionId') subscriptionId: string) {
    const subscription = await this.subscriptionService.activateSubscription(subscriptionId);
    return { message: 'Subscription activated successfully', data: subscription };
  }

  @MessagePattern({ cmd: 'subscription.checkPlan' })
  async checkUserPlan(@Payload('userId') userId: string) {
    const plan = await this.subscriptionService.checkUserPlan(userId);
    return { message: 'Plan retrieved successfully', data: plan };
  }

  @MessagePattern({ cmd: 'subscription.getLimits' })
  async getPlanLimits(
    @Payload('userId') userId: string,
    @Payload('role') role: string,
  ) {
    const limits = await this.subscriptionService.getPlanLimits(userId, role);
    return { message: 'Plan limits retrieved successfully', data: limits };
  }

  @MessagePattern({ cmd: 'subscription.renew' })
  async renewSubscription(@Payload('subscriptionId') subscriptionId: string) {
    const subscription = await this.subscriptionService.renewSubscription(subscriptionId);
    return { message: 'Subscription renewed successfully', data: subscription };
  }
}
