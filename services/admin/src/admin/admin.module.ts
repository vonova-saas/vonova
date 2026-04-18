import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { AdminActivityModule } from '../admin-activity/admin-activity.module';
import { UserEventModule } from '../user-event/user-event.module';
import { AdminNotificationsModule } from '../admin-notifications/admin-notifications.module';
import { AdminSupportModule } from '../admin-support/admin-support.module';
import { AdminDashboardController } from '../admin-dashboard/admin-dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule,
    AdminUsersModule,
    AdminActivityModule,
    UserEventModule,
    AdminNotificationsModule,
    AdminSupportModule,
  ],
  controllers: [AdminController, AdminDashboardController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
