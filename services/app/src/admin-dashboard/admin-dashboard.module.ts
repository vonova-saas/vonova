import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/schema/user.schema';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminActivityService } from './admin-activity.service';
import { UserEventService } from './user-event.service';
import { AdminSupportService } from './admin-support.service';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminUsersService } from './admin-users.service';
import { UserActivity, UserActivitySchema } from './schemas/user-activity.schema';
import { UserEvent, UserEventSchema } from './schemas/user-event.schema';
import {
  AdminSupportTicket,
  AdminSupportTicketSchema,
} from './schemas/admin-support-ticket.schema';
import {
  AdminNotification,
  AdminNotificationSchema,
} from './schemas/admin-notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserActivity.name, schema: UserActivitySchema },
      { name: UserEvent.name, schema: UserEventSchema },
      { name: AdminSupportTicket.name, schema: AdminSupportTicketSchema },
      { name: AdminNotification.name, schema: AdminNotificationSchema },
    ]),
  ],
  controllers: [AdminDashboardController],
  providers: [
    AdminActivityService,
    UserEventService,
    AdminSupportService,
    AdminNotificationsService,
    AdminUsersService,
  ],
})
export class AdminDashboardModule {}
