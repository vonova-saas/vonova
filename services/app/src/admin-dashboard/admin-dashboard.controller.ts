import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminActivityService } from './admin-activity.service';
import { UserEventService } from './user-event.service';
import { AdminSupportService } from './admin-support.service';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminUsersService } from './admin-users.service';

@Controller()
export class AdminDashboardController {
  constructor(
    private readonly activityService: AdminActivityService,
    private readonly userEventService: UserEventService,
    private readonly adminSupportService: AdminSupportService,
    private readonly notificationsService: AdminNotificationsService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  @MessagePattern({ cmd: 'admin.health.check' })
  handleHealthCheck() {
    return {
      success: true,
      data: {
        status: 'Healthy!',
        service: 'App Service (Admin Dashboard)',
        timestamp: new Date().toISOString(),
      },
      message: 'Health check successful',
    };
  }

  @MessagePattern({ cmd: 'admin.account.getUsers' })
  async handleGetUsers(
    @Payload()
    data: {
      page?: number;
      limit?: number;
      role?: string;
      search?: string;
      isActive?: boolean;
    },
  ) {
    const result = await this.adminUsersService.getAllUsersWithPresence(data ?? {});
    return {
      success: true,
      data: result,
      message: 'Users retrieved successfully',
    };
  }

  @MessagePattern({ cmd: 'admin.account.getUserById' })
  async handleGetUserById(@Payload() data: { userId: string }) {
    const result = await this.adminUsersService.getUserById(data.userId);
    return {
      success: true,
      data: result,
      message: 'User retrieved successfully',
    };
  }

  @MessagePattern({ cmd: 'admin.account.updateUserStatus' })
  async handleUpdateUserStatus(
    @Payload() data: { userId: string; isActive: boolean },
  ) {
    const result = await this.adminUsersService.updateUserStatus(
      data.userId,
      data.isActive,
    );
    return {
      success: true,
      data: result,
      message: 'User status updated successfully',
    };
  }

  @MessagePattern({ cmd: 'admin.activity.touch' })
  async handleActivityTouch(
    @Payload() data: { userId: string; lastAction: string },
  ) {
    await this.activityService.touch(data.userId, data.lastAction);
    return { success: true, data: null, message: 'Activity updated' };
  }

  @MessagePattern({ cmd: 'admin.event.log' })
  async handleEventLog(
    @Payload()
    data: {
      userId: string;
      action: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const doc = await this.userEventService.log(
      data.userId,
      data.action,
      data.metadata,
    );
    return {
      success: true,
      data: doc,
      message: 'Event recorded',
    };
  }

  @MessagePattern({ cmd: 'admin.support.create' })
  async handleSupportCreate(
    @Payload()
    data: { userId: string; message: string; type: 'BUG' | 'FEEDBACK' },
  ) {
    const ticket = await this.adminSupportService.create(
      data.userId,
      data.message,
      data.type,
    );
    return {
      success: true,
      data: ticket,
      message: 'Support ticket created',
    };
  }

  @MessagePattern({ cmd: 'admin.support.reply' })
  async handleSupportReply(
    @Payload()
    data: { adminUserId: string; ticketId: string; adminReply: string },
  ) {
    const ticket = await this.adminSupportService.reply(
      data.adminUserId,
      data.ticketId,
      data.adminReply,
    );
    return {
      success: true,
      data: ticket,
      message: 'Reply saved',
    };
  }

  @MessagePattern({ cmd: 'admin.notification.instructorApplication' })
  async handleInstructorApplicationNotification(
    @Payload() data: { userId: string; message?: string },
  ) {
    const doc =
      await this.notificationsService.createInstructorApplicationNotification(
        data.userId,
        data.message ?? 'New instructor application submitted',
      );
    return {
      success: true,
      data: doc,
      message: 'Notification created',
    };
  }

  @MessagePattern({ cmd: 'admin.notifications.list' })
  async handleNotificationsList(
    @Payload() data: { page?: number; limit?: number },
  ) {
    const result = await this.notificationsService.list(data ?? {});
    return {
      success: true,
      data: result,
      message: 'Notifications retrieved',
    };
  }
}
