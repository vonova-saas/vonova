import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../admin/schemas/user.schema';
import { AdminUsersService } from './admin-users.service';
import { AdminActivityModule } from '../admin-activity/admin-activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AdminActivityModule,
  ],
  providers: [AdminUsersService],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
