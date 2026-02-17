import { Controller } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('app/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @MessagePattern({ cmd: 'findOneSetting' })
  findOne(@Payload('userId') userId: string) {
    return this.settingsService.findOne(userId);
  }

  @MessagePattern({ cmd: 'updateSetting' })
  update(
    @Payload('userId') userId: string,
    @Payload('updateSettingDto') updateSettingDto: UpdateSettingDto,
  ) {
    return this.settingsService.update(userId, updateSettingDto);
  }

  @MessagePattern({ cmd: 'deleteSetting' })
  async remove(@Payload('userId') userId: string) {
    return await this.settingsService.remove(userId);
  }
}
