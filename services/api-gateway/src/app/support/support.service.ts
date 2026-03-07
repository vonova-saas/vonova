import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SupportDto } from './dto/support.dto';

@Injectable()
export class SupportGatewayService {
  constructor(@Inject('NATS_SERVICE') private readonly client: ClientProxy) {}

  create(createSupportDto: SupportDto, userId: string) {
    return this.client.send(
      { cmd: 'createSupport' },
      { createSupportDto, userId },
    );
  }

  findAll(userId: string) {
    return this.client.send({ cmd: 'findAllSupport' }, { userId });
  }

  findOne(userId: string, id: string) {
    return this.client.send({ cmd: 'findOneSupport' }, { userId, id });
  }

  update(userId: string, id: string, updateSupportDto: SupportDto) {
    return this.client.send(
      { cmd: 'updateSupport' },
      {
        userId,
        updateSupportDto: { ...updateSupportDto, id },
      },
    );
  }

  remove(userId: string, id: string) {
    return this.client.send({ cmd: 'removeSupport' }, { userId, id });
  }

  createMessage(userId: string, id: string, message: string) {
    return this.client.send({ cmd: 'createMessage' }, { userId, id, message });
  }

  findOneMessages(userId: string, id: string) {
    return this.client.send({ cmd: 'findOneMessages' }, { userId, id });
  }

  updateStatus(userId: string, id: string, status: string) {
    return this.client.send({ cmd: 'updateStatus' }, { userId, id, status });
  }
}
