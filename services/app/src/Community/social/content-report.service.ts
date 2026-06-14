import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import { Types } from 'mongoose';
import { sanitizeText } from '../../common/utils/sanitize';
import { AutoModerationService } from './auto-moderation.service';
import type {
  ModerationResolutionAction,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from './moderation.constants';
import {
  MODERATION_RESOLUTION_ACTIONS,
  REPORT_REASONS,
  REPORT_STATUSES,
} from './moderation.constants';

const USER_PUBLIC = 'name email username profilePictureUrl role';

export type CreateReportInput = {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  groupId?: string;
};

@Injectable()
export class ContentReportService {
  private readonly log = new Logger('ContentReport');
  private readonly postModel: Model<any>;
  private readonly commentModel: Model<any>;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel('ContentReport')
    private readonly reportModel: Model<Record<string, unknown>>,
    @InjectModel('PlatformModerationAudit')
    private readonly auditModel: Model<Record<string, unknown>>,
    @InjectModel('PlatformUserSanction')
    private readonly sanctionModel: Model<Record<string, unknown>>,
    @InjectModel('GroupMessage')
    private readonly groupMessageModel: Model<Record<string, unknown>>,
    @InjectModel('CommunityGroup')
    private readonly groupModel: Model<Record<string, unknown>>,
    private readonly autoMod: AutoModerationService,
  ) {
    this.postModel = this.connection.model('Post');
    this.commentModel = this.connection.model('Comment');
  }

  private oid(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
    return new Types.ObjectId(id);
  }

  async createReport(input: CreateReportInput) {
    if (!REPORT_REASONS.includes(input.reason)) {
      throw new BadRequestException('Invalid report reason');
    }
    const desc = sanitizeText(input.description ?? '', { maxLength: 2000 });
    const existing = await this.reportModel.findOne({
      reporterId: this.oid(input.reporterId),
      targetType: input.targetType,
      targetId: input.targetId,
      status: { $in: ['OPEN', 'REVIEWING'] },
    });
    if (existing) {
      throw new BadRequestException('ALREADY_REPORTED');
    }

    const preview = await this.loadTargetPreview(
      input.targetType,
      input.targetId,
    );
    const auto = this.autoMod.evaluateText(
      `${preview.text} ${desc}`,
      { userId: input.reporterId, surface: 'report' },
    );

    const doc = await this.reportModel.create({
      reporterId: this.oid(input.reporterId),
      targetType: input.targetType,
      targetId: input.targetId,
      groupId: input.groupId ? this.oid(input.groupId) : null,
      reason: input.reason,
      description: desc,
      status: 'OPEN',
      autoModScore: auto.score,
      autoModFlags: auto.flags,
    });

    this.log.log(
      `[MODERATION_ACTION] report_created id=${String(doc._id)} target=${input.targetType}:${input.targetId}`,
    );

    return { report: doc.toObject(), preview, autoMod: auto };
  }

  async listAdminReports(opts: {
    status?: ReportStatus;
    targetType?: ReportTargetType;
    search?: string;
    page?: number;
    limit?: number;
    sort?: 'newest' | 'oldest' | 'score';
  }) {
    const page = Math.max(opts.page ?? 1, 1);
    const limit = Math.min(Math.max(opts.limit ?? 25, 1), 100);
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (opts.status) filter.status = opts.status;
    if (opts.targetType) filter.targetType = opts.targetType;
    if (opts.search?.trim()) {
      filter.$or = [
        { targetId: new RegExp(opts.search.trim(), 'i') },
        { description: new RegExp(opts.search.trim(), 'i') },
      ];
    }

    let sort: Record<string, 1 | -1>;
    if (opts.sort === 'oldest') {
      sort = { createdAt: 1 };
    } else if (opts.sort === 'score') {
      sort = { autoModScore: -1, createdAt: -1 };
    } else {
      sort = { createdAt: -1 };
    }

    const [items, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('reporterId', USER_PUBLIC)
        .populate('assignedModeratorId', USER_PUBLIC)
        .populate('resolvedBy', USER_PUBLIC)
        .lean(),
      this.reportModel.countDocuments(filter),
    ]);

    const enriched = await Promise.all(
      items.map(async (r) => {
        const row = r as Record<string, unknown>;
        const preview = await this.loadTargetPreview(
          String(row.targetType),
          String(row.targetId),
        );
        return { ...row, preview };
      }),
    );

    return {
      items: enriched,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async getAdminReport(reportId: string) {
    const report = await this.reportModel
      .findById(reportId)
      .populate('reporterId', USER_PUBLIC)
      .populate('assignedModeratorId', USER_PUBLIC)
      .populate('resolvedBy', USER_PUBLIC)
      .lean();
    if (!report) throw new NotFoundException('Report not found');
    const r = report as Record<string, unknown>;
    const preview = await this.loadTargetPreview(
      String(r.targetType),
      String(r.targetId),
    );
    const targetUserId = await this.resolveTargetUserId(
      String(r.targetType),
      String(r.targetId),
    );
    let userHistory: unknown[] = [];
    if (targetUserId) {
      userHistory = await this.auditModel
        .find({ targetUserId: this.oid(targetUserId) })
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();
    }
    return { report, preview, targetUserId, userHistory };
  }

  async updateReportStatus(
    reportId: string,
    moderatorId: string,
    status: ReportStatus,
  ) {
    if (!REPORT_STATUSES.includes(status)) {
      throw new BadRequestException('Invalid status');
    }
    const report = await this.reportModel.findByIdAndUpdate(
      reportId,
      {
        $set: {
          status,
          assignedModeratorId:
            status === 'REVIEWING' ? this.oid(moderatorId) : undefined,
        },
      },
      { new: true },
    );
    if (!report) throw new NotFoundException('Report not found');
    return report.toObject();
  }

  async applyReportAction(
    reportId: string,
    moderatorId: string,
    action: ModerationResolutionAction,
    notes?: string,
  ) {
    if (!MODERATION_RESOLUTION_ACTIONS.includes(action)) {
      throw new BadRequestException('Invalid action');
    }
    const report = await this.reportModel.findById(reportId);
    if (!report) throw new NotFoundException('Report not found');
    const r = report.toObject() as Record<string, unknown>;
    const targetType = String(r.targetType);
    const targetId = String(r.targetId);
    const groupId = r.groupId ? String(r.groupId) : undefined;

    if (
      action === 'TEMP_BAN' ||
      action === 'PERMANENT_BAN' ||
      action === 'TEMP_MUTE'
    ) {
      const targetUserId = await this.resolveTargetUserId(targetType, targetId);
      if (targetUserId && String(targetUserId) === String(moderatorId)) {
        throw new BadRequestException('CANNOT_MODERATE_SELF');
      }
    }

    const safeNotes = sanitizeText(notes ?? '', { maxLength: 2000 });
    let socketPayload: Record<string, unknown> = {
      reportId,
      action,
      targetType,
      targetId,
    };

    const preview = await this.loadTargetPreview(targetType, targetId);
    const resolvedGroupId =
      groupId ?? (preview as { groupId?: string | null }).groupId ?? undefined;

    switch (action) {
      case 'REMOVE_CONTENT':
        await this.removeContent(targetType, targetId, moderatorId, resolvedGroupId);
        socketPayload = {
          ...socketPayload,
          event: 'CONTENT_REMOVED',
          groupId: resolvedGroupId,
        };
        break;
      case 'WARN_USER':
        break;
      case 'TEMP_MUTE':
        await this.applyUserSanction(
          targetType,
          targetId,
          moderatorId,
          'MUTE',
          60 * 24,
          safeNotes,
          reportId,
        );
        socketPayload = { ...socketPayload, event: 'USER_MUTED' };
        break;
      case 'TEMP_BAN':
        await this.applyUserSanction(
          targetType,
          targetId,
          moderatorId,
          'SUSPEND',
          60 * 24 * 7,
          safeNotes,
          reportId,
        );
        break;
      case 'PERMANENT_BAN':
        await this.applyUserSanction(
          targetType,
          targetId,
          moderatorId,
          'BAN',
          null,
          safeNotes,
          reportId,
        );
        break;
      case 'NO_ACTION':
        break;
      default:
        break;
    }

    const targetUserId = await this.resolveTargetUserId(targetType, targetId);
    await this.auditModel.create({
      moderatorId: this.oid(moderatorId),
      action,
      entityType: 'REPORT',
      entityId: reportId,
      targetUserId: targetUserId ? this.oid(targetUserId) : null,
      reportId: this.oid(reportId),
      groupId: groupId ? this.oid(groupId) : null,
      reason: safeNotes,
      meta: { targetType, targetId },
    });

    await this.reportModel.updateOne(
      { _id: report._id },
      {
        $set: {
          status: 'RESOLVED',
          resolutionAction: action,
          resolutionNotes: safeNotes,
          resolvedAt: new Date(),
          resolvedBy: this.oid(moderatorId),
        },
      },
    );

    this.log.log(
      `[MODERATION_ACTION] moderatorId=${moderatorId} action=${action} entity=${targetType}:${targetId}`,
    );

    return { ok: true, socketPayload, targetUserId };
  }

  async isUserSanctioned(
    userId: string,
  ): Promise<{ blocked: boolean; type?: string; until?: Date | null }> {
    const now = new Date();
    const active = await this.sanctionModel
      .findOne({
        userId: this.oid(userId),
        active: true,
        $or: [{ until: null }, { until: { $gt: now } }],
      })
      .sort({ type: -1 })
      .lean();
    if (!active) return { blocked: false };
    const a = active as { type?: string; until?: Date | null };
    if (a.type === 'BAN' || a.type === 'SUSPEND') {
      return { blocked: true, type: a.type, until: a.until ?? null };
    }
    return { blocked: false, type: a.type };
  }

  private async applyUserSanction(
    targetType: string,
    targetId: string,
    moderatorId: string,
    type: 'MUTE' | 'SUSPEND' | 'BAN',
    minutes: number | null,
    reason: string,
    reportId: string,
  ) {
    const userId = await this.resolveTargetUserId(targetType, targetId);
    if (!userId) throw new BadRequestException('No target user');
    const until =
      minutes != null && minutes > 0
        ? new Date(Date.now() + minutes * 60 * 1000)
        : null;
    await this.sanctionModel.updateMany(
      { userId: this.oid(userId), active: true },
      { $set: { active: false } },
    );
    await this.sanctionModel.create({
      userId: this.oid(userId),
      type,
      until,
      reason,
      issuedBy: this.oid(moderatorId),
      active: true,
      reportId: this.oid(reportId),
    });
    const groupId = await this.resolveGroupId(targetType, targetId);
    if (groupId && type === 'MUTE') {
      const uid = this.oid(userId);
      const until =
        minutes != null && minutes > 0
          ? new Date(Date.now() + minutes * 60 * 1000)
          : null;
      await this.groupModel.updateOne(
        { _id: this.oid(groupId) },
        { $pull: { mutedMembers: { userId: uid } } },
      );
      await this.groupModel.updateOne(
        { _id: this.oid(groupId) },
        { $push: { mutedMembers: { userId: uid, until } } },
      );
    }
  }

  private async removeContent(
    targetType: string,
    targetId: string,
    moderatorId: string,
    groupId?: string,
  ) {
    if (targetType === 'POST' || targetType === 'REPOST') {
      if (groupId) {
        await this.postModel.updateOne(
          { _id: this.oid(targetId), groupId: this.oid(groupId) },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: this.oid(moderatorId),
              content: '[removed]',
              moderationState: 'REMOVED',
            },
          },
        );
      } else {
        await this.postModel.updateOne(
          { _id: this.oid(targetId) },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: this.oid(moderatorId),
              content: '[removed]',
              moderationState: 'REMOVED',
            },
          },
        );
      }
      return;
    }
    if (targetType === 'COMMENT') {
      await this.commentModel.updateOne(
        { _id: this.oid(targetId) },
        {
          $set: {
            isDeleted: true,
            content: '[removed]',
            moderationState: 'REMOVED',
          },
        },
      );
      return;
    }
    if (targetType === 'MESSAGE') {
      const gid =
        groupId ??
        (
          await this.groupMessageModel
            .findById(targetId)
            .select('groupId')
            .lean()
        )?.groupId;
      if (gid) {
        await this.groupMessageModel.updateOne(
          { _id: this.oid(targetId), groupId: this.oid(String(gid)) },
          {
            $set: {
              deletedAt: new Date(),
              text: '',
              shadowHidden: true,
            },
          },
        );
      }
    }
  }

  private async loadTargetPreview(targetType: string, targetId: string) {
    try {
      if (targetType === 'POST' || targetType === 'REPOST') {
        const post = await this.postModel
          .findById(targetId)
          .select('content author groupId isDeleted')
          .lean();
        if (!post) return { text: '', removed: true };
        const p = post as Record<string, unknown>;
        return {
          text: String(p.content ?? '').slice(0, 500),
          removed: !!p.isDeleted,
          authorId: p.author ? String(p.author) : null,
          groupId: p.groupId ? String(p.groupId) : null,
        };
      }
      if (targetType === 'COMMENT') {
        const c = await this.commentModel
          .findById(targetId)
          .select('content author isDeleted')
          .lean();
        if (!c) return { text: '', removed: true };
        const row = c as Record<string, unknown>;
        return {
          text: String(row.content ?? '').slice(0, 500),
          removed: !!row.isDeleted,
          authorId: row.author ? String(row.author) : null,
        };
      }
      if (targetType === 'MESSAGE') {
        const m = await this.groupMessageModel
          .findById(targetId)
          .select('text groupId deletedAt')
          .lean();
        if (!m) return { text: '', removed: true };
        const row = m as Record<string, unknown>;
        return {
          text: String(row.text ?? '').slice(0, 500),
          removed: !!row.deletedAt,
          groupId: row.groupId ? String(row.groupId) : null,
        };
      }
      if (targetType === 'USER') {
        return { text: `User ${targetId}`, removed: false };
      }
      if (targetType === 'GROUP') {
        return { text: `Group ${targetId}`, removed: false };
      }
    } catch {
      /* preview best-effort */
    }
    return { text: '', removed: false };
  }

  private async resolveTargetUserId(
    targetType: string,
    targetId: string,
  ): Promise<string | null> {
    if (targetType === 'USER') return targetId;
    const preview = await this.loadTargetPreview(targetType, targetId);
    return (preview as { authorId?: string | null }).authorId ?? null;
  }

  private async resolveGroupId(
    targetType: string,
    targetId: string,
  ): Promise<string | null> {
    const preview = await this.loadTargetPreview(targetType, targetId);
    return (preview as { groupId?: string | null }).groupId ?? null;
  }
}
