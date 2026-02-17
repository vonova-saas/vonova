import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  findOne(userId: string) {
    return this.client.send({ cmd: 'findAccount' }, { userId });
  }

  update(userId: string, updateAccountDto: UpdateAccountDto) {
    return this.client.send(
      { cmd: 'updateAccount' },
      {
        userId,
        updateAccountDto,
      },
    );
  }
}
