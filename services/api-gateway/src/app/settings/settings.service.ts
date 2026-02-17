import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  findOne(userId: string) {
    return this.client.send({ cmd: 'findOneSetting' }, { userId });
  }

  update(userId: string, updateSettingDto: UpdateSettingDto) {
    return this.client.send(
      { cmd: 'updateSetting' },
      {
        userId,
        updateSettingDto,
      },
    );
  }

  remove(userId: string) {
    return this.client.send({ cmd: 'deleteSetting' }, { userId });
  }
}
