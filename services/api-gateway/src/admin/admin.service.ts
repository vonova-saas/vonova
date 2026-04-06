import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateAdminUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class AdminGatewayService {
  constructor(@Inject('NATS_SERVICE') private readonly client: ClientProxy) {}

  getHealth() {
    return this.client.send({ cmd: 'admin.health.check' }, {});
  }

  getUsers(query: { page?: number; limit?: number; role?: string; search?: string }) {
    return this.client.send({ cmd: 'admin.account.getUsers' }, query);
  }

  getUserById(userId: string) {
    return this.client.send({ cmd: 'admin.account.getUserById' }, { userId });
  }

  updateUserStatus(dto: UpdateAdminUserStatusDto) {
    return this.client.send({ cmd: 'admin.account.updateUserStatus' }, dto);
  }
}
