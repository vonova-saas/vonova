import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateBillingDto } from './dto/update-billing.dto';

@Injectable()
export class BillingGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  findOne(userId: string) {
    return this.client.send({ cmd: 'getUserBilling' }, { userId });
  }

  update(userId: string, updateBillingDto: UpdateBillingDto) {
    return this.client.send(
      { cmd: 'updateUserBilling' },
      {
        userId,
        updateBillingDto,
      },
    );
  }
}
