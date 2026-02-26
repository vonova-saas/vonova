/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Body,
  Put,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { BillingGatewayService } from './billing.service';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('api/v1/billing')
@UseGuards(JwtAuthGuard)
export class BillingGatewayController {
  constructor(private readonly billingService: BillingGatewayService) {}

  @Get('user/:userId')
  async findOne(@Param('userId') userId: string, @Request() req: any) {
    // Authorization: User can only access their own billing
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own billing information',
      );
    }
    return firstValueFrom(this.billingService.findOne(userId));
  }

  @Put('user/:userId')
  async update(
    @Param('userId') userId: string,
    @Body() updateBillingDto: UpdateBillingDto,
    @Request() req: any,
  ) {
    // Authorization: User can only update their own billing
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only update your own billing information',
      );
    }
    return firstValueFrom(this.billingService.update(userId, updateBillingDto));
  }
}
