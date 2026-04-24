import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEvent, UserEventDocument } from './schemas/user-event.schema';
import { UserActivity, UserActivityDocument } from './schemas/user-activity.schema';
import { User, UserDocument } from '../auth/schema/user.schema';

type MonitoringRange = '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | 'custom';
type LogLevel = 'error' | 'warning' | 'info' | 'debug' | 'trace';

@Injectable()
export class AdminMonitoringService {
  constructor(
    @InjectModel(UserEvent.name)
    private readonly userEventModel: Model<UserEventDocument>,
    @InjectModel(UserActivity.name)
    private readonly userActivityModel: Model<UserActivityDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getMonitoring(params: {
    range?: MonitoringRange;
    customDate?: string;
    search?: string;
    levels?: LogLevel[];
    sources?: string[];
    limit?: number;
  }) {
    const now = new Date();
    const range = params.range ?? '1h';
    const from = this.getRangeStart(now, range, params.customDate);
    const limit = Math.min(200, Math.max(10, params.limit ?? 50));

    const baseFilter: Record<string, unknown> = {
      createdAt: { $gte: from, $lte: now },
    };

    if (params.search?.trim()) {
      baseFilter.action = { $regex: params.search.trim(), $options: 'i' };
    }

    const rawEvents = await this.userEventModel
      .find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean();

    const mappedLogs = rawEvents.map((evt) => {
      const metadata = (evt.metadata ?? {}) as Record<string, unknown>;
      const statusCode = this.asNumber(metadata.statusCode);
      const level = this.pickLevel(metadata.level, statusCode);
      const source =
        typeof metadata.source === 'string' && metadata.source.trim()
          ? metadata.source
          : 'api-gateway';
      return {
        id: String(evt._id),
        timestamp: evt.createdAt ?? now,
        level,
        message:
          (typeof metadata.message === 'string' && metadata.message) || evt.action,
        source,
        context: metadata,
        stackTrace:
          typeof metadata.stackTrace === 'string' ? metadata.stackTrace : undefined,
        statusCode,
        responseTimeMs: this.asNumber(metadata.responseTimeMs),
      };
    });

    const filteredLogs = mappedLogs.filter((log) => {
      if (params.levels?.length && !params.levels.includes(log.level)) return false;
      if (params.sources?.length && !params.sources.includes(log.source)) return false;
      if (!params.search?.trim()) return true;
      const q = params.search.trim().toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.source.toLowerCase().includes(q) ||
        JSON.stringify(log.context ?? {}).toLowerCase().includes(q)
      );
    });

    const logs = filteredLogs.slice(0, limit);
    const totalLogs = filteredLogs.length;
    const errorCount = filteredLogs.filter((l) => l.level === 'error').length;
    const avgResponseMs = this.avg(
      filteredLogs.map((l) => l.responseTimeMs).filter((n): n is number => n != null),
    );
    const activeUsers = await this.userActivityModel.countDocuments({
      lastSeenAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    });
    const totalUsers = await this.userModel.countDocuments();

    const statsByLevel = {
      error: filteredLogs.filter((l) => l.level === 'error').length,
      warning: filteredLogs.filter((l) => l.level === 'warning').length,
      info: filteredLogs.filter((l) => l.level === 'info').length,
      debug: filteredLogs.filter((l) => l.level === 'debug').length,
      trace: filteredLogs.filter((l) => l.level === 'trace').length,
    };

    const sources = Object.entries(
      filteredLogs.reduce<Record<string, number>>((acc, log) => {
        acc[log.source] = (acc[log.source] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([id, logCount]) => ({
      id,
      name: id,
      type: 'service' as const,
      logCount,
      lastUpdated: now,
    }));

    const perf = this.buildPerfSeries(filteredLogs, range, from, now);
    const alerts = this.buildAlerts({
      errorRate: perf.errorRateGlobal,
      avgResponseMs: avgResponseMs ?? 0,
      errorCount,
    });

    return {
      generatedAt: now.toISOString(),
      range: { key: range, from: from.toISOString(), to: now.toISOString() },
      summary: {
        totalLogs,
        errors: errorCount,
        avgResponseMs,
        activeUsers,
        totalUsers,
      },
      logs,
      sources,
      statsByLevel,
      metrics: {
        responseTime: perf.responseTime,
        errorRate: perf.errorRate,
        requestVolume: perf.requestVolume,
        requestDistribution: perf.requestDistribution,
      },
      alerts,
    };
  }

  private getRangeStart(now: Date, range: MonitoringRange, customDate?: string) {
    if (range === 'custom' && customDate) {
      const custom = new Date(customDate);
      if (!Number.isNaN(custom.getTime())) return custom;
    }
    const start = new Date(now);
    if (range === '5m') start.setMinutes(start.getMinutes() - 5);
    else if (range === '15m') start.setMinutes(start.getMinutes() - 15);
    else if (range === '1h') start.setHours(start.getHours() - 1);
    else if (range === '6h') start.setHours(start.getHours() - 6);
    else if (range === '24h') start.setHours(start.getHours() - 24);
    else start.setDate(start.getDate() - 7);
    return start;
  }

  private pickLevel(rawLevel: unknown, statusCode: number | null): LogLevel {
    if (
      rawLevel === 'error' ||
      rawLevel === 'warning' ||
      rawLevel === 'info' ||
      rawLevel === 'debug' ||
      rawLevel === 'trace'
    ) {
      return rawLevel;
    }
    if (statusCode != null && statusCode >= 500) return 'error';
    if (statusCode != null && statusCode >= 400) return 'warning';
    return 'info';
  }

  private asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value.replace('ms', '').trim());
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private avg(values: number[]) {
    if (!values.length) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  private buildPerfSeries(
    logs: Array<{
      timestamp: Date;
      statusCode: number | null;
      responseTimeMs: number | null;
    }>,
    range: MonitoringRange,
    from: Date,
    to: Date,
  ) {
    const bucketMs =
      range === '5m' || range === '15m' || range === '1h' || range === '6h'
        ? 5 * 60 * 1000
        : 60 * 60 * 1000;
    const buckets = new Map<
      number,
      { count: number; errors: number; responseSum: number; responseCount: number }
    >();
    for (let t = from.getTime(); t <= to.getTime(); t += bucketMs) {
      buckets.set(t, { count: 0, errors: 0, responseSum: 0, responseCount: 0 });
    }
    let totalReq = 0;
    let totalErrors = 0;
    const distribution = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };

    for (const log of logs) {
      const key =
        Math.floor((log.timestamp.getTime() - from.getTime()) / bucketMs) * bucketMs +
        from.getTime();
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.count += 1;
      totalReq += 1;

      if (log.statusCode != null) {
        if (log.statusCode >= 500) distribution['5xx'] += 1;
        else if (log.statusCode >= 400) distribution['4xx'] += 1;
        else if (log.statusCode >= 300) distribution['3xx'] += 1;
        else distribution['2xx'] += 1;
      } else {
        distribution['2xx'] += 1;
      }

      if ((log.statusCode ?? 200) >= 400) {
        bucket.errors += 1;
        totalErrors += 1;
      }
      if (log.responseTimeMs != null) {
        bucket.responseSum += log.responseTimeMs;
        bucket.responseCount += 1;
      }
    }

    return {
      responseTime: Array.from(buckets.entries()).map(([ts, b]) => ({
        x: new Date(ts).toISOString(),
        y: b.responseCount ? Math.round(b.responseSum / b.responseCount) : 0,
      })),
      errorRate: Array.from(buckets.entries()).map(([ts, b]) => ({
        x: new Date(ts).toISOString(),
        y: b.count ? Number(((b.errors / b.count) * 100).toFixed(2)) : 0,
      })),
      requestVolume: Array.from(buckets.entries()).map(([ts, b]) => ({
        x: new Date(ts).toISOString(),
        y: b.count,
      })),
      requestDistribution: [
        { id: '2xx', label: '2xx', value: distribution['2xx'] },
        { id: '3xx', label: '3xx', value: distribution['3xx'] },
        { id: '4xx', label: '4xx', value: distribution['4xx'] },
        { id: '5xx', label: '5xx', value: distribution['5xx'] },
      ],
      errorRateGlobal: totalReq ? (totalErrors / totalReq) * 100 : 0,
    };
  }

  private buildAlerts(params: {
    errorRate: number;
    avgResponseMs: number;
    errorCount: number;
  }) {
    const now = new Date();
    const alerts: Array<{
      id: string;
      title: string;
      description: string;
      severity: 'critical' | 'warning';
      triggeredAt: string;
    }> = [];
    if (params.errorRate >= 5) {
      alerts.push({
        id: 'high-error-rate',
        title: 'High Error Rate Detected',
        description: `Error rate reached ${params.errorRate.toFixed(2)}%`,
        severity: params.errorRate >= 10 ? 'critical' : 'warning',
        triggeredAt: now.toISOString(),
      });
    }
    if (params.avgResponseMs >= 500) {
      alerts.push({
        id: 'response-time-degraded',
        title: 'API Response Time Degraded',
        description: `Average response time is ${params.avgResponseMs}ms`,
        severity: params.avgResponseMs >= 800 ? 'critical' : 'warning',
        triggeredAt: now.toISOString(),
      });
    }
    if (params.errorCount >= 20) {
      alerts.push({
        id: 'error-burst',
        title: 'Error Burst Detected',
        description: `${params.errorCount} error logs in selected window`,
        severity: 'warning',
        triggeredAt: now.toISOString(),
      });
    }
    return alerts;
  }
}
