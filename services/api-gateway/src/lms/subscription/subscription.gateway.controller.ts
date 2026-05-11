import { Controller, Get, Post, Patch, Delete, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SubscriptionGatewayService } from './subscription.gateway.service';

@ApiTags('LMS Subscriptions')
@ApiBearerAuth()
@Controller('api/v1/lms/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionGatewayController {
  constructor(private readonly subscriptionService: SubscriptionGatewayService) {}

  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  @Get('my-subscription')
  async getMySubscription(@Request() req) {
    const userId = req.user._id;
    return firstValueFrom(this.subscriptionService.getUserSubscription(userId));
  }

  @ApiOperation({ summary: 'Get user subscription history' })
  @ApiResponse({ status: 200, description: 'Subscription history retrieved successfully' })
  @Get('history')
  async getSubscriptionHistory(@Request() req) {
    const userId = req.user._id;
    return firstValueFrom(this.subscriptionService.getUserSubscriptions(userId));
  }

  @ApiOperation({ summary: 'Check current plan and limits' })
  @ApiResponse({ status: 200, description: 'Plan information retrieved successfully' })
  @Get('plan')
  async checkPlan(@Request() req) {
    const userId = req.user._id;
    const role = req.user.role;
    const planInfo = await firstValueFrom(this.subscriptionService.checkUserPlan(userId));
    const limits = await firstValueFrom(this.subscriptionService.getPlanLimits(userId, role));
    return {
      message: 'Plan information retrieved successfully',
      data: {
        ...planInfo,
        limits,
      },
    };
  }

  @ApiOperation({ summary: 'Upgrade to Pro' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @Post('upgrade')
  async upgradeSubscription(
    @Request() req,
    @Body() body: { billingCycle: 'MONTHLY' | 'YEARLY' },
  ) {
    const userId = req.user._id;
    return firstValueFrom(
      this.subscriptionService.createSubscription(userId, 'PRO', body.billingCycle),
    );
  }

  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @Post('cancel')
  async cancelSubscription(@Request() req) {
    const userId = req.user._id;
    const subscription = await firstValueFrom(
      this.subscriptionService.getUserSubscription(userId),
    );
    if (!subscription.data) {
      return { message: 'No active subscription found' };
    }
    return firstValueFrom(
      this.subscriptionService.cancelSubscription(subscription.data._id),
    );
  }
}
