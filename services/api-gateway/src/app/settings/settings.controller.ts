/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { SettingsGatewayService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('api/v1/settings')
@UseGuards(JwtAuthGuard)
export class SettingsGatewayController {
  constructor(private readonly settingsService: SettingsGatewayService) {}

  @Get('user/:userId')
  async findOne(@Param('userId') userId: string, @Request() req: any) {
    // Authorization: User can only access their own settings
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own settings',
      );
    }
    return firstValueFrom(this.settingsService.findOne(userId));
  }

  @Patch('user/:userId')
  async update(
    @Param('userId') userId: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Request() req: any,
  ) {
    // Authorization: User can only update their own settings
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only update your own settings',
      );
    }
    return firstValueFrom(
      this.settingsService.update(userId, updateSettingDto),
    );
  }

  @Delete('user/:userId')
  async remove(@Param('userId') userId: string, @Request() req: any) {
    // Authorization: User can only delete their own settings
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only delete your own settings',
      );
    }
    return firstValueFrom(this.settingsService.remove(userId));
  }
}
