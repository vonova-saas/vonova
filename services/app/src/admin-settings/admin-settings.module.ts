import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from '../admin-auth/schemas/admin.schema';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';
import {
  AdminSettings,
  AdminSettingsSchema,
} from './schemas/admin-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Admin.name, schema: AdminSchema },
        { name: AdminSettings.name, schema: AdminSettingsSchema },
      ],
      'adminConnection',
    ),
  ],
  controllers: [AdminSettingsController],
  providers: [AdminSettingsService],
})
export class AdminSettingsModule {}
