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

  approveInstructor(instructorId: string) {
    return this.client.send(
      { cmd: 'approveInstructor' },
      { instructorId },
    );
  }

  rejectInstructor(instructorId: string) {
    return this.client.send({ cmd: 'rejectInstructor' }, { instructorId });
  }

  listPendingInstructors() {
    return this.client.send({ cmd: 'listPendingInstructors' }, {});
  }

  touchActivity(userId: string, lastAction: string) {
    return this.client.send(
      { cmd: 'admin.activity.touch' },
      { userId, lastAction },
    );
  }

  logUserEvent(
    userId: string,
    action: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.client.send(
      { cmd: 'admin.event.log' },
      { userId, action, metadata },
    );
  }

  createDashboardSupport(body: {
    userId: string;
    message: string;
    type: 'BUG' | 'FEEDBACK';
  }) {
    return this.client.send({ cmd: 'admin.support.create' }, body);
  }

  replyDashboardSupport(body: {
    adminUserId: string;
    ticketId: string;
    adminReply: string;
  }) {
    return this.client.send({ cmd: 'admin.support.reply' }, body);
  }

  getAdminNotifications(query: { page?: number; limit?: number }) {
    return this.client.send({ cmd: 'admin.notifications.list' }, query ?? {});
  }
}
