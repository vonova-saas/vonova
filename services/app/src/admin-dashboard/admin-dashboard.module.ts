import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/schema/user.schema';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminActivityService } from './admin-activity.service';
import { UserEventService } from './user-event.service';
import { AdminSupportService } from './admin-support.service';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminUsersService } from './admin-users.service';
import { AdminOverviewService } from './admin-overview.service';
import { AdminMonitoringService } from './admin-monitoring.service';
import { AdminPerformanceService } from './admin-performance.service';
import { AdminUserManagementService } from './admin-user-management.service';
import { AdminSecurityLogsService } from './admin-security-logs.service';
import {
  UserActivity,
  UserActivitySchema,
} from './schemas/user-activity.schema';
import { UserEvent, UserEventSchema } from './schemas/user-event.schema';
import {
  AdminSupportTicket,
  AdminSupportTicketSchema,
} from './schemas/admin-support-ticket.schema';
import {
  AdminNotification,
  AdminNotificationSchema,
} from './schemas/admin-notification.schema';
import { Support, SupportSchema } from '../support/schema/support.schema';
import { Admin, AdminSchema } from '../admin-auth/schemas/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserActivity.name, schema: UserActivitySchema },
      { name: UserEvent.name, schema: UserEventSchema },
      { name: AdminSupportTicket.name, schema: AdminSupportTicketSchema },
      { name: AdminNotification.name, schema: AdminNotificationSchema },
      { name: Support.name, schema: SupportSchema },
    ]),
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }], 'adminConnection'),
  ],
  controllers: [AdminDashboardController],
  providers: [
    AdminActivityService,
    UserEventService,
    AdminSupportService,
    AdminNotificationsService,
    AdminUsersService,
    AdminOverviewService,
    AdminMonitoringService,
    AdminPerformanceService,
    AdminUserManagementService,
    AdminSecurityLogsService,
  ],
})
export class AdminDashboardModule {}
