import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AddWaitUserDto } from './dto/add-wait-user.dto';

@Injectable()
export class WaitlistGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  addWaitUser(dto: AddWaitUserDto) {
    return this.client.send({ cmd: 'addWaitUser' }, dto);
  }

  checkPromoCodeForEmail(dto: { email: string; promoCode: string }) {
    return this.client.send({ cmd: 'checkPromoCodeForEmail' }, dto);
  }

  getAllWaitUsers() {
    return this.client.send({ cmd: 'getAllWaitUsers' }, {});
  }

  getWaitUserById(userId: string) {
    return this.client.send({ cmd: 'getWaitUserById' }, { id: userId });
  }

  deleteWaitUser(userId: string) {
    return this.client.send({ cmd: 'deleteWaitUser' }, { id: userId });
  }

  getWaitlistStats() {
    return this.client.send({ cmd: 'getWaitlistStats' }, {});
  }
}
