import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEvent, UserEventDocument } from './schemas/user-event.schema';

type SecurityRange = '24h' | '7d' | '30d' | 'custom';
type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low';

type RawEvent = {
  _id: unknown;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};

type SecurityRow = {
  id: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  method: string;
  route: string;
  attackType: string;
  severity: SecuritySeverity;
  statusCode: number;
  responseTime: number;
  source: string;
  details: {
    origin?: string;
    query?: Record<string, unknown>;
    body?: unknown;
    responseBody?: unknown;
    message?: string;
  };
};

@Injectable()
export class AdminSecurityLogsService {
  constructor(
    @InjectModel(UserEvent.name)
    private readonly userEventModel: Model<UserEventDocument>,
  ) {}

  async getSecurityLogs(params: {
    range?: SecurityRange;
    customDate?: string;
    search?: string;
    limit?: number;
  }) {
    const now = new Date();
    const range = params.range ?? '24h';
    const from = this.getRangeStart(now, range, params.customDate);
    const limit = Math.min(300, Math.max(20, params.limit ?? 120));

    const filter: Record<string, unknown> = {
      createdAt: { $gte: from, $lte: now },
    };
    if (params.search?.trim()) {
      filter.$or = [
        { action: { $regex: params.search.trim(), $options: 'i' } },
        { 'metadata.message': { $regex: params.search.trim(), $options: 'i' } },
      ];
    }

    const rows = (await this.userEventModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(2500)
      .lean()) as unknown as RawEvent[];

    const securityRows: SecurityRow[] = rows
      .map((row) => {
        const metadata = row.metadata ?? {};
        const statusCode = this.toNumber(metadata.statusCode) ?? 200;
        const attackType = this.detectAttackType(row.action, metadata);
        const severity = this.detectSeverity(statusCode, attackType);
        return {
          id: String(row._id),
          timestamp: row.createdAt,
          ip:
            this.getString(metadata.ip) ||
            this.getString(metadata.ipAddress) ||
            'unknown',
          userAgent: this.getString(metadata.userAgent) || 'N/A',
          method: this.getString(metadata.method) || 'GET',
          route:
            this.getString(metadata.route) ||
            this.getString(metadata.path) ||
            '/unknown',
          attackType,
          severity,
          statusCode,
          responseTime: this.toNumber(metadata.responseTimeMs) ?? 0,
          source: this.getString(metadata.source) || 'api-gateway',
          details: {
            origin: this.getString(metadata.origin),
            query: this.asRecord(metadata.query),
            body: metadata.body,
            responseBody: metadata.responseBody,
            message: this.getString(metadata.message) || row.action,
          },
        };
      })
      .filter((row) => row.attackType !== 'Other');

    const logs = securityRows.slice(0, limit);
    const alerts = logs
      .filter((row) => row.severity !== 'low')
      .map((row) => ({
        id: row.id,
        title: `${row.attackType} detected`,
        description:
          row.details.message || `Suspicious request on ${row.route}`,
        timestamp: row.timestamp.toISOString(),
        status: row.severity === 'critical' ? 'unread' : 'in-progress',
        severity: row.severity,
        type: this.alertTypeFromAttack(row.attackType),
        source: row.source,
        affected: row.route,
      }))
      .slice(0, 60);

    const bySeverity = { high: 0, medium: 0, low: 0, critical: 0 };
    const byAttack = new Map<string, number>();
    let blocked = 0;
    for (const row of securityRows) {
      byAttack.set(row.attackType, (byAttack.get(row.attackType) ?? 0) + 1);
      if (row.statusCode >= 400) blocked += 1;
      if (row.severity === 'critical') bySeverity.critical += 1;
      else if (row.severity === 'high') bySeverity.high += 1;
      else if (row.severity === 'medium') bySeverity.medium += 1;
      else bySeverity.low += 1;
    }

    const eventsByBucket = this.buildEventBuckets(
      securityRows,
      from,
      now,
      range,
    );

    return {
      generatedAt: now.toISOString(),
      range: { key: range, from: from.toISOString(), to: now.toISOString() },
      summary: {
        totalEvents: securityRows.length,
        blocked,
        risk: {
          high: bySeverity.high + bySeverity.critical,
          medium: bySeverity.medium,
          low: bySeverity.low,
        },
      },
      logs: logs.map((row) => ({
        ...row,
        timestamp: row.timestamp.toISOString(),
      })),
      alerts,
      metrics: {
        riskCards: {
          high: bySeverity.high + bySeverity.critical,
          medium: bySeverity.medium,
          low: bySeverity.low,
          blocked,
        },
        eventsSeries: eventsByBucket,
        attackTypes: Array.from(byAttack.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([id, value]) => ({ id, label: id, value })),
      },
    };
  }

  private getRangeStart(now: Date, range: SecurityRange, customDate?: string) {
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

  private detectAttackType(action: string, metadata: Record<string, unknown>) {
    const raw = `${action} ${
      this.getString(metadata.message) ?? ''
    } ${this.getString(metadata.route) ?? ''} ${JSON.stringify(
      metadata.query ?? {},
    )}`.toLowerCase();
    if (raw.includes('sql')) return 'SQL Injection';
    if (raw.includes('xss')) return 'XSS Attempts';
    if (raw.includes('brute') || raw.includes('failed login'))
      return 'Brute Force';
    if (raw.includes('cors')) return 'CORS Issues';
    if (raw.includes('unauthorized') || raw.includes('forbidden'))
      return 'Unauthorized Access';
    if ((this.toNumber(metadata.statusCode) ?? 200) >= 400)
      return 'Suspicious Request';
    return 'Other';
  }

  private detectSeverity(
    statusCode: number,
    attackType: string,
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (attackType === 'SQL Injection') return 'critical';
    if (attackType === 'Brute Force' || statusCode >= 500) return 'high';
    if (statusCode >= 400 || attackType === 'CORS Issues') return 'medium';
    return 'low';
  }

  private alertTypeFromAttack(attackType: string) {
    if (attackType === 'SQL Injection') return 'suspicious' as const;
    if (attackType === 'Brute Force') return 'threat' as const;
    if (attackType === 'CORS Issues') return 'warning' as const;
    return 'info' as const;
  }

  private toNumber(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const n = Number(value.replace('ms', '').trim());
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  private getString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private buildEventBuckets(
    rows: Array<{
      timestamp: Date;
      severity: SecuritySeverity;
    }>,
    from: Date,
    to: Date,
    range: SecurityRange,
  ) {
    const bucketMs = range === '24h' ? 4 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const buckets = new Map<
      number,
      { label: string; high: number; medium: number; low: number }
    >();
    for (let t = from.getTime(); t <= to.getTime(); t += bucketMs) {
      const d = new Date(t);
      const label =
        range === '24h'
          ? `${d.getHours().toString().padStart(2, '0')}:00`
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets.set(t, { label, high: 0, medium: 0, low: 0 });
    }
    for (const row of rows) {
      const key =
        Math.floor((row.timestamp.getTime() - from.getTime()) / bucketMs) *
          bucketMs +
        from.getTime();
      const bucket = buckets.get(key);
      if (!bucket) continue;
      if (row.severity === 'critical' || row.severity === 'high')
        bucket.high += 1;
      else if (row.severity === 'medium') bucket.medium += 1;
      else bucket.low += 1;
    }
    return Array.from(buckets.values()).map((b) => ({
      label: b.label,
      high: b.high,
      medium: b.medium,
      low: b.low,
    }));
  }
}
