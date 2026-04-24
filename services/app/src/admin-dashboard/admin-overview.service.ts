import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as os from 'os';
import { User, UserDocument } from '../auth/schema/user.schema';
import {
  UserActivity,
  UserActivityDocument,
} from './schemas/user-activity.schema';
import { UserEvent, UserEventDocument } from './schemas/user-event.schema';
import {
  AdminSupportTicket,
  AdminSupportTicketDocument,
} from './schemas/admin-support-ticket.schema';
import {
  AdminNotification,
  AdminNotificationDocument,
} from './schemas/admin-notification.schema';

type SupportedRange = '24h' | '7d' | '30d' | 'custom';

@Injectable()
export class AdminOverviewService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserActivity.name)
    private readonly userActivityModel: Model<UserActivityDocument>,
    @InjectModel(UserEvent.name)
    private readonly userEventModel: Model<UserEventDocument>,
    @InjectModel(AdminSupportTicket.name)
    private readonly supportTicketModel: Model<AdminSupportTicketDocument>,
    @InjectModel(AdminNotification.name)
    private readonly notificationModel: Model<AdminNotificationDocument>,
  ) {}

  async getOverview(params: { range?: SupportedRange; customDate?: string }) {
    const now = new Date();
    const range = params.range ?? '24h';
    const rangeStart = this.getRangeStart(now, range, params.customDate);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const onlineThreshold = new Date(now.getTime() - 15 * 60 * 1000);
    const active24hThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeSessions,
      activeUsers24h,
      openTickets,
      ticketsToday,
      recentEvents,
      recentNotifications,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userActivityModel.countDocuments({ lastSeenAt: { $gte: onlineThreshold } }),
      this.userActivityModel.countDocuments({
        lastSeenAt: { $gte: active24hThreshold },
      }),
      this.supportTicketModel.countDocuments({ status: 'OPEN' }),
      this.supportTicketModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      this.userEventModel.find({ createdAt: { $gte: rangeStart } }).lean(),
      this.notificationModel.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const perf = this.buildPerformanceSeries(recentEvents, range, rangeStart, now);
    const avgResponseMs =
      perf.responseSamples > 0
        ? Math.round(perf.totalResponseMs / perf.responseSamples)
        : null;

    const uptimeSeconds = Math.floor(process.uptime());
    const loadAvg = os.loadavg()[0] ?? 0;
    const cpuCount = Math.max(1, os.cpus().length);
    const cpuPercent = Number(Math.min((loadAvg / cpuCount) * 100, 100).toFixed(1));
    const totalMemory = os.totalmem();
    const usedMemory = totalMemory - os.freemem();

    return {
      generatedAt: now.toISOString(),
      range: {
        key: range,
        from: rangeStart.toISOString(),
        to: now.toISOString(),
      },
      metrics: {
        totalUsers,
        activeSessions,
        ticketsToday,
        avgResponseMs,
        activeUsers24h,
      },
      quickStats: {
        uptimePercent: 99.9,
        uptimeSeconds,
        serverVersion: process.env.npm_package_version ?? 'unknown',
        avgResponseMs,
        activeUsers24h,
      },
      resources: {
        cpu: { usedPercent: cpuPercent, totalPercent: 100 },
        memory: { usedBytes: usedMemory, totalBytes: totalMemory },
        disk: null,
      },
      systemStatus: {
        api: 'operational',
        database:
          this.userModel.db.readyState === 1 ? 'operational' : 'degraded',
        authentication: 'operational',
        fileStorage: 'degraded',
        workers: 'operational',
      },
      performance: {
        responseTime: perf.responseTime,
        errorRate: perf.errorRate,
        requestStatus: perf.requestStatus,
      },
      recentActivity: recentNotifications.map((n) => ({
        id: String(n._id),
        type: n.type === 'NEW_SUPPORT' ? 'warning' : 'info',
        title:
          n.type === 'NEW_SUPPORT'
            ? 'New support ticket'
            : 'Instructor application',
        description: n.message,
        timestamp: n.createdAt,
      })),
      alerts: [
        ...(perf.globalErrorRate > 10
          ? [
              {
                id: 'high-error-rate',
                type: 'error',
                title: 'High Error Rate',
                description: `Error rate is ${perf.globalErrorRate.toFixed(1)}% for selected range`,
                timestamp: now,
              },
            ]
          : []),
        ...(openTickets > 15
          ? [
              {
                id: 'open-ticket-load',
                type: 'warning',
                title: 'Open Tickets Rising',
                description: `${openTickets} open support tickets need attention`,
                timestamp: now,
              },
            ]
          : []),
      ],
    };
  }

  private getRangeStart(now: Date, range: SupportedRange, customDate?: string) {
    if (range === 'custom' && customDate) {
      const custom = new Date(customDate);
      if (!Number.isNaN(custom.getTime())) return custom;
    }
    const start = new Date(now);
    if (range === '24h') start.setHours(start.getHours() - 24);
    else if (range === '7d') start.setDate(start.getDate() - 7);
    else start.setDate(start.getDate() - 30);
    return start;
  }

  private buildPerformanceSeries(
    events: Array<Record<string, unknown>>,
    range: SupportedRange,
    start: Date,
    end: Date,
  ) {
    const bucketMs = range === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const buckets = new Map<
      number,
      { responseSum: number; responseCount: number; total: number; errors: number }
    >();

    for (let t = start.getTime(); t <= end.getTime(); t += bucketMs) {
      buckets.set(t, { responseSum: 0, responseCount: 0, total: 0, errors: 0 });
    }

    let totalResponseMs = 0;
    let responseSamples = 0;
    let totalRequests = 0;
    let totalErrors = 0;
    let clientErrors = 0;
    let serverErrors = 0;

    for (const event of events) {
      const createdAtRaw = event.createdAt;
      const createdAt = createdAtRaw ? new Date(String(createdAtRaw)) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) continue;
      const bucketKey =
        Math.floor((createdAt.getTime() - start.getTime()) / bucketMs) * bucketMs +
        start.getTime();
      const bucket = buckets.get(bucketKey);
      if (!bucket) continue;

      const metadata = (event.metadata as Record<string, unknown>) ?? {};
      const statusCodeRaw = metadata.statusCode;
      const statusCode =
        typeof statusCodeRaw === 'number'
          ? statusCodeRaw
          : Number(statusCodeRaw ?? NaN);
      const responseTimeRaw = metadata.responseTimeMs;
      const responseTime =
        typeof responseTimeRaw === 'number'
          ? responseTimeRaw
          : Number(responseTimeRaw ?? NaN);

      if (!Number.isNaN(statusCode)) {
        bucket.total += 1;
        totalRequests += 1;
        if (statusCode >= 400) {
          bucket.errors += 1;
          totalErrors += 1;
          if (statusCode >= 500) serverErrors += 1;
          else clientErrors += 1;
        }
      }

      if (!Number.isNaN(responseTime)) {
        bucket.responseSum += responseTime;
        bucket.responseCount += 1;
        totalResponseMs += responseTime;
        responseSamples += 1;
      }
    }

    const responseTime = Array.from(buckets.entries()).map(([ts, bucket]) => ({
      x: new Date(ts).toISOString(),
      y: bucket.responseCount ? Math.round(bucket.responseSum / bucket.responseCount) : 0,
    }));

    const errorRate = Array.from(buckets.entries()).map(([ts, bucket]) => ({
      x: new Date(ts).toISOString(),
      y: bucket.total ? Number(((bucket.errors / bucket.total) * 100).toFixed(2)) : 0,
    }));

    const requestStatus = {
      success: Math.max(0, totalRequests - totalErrors),
      clientErrors,
      serverErrors,
      timeouts: 0,
    };

    return {
      responseTime,
      errorRate,
      requestStatus,
      totalResponseMs,
      responseSamples,
      globalErrorRate: totalRequests ? (totalErrors / totalRequests) * 100 : 0,
    };
  }
}
