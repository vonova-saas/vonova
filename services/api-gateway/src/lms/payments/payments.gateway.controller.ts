import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PaymentsGatewayService } from './payments.gateway.service';

@ApiTags('LMS Payments')
@ApiBearerAuth()
@Controller('api/v1/lms/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsGatewayController {
  constructor(private readonly paymentsService: PaymentsGatewayService) {}

  @ApiOperation({ summary: 'Get billing history' })
  @ApiResponse({ status: 200, description: 'Billing history retrieved successfully' })
  @Get('billing-history')
  async getBillingHistory(@Request() req) {
    const userId = req.user._id;
    return firstValueFrom(this.paymentsService.getBillingHistory(userId));
  }

  @ApiOperation({ summary: 'Get user payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @Get('my-payments')
  async getUserPayments(@Request() req) {
    const userId = req.user._id;
    return firstValueFrom(this.paymentsService.getUserPayments(userId));
  }

  @ApiOperation({ summary: 'Create checkout session for subscription' })
  @ApiResponse({ status: 201, description: 'Checkout session created successfully' })
  @Post('checkout-session')
  async createCheckoutSession(
    @Request() req,
    @Body() body: { billingCycle: 'MONTHLY' | 'YEARLY'; successUrl: string; cancelUrl: string },
  ) {
    const userId = req.user._id;
    const email = req.user.email;
    return firstValueFrom(
      this.paymentsService.createCheckoutSession({
        userId,
        email,
        billingCycle: body.billingCycle,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
      }),
    );
  }

  @ApiOperation({ summary: 'Get subscription pricing' })
  @ApiResponse({ status: 200, description: 'Pricing retrieved successfully' })
  @Get('pricing')
  async getPricing() {
    const monthly = await firstValueFrom(
      this.paymentsService.getSubscriptionPrice('MONTHLY'),
    );
    const yearly = await firstValueFrom(
      this.paymentsService.getSubscriptionPrice('YEARLY'),
    );
    return {
      message: 'Pricing retrieved successfully',
      data: {
        monthly,
        yearly,
      },
    };
  }
}
