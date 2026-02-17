import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { UserSettings } from './schema/settings.schema';
import UserSettingsSchema from './schema/settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSettings.name, schema: UserSettingsSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
