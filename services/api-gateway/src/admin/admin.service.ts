import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { UpdateAdminUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class AdminGatewayService {
  constructor(@Inject('NATS_SERVICE') private readonly client: ClientProxy) {}

  getHealth() {
    return this.client.send({ cmd: 'admin.health.check' }, {});
  }

  getUsers(query: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) {
    return this.client.send({ cmd: 'admin.account.getUsers' }, query);
  }

  getUserById(userId: string) {
    return this.client.send({ cmd: 'admin.account.getUserById' }, { userId });
  }

  updateUserStatus(dto: UpdateAdminUserStatusDto) {
    return this.client.send({ cmd: 'admin.account.updateUserStatus' }, dto);
  }

  approveInstructor(instructorId: string) {
    return this.client.send({ cmd: 'approveInstructor' }, { instructorId });
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

  getDashboardOverview(query: {
    range?: '24h' | '7d' | '30d' | 'custom';
    customDate?: string;
  }) {
    return this.client.send({ cmd: 'admin.dashboard.overview' }, query ?? {});
  }

  getLoggingMonitoring(query: {
    range?: '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | 'custom';
    customDate?: string;
    search?: string;
    levels?: Array<'error' | 'warning' | 'info' | 'debug' | 'trace'>;
    sources?: string[];
    limit?: number;
  }): Observable<unknown> {
    return this.client.send({ cmd: 'admin.monitoring.get' }, query ?? {});
  }

  getPerformanceMetrics(query: {
    range?: '24h' | '7d' | '30d' | 'custom';
    customDate?: string;
  }): Observable<unknown> {
    return this.client.send({ cmd: 'admin.performance.get' }, query ?? {});
  }

  getUserManagementOverview(): Observable<unknown> {
    return this.client.send({ cmd: 'admin.user-management.overview' }, {});
  }

  getSupportTickets(query: {
    page?: number;
    limit?: number;
    status?: 'OPEN' | 'REPLIED';
    search?: string;
  }): Observable<unknown> {
    return this.client.send({ cmd: 'admin.support.list' }, query ?? {});
  }

  getSupportAnalytics(): Observable<unknown> {
    return this.client.send({ cmd: 'admin.support.analytics' }, {});
  }

  getSecurityLogs(query: {
    range?: '24h' | '7d' | '30d' | 'custom';
    customDate?: string;
    search?: string;
    limit?: number;
  }): Observable<unknown> {
    return this.client.send({ cmd: 'admin.security-logs.get' }, query ?? {});
  }

  getAdminSettings(adminId: string): Observable<unknown> {
    return this.client.send({ cmd: 'admin.settings.get' }, { adminId });
  }

  updateAdminSettings(
    adminId: string,
    update: {
      font?: string;
      fontSize?: string;
      theme?: 'light' | 'dark';
      language?: string;
    },
  ): Observable<unknown> {
    return this.client.send(
      { cmd: 'admin.settings.update' },
      { adminId, update },
    );
  }

  resetAdminSettings(adminId: string): Observable<unknown> {
    return this.client.send({ cmd: 'admin.settings.reset' }, { adminId });
  }

  getAdminNotificationSettings(adminId: string): Observable<unknown> {
    return this.client.send(
      { cmd: 'admin.notifications.get-settings' },
      { adminId },
    );
  }

  updateAdminNotificationSettings(
    adminId: string,
    update: {
      notifyMe?: 'all' | 'mentions' | 'none';
      communicationEmails?: boolean;
      marketingEmails?: boolean;
      socialEmails?: boolean;
      securityEmails?: boolean;
    },
  ): Observable<unknown> {
    return this.client.send(
      { cmd: 'admin.notifications.update-settings' },
      { adminId, update },
    );
  }

  resetAdminNotificationSettings(adminId: string): Observable<unknown> {
    return this.client.send(
      { cmd: 'admin.notifications.reset-settings' },
      { adminId },
    );
  }

  getAdminAccount(adminId: string): Observable<unknown> {
    return this.client.send({ cmd: 'admin.account.get' }, { adminId });
  }

  updateAdminAccount(
    adminId: string,
    update: {
      name?: string;
      bio?: string;
      address?: string;
      dateOfBirth?: string | null;
      file?: Express.Multer.File;
    },
  ): Observable<unknown> {
    return this.client.send({ cmd: 'admin.account.update' }, { adminId, update });
  }
}
