import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schema/notification.schema';
import { EmailSenderService } from './email-sender.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { EmailVerificationNotificationDto } from './dto/email-verification-notification.dto';
import { PasswordResetNotificationDto } from './dto/password-reset-notification.dto';
import { WelcomeNotificationDto } from './dto/welcome-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly emailSender: EmailSenderService,
  ) {}

  async sendEmailVerification(
    payload: EmailVerificationNotificationDto,
  ): Promise<void> {
    const subject = 'Verify your email address';
    const html = `<p>Hello${payload.name ? ` ${payload.name}` : ''},</p>
      <p>Your verification code is: <strong>${payload.code}</strong></p>`;
    await this.emailSender.sendEmail({
      to: payload.email,
      subject,
      html,
    });
  }

  async sendPasswordResetCode(
    payload: PasswordResetNotificationDto,
  ): Promise<void> {
    const subject = 'Password reset code';
    const html = `<p>Hello${payload.name ? ` ${payload.name}` : ''},</p>
      <p>Your password reset code is: <strong>${payload.code}</strong></p>`;
    await this.emailSender.sendEmail({
      to: payload.email,
      subject,
      html,
    });
  }

  async sendWelcomeEmail(payload: WelcomeNotificationDto): Promise<void> {
    const subject = 'Welcome to Vonova';
    const html = `<p>Welcome${payload.name ? ` ${payload.name}` : ''}!</p>`;
    await this.emailSender.sendEmail({
      to: payload.email,
      subject,
      html,
    });
  }

  async createInAppNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationDocument> {
    const doc = new this.notificationModel({
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
      title: dto.title,
      message: dto.message,
      type: dto.type ?? 'system',
      data: dto.data ?? {},
      isRead: dto.isRead ?? false,
    });
    return doc.save();
  }

  async listUserNotifications(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationModel
      .updateOne({ _id: new Types.ObjectId(id) }, { $set: { isRead: true } })
      .exec();
  }
}
