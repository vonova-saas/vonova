import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { WaitlistGatewayService } from './waitlist.service';
import { AddWaitUserDto } from './dto/add-wait-user.dto';

@Controller('api/v1/app/waitlist')
export class WaitlistGatewayController {
  constructor(private readonly waitlistService: WaitlistGatewayService) { }

  @Post('add-user')
  addWaitUser(@Body() dto: AddWaitUserDto) {
    return this.waitlistService.addWaitUser(dto);
  }

  @Post('check-promo-code')
  checkPromoCodeForEmail(@Body() dto: { email: string; promoCode: string }) {
    return this.waitlistService.checkPromoCodeForEmail(dto);
  }

  @Get()
  getAllWaitUsers() {
    return this.waitlistService.getAllWaitUsers();
  }

  @Get('stats')
  getWaitlistStats() {
    return this.waitlistService.getWaitlistStats();
  }

  @Get(':userId')
  getWaitUserById(@Param('userId') userId: string) {
    return this.waitlistService.getWaitUserById(userId);
  }

  @Delete(':userId')
  deleteWaitUser(@Param('userId') userId: string) {
    return this.waitlistService.deleteWaitUser(userId);
  }
}
