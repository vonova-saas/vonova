import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentStatusDto, CreateCheckoutSessionDto } from './dto/payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern({ cmd: 'payment.create' })
  async createPayment(@Payload() dto: CreatePaymentDto) {
    const payment = await this.paymentsService.createPayment(dto);
    return { message: 'Payment created successfully', data: payment };
  }

  @MessagePattern({ cmd: 'payment.updateStatus' })
  async updatePaymentStatus(
    @Payload('paymentId') paymentId: string,
    @Payload('dto') dto: UpdatePaymentStatusDto,
  ) {
    const payment = await this.paymentsService.updatePaymentStatus(
      paymentId,
      dto.status,
      dto.providerPaymentId,
    );
    return { message: 'Payment status updated successfully', data: payment };
  }

  @MessagePattern({ cmd: 'payment.getById' })
  async getPaymentById(@Payload('paymentId') paymentId: string) {
    const payment = await this.paymentsService.getPaymentById(paymentId);
    return { message: 'Payment retrieved successfully', data: payment };
  }

  @MessagePattern({ cmd: 'payment.getUserPayments' })
  async getUserPayments(@Payload('userId') userId: string) {
    const payments = await this.paymentsService.getUserPayments(userId);
    return { message: 'Payments retrieved successfully', data: payments };
  }

  @MessagePattern({ cmd: 'payment.getBillingHistory' })
  async getBillingHistory(@Payload('userId') userId: string) {
    const history = await this.paymentsService.getUserBillingHistory(userId);
    return { message: 'Billing history retrieved successfully', data: history };
  }

  @MessagePattern({ cmd: 'payment.createCheckoutSession' })
  async createCheckoutSession(@Payload() dto: CreateCheckoutSessionDto) {
    const session = await this.paymentsService.createStripeCheckoutSession(dto);
    return { message: 'Checkout session created successfully', data: session };
  }

  @MessagePattern({ cmd: 'payment.getSubscriptionPrice' })
  async getSubscriptionPrice(
    @Payload('billingCycle') billingCycle: 'MONTHLY' | 'YEARLY',
  ) {
    const price = await this.paymentsService.getSubscriptionPrice(billingCycle);
    return { message: 'Subscription price retrieved successfully', data: price };
  }
}
