import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AdminSupportTicket,
  AdminSupportTicketDocument,
  AdminSupportType,
} from './schemas/admin-support-ticket.schema';
import { User, UserDocument } from '../auth/schema/user.schema';
import { Role } from '../auth/enums/role.enum';
import { AdminNotificationsService } from './admin-notifications.service';

@Injectable()
export class AdminSupportService {
  constructor(
    @InjectModel(AdminSupportTicket.name)
    private readonly ticketModel: Model<AdminSupportTicketDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: AdminNotificationsService,
  ) {}

  async create(userId: string, message: string, type: AdminSupportType) {
    const ticket = await this.ticketModel.create({
      userId: new Types.ObjectId(userId),
      message,
      type,
      status: 'OPEN',
    });

    const preview = `New ${type} report: ${message}`.slice(0, 200);
    await this.notificationsService.createNewSupportNotification(
      userId,
      String(ticket._id),
      preview,
    );

    return ticket;
  }

  async reply(adminUserId: string, ticketId: string, adminReply: string) {
    const admin = await this.userModel.findById(adminUserId);
    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    const ticket = await this.ticketModel.findByIdAndUpdate(
      ticketId,
      {
        $set: {
          adminReply,
          status: 'REPLIED',
        },
      },
      { new: true },
    );

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }
}
