import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BillingService } from './billing.service';
import { UpdateBillingDto } from './dto/update-billing.dto';

@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @MessagePattern({ cmd: 'getUserBilling' })
  findOne(@Payload('userId') userId: string) {
    return this.billingService.findOne(userId);
  }

  @MessagePattern({ cmd: 'updateUserBilling' })
  update(
    @Payload('userId') userId: string,
    @Payload('updateBillingDto') updateBillingDto: UpdateBillingDto,
  ) {
    return this.billingService.update(userId, updateBillingDto);
  }
}
