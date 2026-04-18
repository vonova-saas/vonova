import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AdminNotification,
  AdminNotificationDocument,
  AdminNotificationType,
} from './schemas/admin-notification.schema';

@Injectable()
export class AdminNotificationsService {
  constructor(
    @InjectModel(AdminNotification.name)
    private readonly notificationModel: Model<AdminNotificationDocument>,
  ) {}

  async createNewSupportNotification(
    userId: string,
    supportTicketId: string,
    preview: string,
  ) {
    return this.notificationModel.create({
      type: 'NEW_SUPPORT' satisfies AdminNotificationType,
      userId: new Types.ObjectId(userId),
      supportTicketId: new Types.ObjectId(supportTicketId),
      message: preview.slice(0, 500),
      isRead: false,
    });
  }

  async createInstructorApplicationNotification(
    userId: string,
    message: string,
  ) {
    return this.notificationModel.create({
      type: 'INSTRUCTOR_APPLICATION' satisfies AdminNotificationType,
      userId: new Types.ObjectId(userId),
      message: message.slice(0, 500),
      isRead: false,
    });
  }

  async list(params: { page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.notificationModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}
