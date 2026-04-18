import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { AdminActivityService } from '../admin-activity/admin-activity.service';
import { UserEventService } from '../user-event/user-event.service';
import { AdminSupportService } from '../admin-support/admin-support.service';
import { AdminNotificationsService } from '../admin-notifications/admin-notifications.service';

@ApiTags('Admin Dashboard')
@Controller()
export class AdminDashboardController {
  constructor(
    private readonly activityService: AdminActivityService,
    private readonly userEventService: UserEventService,
    private readonly adminSupportService: AdminSupportService,
    private readonly notificationsService: AdminNotificationsService,
  ) {}

  @MessagePattern({ cmd: 'admin.activity.touch' })
  async handleActivityTouch(
    @Payload() data: { userId: string; lastAction: string },
  ) {
    try {
      await this.activityService.touch(data.userId, data.lastAction);
      return { success: true, data: null, message: 'Activity updated' };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Activity update failed',
      };
    }
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
    try {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Event log failed',
      };
    }
  }

  @MessagePattern({ cmd: 'admin.support.create' })
  async handleSupportCreate(
    @Payload()
    data: { userId: string; message: string; type: 'BUG' | 'FEEDBACK' },
  ) {
    try {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Support ticket creation failed',
      };
    }
  }

  @MessagePattern({ cmd: 'admin.support.reply' })
  async handleSupportReply(
    @Payload()
    data: { adminUserId: string; ticketId: string; adminReply: string },
  ) {
    try {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Reply failed',
      };
    }
  }

  @MessagePattern({ cmd: 'admin.notification.instructorApplication' })
  async handleInstructorApplicationNotification(
    @Payload() data: { userId: string; message?: string },
  ) {
    try {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Notification failed',
      };
    }
  }

  @MessagePattern({ cmd: 'admin.notifications.list' })
  async handleNotificationsList(
    @Payload() data: { page?: number; limit?: number },
  ) {
    try {
      const result = await this.notificationsService.list(data ?? {});
      return {
        success: true,
        data: result,
        message: 'Notifications retrieved',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Notifications failed',
      };
    }
  }
}
