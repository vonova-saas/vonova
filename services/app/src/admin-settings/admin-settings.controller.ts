import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminSettingsService } from './admin-settings.service';

@Controller()
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @MessagePattern({ cmd: 'admin.settings.get' })
  getSettings(@Payload('adminId') adminId: string) {
    return this.adminSettingsService.getSettings(adminId);
  }

  @MessagePattern({ cmd: 'admin.settings.update' })
  updateSettings(
    @Payload('adminId') adminId: string,
    @Payload('update') update: {
      font?: string;
      fontSize?: string;
      theme?: 'light' | 'dark';
      language?: string;
    },
  ) {
    return this.adminSettingsService.updateSettings(adminId, update);
  }

  @MessagePattern({ cmd: 'admin.settings.reset' })
  resetSettings(@Payload('adminId') adminId: string) {
    return this.adminSettingsService.resetSettings(adminId);
  }

  @MessagePattern({ cmd: 'admin.notifications.get-settings' })
  getNotificationSettings(@Payload('adminId') adminId: string) {
    return this.adminSettingsService.getNotifications(adminId);
  }

  @MessagePattern({ cmd: 'admin.notifications.update-settings' })
  updateNotificationSettings(
    @Payload('adminId') adminId: string,
    @Payload('update') update: {
      notifyMe?: 'all' | 'mentions' | 'none';
      communicationEmails?: boolean;
      marketingEmails?: boolean;
      socialEmails?: boolean;
      securityEmails?: boolean;
    },
  ) {
    return this.adminSettingsService.updateNotifications(adminId, update);
  }

  @MessagePattern({ cmd: 'admin.notifications.reset-settings' })
  resetNotificationSettings(@Payload('adminId') adminId: string) {
    return this.adminSettingsService.resetNotifications(adminId);
  }

  @MessagePattern({ cmd: 'admin.account.get' })
  getAccount(@Payload('adminId') adminId: string) {
    return this.adminSettingsService.getAccount(adminId);
  }

  @MessagePattern({ cmd: 'admin.account.update' })
  updateAccount(
    @Payload('adminId') adminId: string,
    @Payload('update') update: {
      name?: string;
      bio?: string;
      address?: string;
      dateOfBirth?: string | null;
      file?: Express.Multer.File;
    },
  ) {
    return this.adminSettingsService.updateAccount(adminId, update);
  }
}
