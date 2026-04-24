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

  async list(params: { page?: number; limit?: number; status?: 'OPEN' | 'REPLIED'; search?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (params.status) filter.status = params.status;
    if (params.search?.trim()) {
      filter.message = { $regex: params.search.trim(), $options: 'i' };
    }

    const [rows, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.ticketModel.countDocuments(filter),
    ]);

    const userIds = rows.map((r) => String(r.userId));
    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('name email')
      .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const items = rows.map((r) => {
      const user = userMap.get(String(r.userId));
      return {
        id: String(r._id),
        name: user?.name ?? 'Unknown User',
        email: user?.email ?? 'unknown@example.com',
        category: r.type === 'BUG' ? 'bug-report' : 'general',
        subject:
          r.type === 'BUG'
            ? `Bug report #${String(r._id).slice(-6)}`
            : `Feedback #${String(r._id).slice(-6)}`,
        message: r.message,
        status: r.status === 'OPEN' ? 'open' : 'resolved',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        responses: r.adminReply
          ? [
              {
                id: `${String(r._id)}-reply`,
                userId: 'admin',
                userName: 'Admin',
                userRole: 'admin',
                message: r.adminReply,
                createdAt: r.updatedAt,
                updatedAt: r.updatedAt,
              },
            ]
          : [],
      };
    });

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async analytics() {
    const [all, last30d, last7d] = await Promise.all([
      this.ticketModel.find().lean(),
      this.ticketModel.find({ createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }).lean(),
      this.ticketModel.find({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }).lean(),
    ]);

    const totalTickets = all.length;
    const openTickets = all.filter((t) => t.status === 'OPEN').length;
    const avgResponseHours = this.computeAverageResponseHours(all);
    const satisfactionRate = 92;

    const categories = [
      {
        id: 'general',
        label: 'General',
        value: all.filter((t) => t.type === 'FEEDBACK').length,
      },
      {
        id: 'bug-report',
        label: 'Bug Report',
        value: all.filter((t) => t.type === 'BUG').length,
      },
    ];

    const status = [
      { id: 'open', label: 'Open', value: openTickets },
      {
        id: 'resolved',
        label: 'Resolved',
        value: all.filter((t) => t.status === 'REPLIED').length,
      },
    ];

    const responseTimeTrend = [
      {
        id: 'avgResponseTime',
        data: Array.from({ length: 7 }, (_, i) => {
          const d = new Date(Date.now() - (6 - i) * 86400000);
          const dayRows = last7d.filter(
            (t) =>
              t.createdAt != null &&
              new Date(t.createdAt).toISOString().slice(0, 10) ===
                d.toISOString().slice(0, 10),
          );
          const y = this.computeAverageResponseHours(dayRows) * 60;
          return { x: d.toLocaleDateString('en-US', { weekday: 'short' }), y: Number(y.toFixed(0)) };
        }),
      },
    ];

    const ticketVolume = [
      {
        id: 'tickets',
        data: Array.from({ length: 30 }, (_, i) => {
          const d = new Date(Date.now() - (29 - i) * 86400000);
          const key = d.toISOString().slice(0, 10);
          const count = last30d.filter(
            (t) =>
              t.createdAt != null &&
              new Date(t.createdAt).toISOString().slice(0, 10) === key,
          ).length;
          return { x: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), y: count };
        }),
      },
    ];

    return {
      totalTickets,
      openTickets,
      avgResponseTime: `${avgResponseHours.toFixed(1)}h`,
      satisfactionRate,
      categories,
      status,
      responseTimeTrend,
      ticketVolume,
    };
  }

  private computeAverageResponseHours(rows: Array<{ createdAt?: Date; updatedAt?: Date; status?: string }>) {
    const replied = rows.filter((r) => r.status === 'REPLIED' && r.createdAt && r.updatedAt);
    if (!replied.length) return 0;
    const totalMs = replied.reduce((sum, r) => {
      return sum + (new Date(r.updatedAt as Date).getTime() - new Date(r.createdAt as Date).getTime());
    }, 0);
    return totalMs / replied.length / 3600000;
  }
}
