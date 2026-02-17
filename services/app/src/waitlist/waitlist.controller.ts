import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import * as waitlistService from './waitlist.service';
import { AddWaitUserDto } from './dto/add-wait-user.dto';
import { CheckPromoCodeDto } from './dto/check-promo-code.dto';

@Controller('waitlist')
export class WaitlistController {
  constructor(
    private readonly waitlistService: waitlistService.WaitlistService,
  ) {}

  @MessagePattern({ cmd: 'addWaitUser' })
  async addWaitUser(@Payload() dto: AddWaitUserDto) {
    return this.waitlistService.addWaitUser(dto);
  }

  @MessagePattern({ cmd: 'checkPromoCodeForEmail' })
  async checkPromoCodeForEmail(@Payload() dto: CheckPromoCodeDto) {
    return this.waitlistService.checkPromoCodeForEmail(dto);
  }

  @MessagePattern({ cmd: 'checkCouponCode' })
  async checkCouponCode(@Payload() dto: waitlistService.CheckCouponCodeDto) {
    return this.waitlistService.checkCouponCode(dto);
  }

  @MessagePattern({ cmd: 'getAllWaitUsers' })
  async getAllWaitUsers() {
    return this.waitlistService.getAllWaitUsers();
  }

  @MessagePattern({ cmd: 'getWaitUserById' })
  async getWaitUserById(@Payload() userId: string) {
    return this.waitlistService.getWaitUserById(userId);
  }

  @MessagePattern({ cmd: 'deleteWaitUser' })
  async deleteWaitUser(@Payload() userId: string) {
    return this.waitlistService.deleteWaitUser(userId);
  }

  @MessagePattern({ cmd: 'markPromoCodeAsUsed' })
  async markPromoCodeAsUsed(
    @Payload() dto: { email: string; promoCode: string },
  ) {
    return this.waitlistService.markPromoCodeAsUsed(dto.email, dto.promoCode);
  }

  @MessagePattern({ cmd: 'getWaitlistStats' })
  async getWaitlistStats() {
    return this.waitlistService.getWaitlistStats();
  }
}
