import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { EmailVerificationNotificationDto } from './dto/email-verification-notification.dto';
import { PasswordResetNotificationDto } from './dto/password-reset-notification.dto';
import { WelcomeNotificationDto } from './dto/welcome-notification.dto';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Auth-related email notifications
  @EventPattern('notification.auth.email_verification')
  async handleEmailVerification(
    @Payload() payload: EmailVerificationNotificationDto,
  ) {
    await this.notificationService.sendEmailVerification(payload);
  }

  @EventPattern('notification.auth.password_reset_requested')
  async handlePasswordResetRequested(
    @Payload() payload: PasswordResetNotificationDto,
  ) {
    await this.notificationService.sendPasswordResetCode(payload);
  }

  @EventPattern('notification.auth.welcome')
  async handleWelcomeEmail(@Payload() payload: WelcomeNotificationDto) {
    await this.notificationService.sendWelcomeEmail(payload);
  }

  // Generic in-app dashboard notifications
  @EventPattern('notification.dashboard.generic')
  async handleGenericInApp(@Payload() payload: CreateNotificationDto) {
    return this.notificationService.createInAppNotification(payload);
  }
}
