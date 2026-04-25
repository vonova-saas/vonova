import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AdminSupportTicket,
  AdminSupportTicketDocument,
  AdminSupportType,
} from './schemas/admin-support-ticket.schema';
import { User, UserDocument } from '../auth/schema/user.schema';
import { Admin, AdminDocument } from '../admin-auth/schemas/admin.schema';
import { AdminNotificationsService } from './admin-notifications.service';
import { Support, SupportDocument } from '../support/schema/support.schema';

type SupportMessage = { sender?: string; message?: string; createdAt?: Date };

type SupportLean = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fullName: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  messages?: SupportMessage[];
  createdAt?: Date;
  updatedAt?: Date;
};

const MARK_RESOLVED_REPLY = 'Marked as resolved by admin.';

@Injectable()
export class AdminSupportService {
  constructor(
    @InjectModel(AdminSupportTicket.name)
    private readonly ticketModel: Model<AdminSupportTicketDocument>,
    @InjectModel(Support.name)
    private readonly supportModel: Model<SupportDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Admin.name, 'adminConnection')
    private readonly adminModel: Model<AdminDocument>,
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
    // Gateway sends the platform **Admin** document id (admin DB JWT `sub`), not `User._id`.
    const adminAccount = await this.adminModel.findById(adminUserId).select('_id').lean();
    if (!adminAccount) {
      throw new ForbiddenException('Admin access required');
    }

    const markResolved = adminReply === MARK_RESOLVED_REPLY;
    const nextStatus = markResolved ? 'resolved' : 'pending';

    const supportUpdated = await this.supportModel.findByIdAndUpdate(
      ticketId,
      {
        $push: {
          messages: { sender: 'admin', message: adminReply, createdAt: new Date() },
        },
        $set: { status: nextStatus, updatedAt: new Date() },
      },
      { new: true },
    );

    if (supportUpdated) {
      return supportUpdated;
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
    if (params.status === 'OPEN') {
      filter.status = { $in: ['open', 'pending'] };
    } else if (params.status === 'REPLIED') {
      filter.status = { $in: ['resolved', 'closed'] };
    }
    if (params.search?.trim()) {
      const s = params.search.trim();
      filter.$or = [
        { subject: { $regex: s, $options: 'i' } },
        { message: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { fullName: { $regex: s, $options: 'i' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.supportModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.supportModel.countDocuments(filter),
    ]);

    const supportRows = rows as SupportLean[];
    const userIds = [...new Set(supportRows.map((r) => String(r.userId)))];
    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('name email profilePictureUrl')
      .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const items = supportRows.map((r) => {
      const user = userMap.get(String(r.userId));
      return {
        id: String(r._id),
        name: r.fullName || user?.name || 'Unknown User',
        email: r.email || user?.email || 'unknown@example.com',
        category: r.category,
        subject: r.subject,
        message: r.message,
        status: this.mapSupportStatusToDashboard(r.status),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        userAvatarUrl: user?.profilePictureUrl ?? null,
        responses: this.mapSupportMessagesToResponses(r),
      };
    });

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async analytics() {
    const [all, last30d, last7d] = await Promise.all([
      this.supportModel.find().lean(),
      this.supportModel
        .find({ createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } })
        .lean(),
      this.supportModel
        .find({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } })
        .lean(),
    ]);

    const allRows = all as SupportLean[];
    const last30Rows = last30d as SupportLean[];
    const last7Rows = last7d as SupportLean[];

    const totalTickets = allRows.length;
    const openTickets = allRows.filter((t) => t.status === 'open' || t.status === 'pending').length;
    const avgResponseHours = this.computeAverageResponseHoursSupport(allRows);

    const categoryDefs: { id: string; label: string }[] = [
      { id: 'general', label: 'General' },
      { id: 'technical', label: 'Technical' },
      { id: 'billing', label: 'Billing' },
      { id: 'feature-request', label: 'Feature Request' },
      { id: 'bug-report', label: 'Bug Report' },
    ];
    const categories = categoryDefs.map((c) => ({
      id: c.id,
      label: c.label,
      value: allRows.filter((t) => t.category === c.id).length,
    }));

    const status = [
      { id: 'open', label: 'Open', value: allRows.filter((t) => t.status === 'open').length },
      {
        id: 'in-progress',
        label: 'In Progress',
        value: allRows.filter((t) => t.status === 'pending').length,
      },
      {
        id: 'resolved',
        label: 'Resolved',
        value: allRows.filter((t) => t.status === 'resolved').length,
      },
      { id: 'closed', label: 'Closed', value: allRows.filter((t) => t.status === 'closed').length },
    ];

    const responseTimeTrend = [
      {
        id: 'avgResponseTime',
        data: Array.from({ length: 7 }, (_, i) => {
          const d = new Date(Date.now() - (6 - i) * 86400000);
          const dayKey = d.toISOString().slice(0, 10);
          const dayRows = last7Rows.filter(
            (t) =>
              t.createdAt != null &&
              new Date(t.createdAt).toISOString().slice(0, 10) === dayKey,
          );
          const y = this.computeAverageResponseHoursSupport(dayRows) * 60;
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
          const count = last30Rows.filter(
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
      satisfactionRate: 92,
      categories,
      status,
      responseTimeTrend,
      ticketVolume,
    };
  }

  private mapSupportStatusToDashboard(
    s: string,
  ): 'open' | 'in-progress' | 'resolved' | 'closed' {
    if (s === 'pending') return 'in-progress';
    if (s === 'open') return 'open';
    if (s === 'resolved') return 'resolved';
    if (s === 'closed') return 'closed';
    return 'open';
  }

  private mapSupportMessagesToResponses(r: SupportLean) {
    const msgs = r.messages || [];
    return msgs.map((m, i) => {
      const isAdmin = m.sender === 'admin';
      return {
        id: `${String(r._id)}-msg-${i}`,
        userId: isAdmin ? 'admin' : String(r.userId),
        userName: isAdmin ? 'Admin' : r.fullName || 'User',
        userRole: isAdmin ? ('admin' as const) : ('user' as const),
        message: m.message ?? '',
        createdAt: m.createdAt ?? r.updatedAt ?? r.createdAt,
        updatedAt: m.createdAt ?? r.updatedAt ?? r.createdAt,
      };
    });
  }

  private computeAverageResponseHoursSupport(rows: SupportLean[]) {
    const hours: number[] = [];
    for (const r of rows) {
      const msgs = r.messages || [];
      const firstAdmin = msgs.find((m) => m.sender === 'admin');
      if (!firstAdmin?.createdAt || !r.createdAt) continue;
      hours.push(
        (new Date(firstAdmin.createdAt).getTime() - new Date(r.createdAt).getTime()) / 3600000,
      );
    }
    if (!hours.length) return 0;
    return hours.reduce((a, b) => a + b, 0) / hours.length;
  }
}
