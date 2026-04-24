import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schema/user.schema';
import { UserActivity, UserActivityDocument } from './schemas/user-activity.schema';
import { UserEvent, UserEventDocument } from './schemas/user-event.schema';

@Injectable()
export class AdminUserManagementService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserActivity.name)
    private readonly userActivityModel: Model<UserActivityDocument>,
    @InjectModel(UserEvent.name)
    private readonly userEventModel: Model<UserEventDocument>,
  ) {}

  async getOverview() {
    const now = new Date();
    const start30d = new Date(now);
    start30d.setDate(start30d.getDate() - 29);
    start30d.setHours(0, 0, 0, 0);

    const start7d = new Date(now);
    start7d.setDate(start7d.getDate() - 6);
    start7d.setHours(0, 0, 0, 0);

    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);

    const [users, activities, recentEvents, totalUsers] = await Promise.all([
      this.userModel.find().select('_id role createdAt name email').lean(),
      this.userActivityModel.find({ lastSeenAt: { $gte: start30d } }).lean(),
      this.userEventModel.find().sort({ createdAt: -1 }).limit(20).lean(),
      this.userModel.countDocuments(),
    ]);

    const activeByDate = new Map<string, Set<string>>();
    for (const activity of activities) {
      if (!activity.lastSeenAt) continue;
      const dateKey = new Date(activity.lastSeenAt).toISOString().slice(0, 10);
      if (!activeByDate.has(dateKey)) activeByDate.set(dateKey, new Set<string>());
      activeByDate.get(dateKey)?.add(String(activity.userId));
    }

    const createdByDate = new Map<string, number>();
    for (const user of users) {
      const dateKey = new Date(user.createdAt).toISOString().slice(0, 10);
      createdByDate.set(dateKey, (createdByDate.get(dateKey) ?? 0) + 1);
    }

    const userActivity = Array.from({ length: 30 }, (_, idx) => {
      const d = new Date(start30d);
      d.setDate(d.getDate() + idx);
      const key = d.toISOString().slice(0, 10);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        active: activeByDate.get(key)?.size ?? 0,
        newUsers: createdByDate.get(key) ?? 0,
      };
    });

    let adminCount = 0;
    let instructorCount = 0;
    let studentCount = 0;
    for (const user of users) {
      if (user.role === 'ADMIN') adminCount += 1;
      else if (user.role === 'INSTRUCTOR_USER') instructorCount += 1;
      else studentCount += 1;
    }

    const roleDistribution = [
      { id: 'admin', label: 'Admins', value: adminCount, color: '#3b82f6' },
      { id: 'instructor', label: 'Instructors', value: instructorCount, color: '#8b5cf6' },
      { id: 'student', label: 'Students', value: studentCount, color: '#10b981' },
    ];

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const timeline = recentEvents.slice(0, 10).map((evt, idx) => {
      const metadata = (evt.metadata ?? {}) as Record<string, unknown>;
      const userId = String(evt.userId ?? '');
      const actor = userMap.get(userId);
      return {
        id: String(evt._id ?? idx),
        type: this.eventType(metadata),
        title: String(metadata.message ?? evt.action ?? 'User action'),
        description: String(metadata.path ?? metadata.endpoint ?? ''),
        timestamp: new Date(evt.createdAt ?? now).toLocaleString(),
        user: {
          name: actor?.name ?? 'Unknown user',
          email: actor?.email ?? 'unknown@example.com',
        },
      };
    });

    const recentActivity = recentEvents.slice(0, 15).map((evt, idx) => {
      const metadata = (evt.metadata ?? {}) as Record<string, unknown>;
      const status = Number(metadata.statusCode ?? 200);
      return {
        id: String(evt._id ?? idx),
        action: String(metadata.message ?? evt.action ?? 'User action'),
        type: status >= 500 ? 'system' : status >= 400 ? 'message' : 'user',
        timestamp: new Date(evt.createdAt ?? now).toISOString(),
        details: String(metadata.path ?? metadata.endpoint ?? ''),
        ipAddress: typeof metadata.ip === 'string' ? metadata.ip : undefined,
      };
    });

    const activeToday = activities.filter((a) => (a.lastSeenAt ?? new Date(0)) >= startToday).length;
    const newThisWeek = users.filter((u) => u.createdAt >= start7d).length;

    return {
      userActivity,
      roleDistribution,
      timeline,
      recentActivity,
      quickStats: {
        totalUsers,
        activeToday,
        newThisWeek,
      },
    };
  }

  private eventType(metadata: Record<string, unknown>) {
    const status = Number(metadata.statusCode ?? 200);
    if (status >= 500) return 'warning' as const;
    if (status >= 400) return 'message' as const;
    const method = String(metadata.method ?? '').toUpperCase();
    if (method === 'POST') return 'purchase' as const;
    if (method === 'PATCH' || method === 'PUT') return 'account' as const;
    return 'login' as const;
  }
}
