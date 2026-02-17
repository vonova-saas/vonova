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
import { AccountGatewayService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('api/v1/account')
@UseGuards(JwtAuthGuard)
export class AccountGatewayController {
  constructor(private readonly accountService: AccountGatewayService) {}

  @Get('user/:userId')
  async findOne(@Param('userId') userId: string, @Request() req: any) {
    // Authorization: User can only access their own account
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own account',
      );
    }
    return firstValueFrom(this.accountService.findOne(userId));
  }

  @Put('user/:userId')
  async update(
    @Param('userId') userId: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @Request() req: any,
  ) {
    // Authorization: User can only update their own account
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only update your own account',
      );
    }
    return firstValueFrom(this.accountService.update(userId, updateAccountDto));
  }
}
