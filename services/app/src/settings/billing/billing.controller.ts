import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { BillingService } from './billing.service';
import { UpdateUserBillingDto } from './dto/billing.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get(':userId')
  async getBilling(@Param('userId') userId: string) {
    const billing = await this.billingService.getUserBilling(userId);
    return { message: 'User billing fetched successfully', data: billing };
  }

  @Put(':userId')
  async updateBilling(
    @Param('userId') userId: string,
    @Body() body: UpdateUserBillingDto,
  ) {
    const billing = await this.billingService.updateUserBilling(userId, body);
    return { message: 'User billing updated successfully', data: billing };
  }
}
