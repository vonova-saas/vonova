import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminSupportTicket,
  AdminSupportTicketSchema,
} from './schemas/admin-support-ticket.schema';
import { AdminSupportService } from './admin-support.service';
import { AdminNotificationsModule } from '../admin-notifications/admin-notifications.module';
import { User, UserSchema } from '../admin/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminSupportTicket.name, schema: AdminSupportTicketSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AdminNotificationsModule,
  ],
  providers: [AdminSupportService],
  exports: [AdminSupportService],
})
export class AdminSupportModule {}
