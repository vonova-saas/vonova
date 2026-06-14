import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Inject, Optional } from '@nestjs/common';
import type {
  ModerationActionKind,
  ModerationCategory,
  ModerationSeverity,
  ModerationTarget,
} from './schemas/moderation-result.schema';

export interface AiModerationVerdict {
  categories: ModerationCategory[];
  confidence: number;
  severity: ModerationSeverity;
  action: ModerationActionKind;
  reasons: string[];
}

interface ModerationJob {
  targetType: ModerationTarget;
  targetId: string;
  userId?: string | null;
  text: string;
}

/**
 * Heuristic moderation provider. Returns a deterministic verdict for a piece
 * of text so the rest of the system stays decoupled from any specific AI
 * vendor. A drop-in OpenAI / Perspective / Azure adapter can replace
 * `evaluateText` later without touching consumers.
 */
@Injectable()
export class AiModerationService {
  private readonly logger = new Logger(AiModerationService.name);
  private readonly queue: ModerationJob[] = [];
  private worker: NodeJS.Timeout | null = null;
  private readonly maxConcurrent = 2;
  private inFlight = 0;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel('CommunityModerationResult')
    private readonly resultModel: Model<any>,
    @Optional()
    @Inject('NATS_OUTBOUND')
    private readonly natsClient?: ClientProxy,
  ) {
    this.startWorker();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Evaluate a string of user-generated content. Synchronous and side-effect
   * free; safe to call from hot paths to make pre-publish decisions.
   */
  evaluateText(input: string): AiModerationVerdict {
    const text = String(input ?? '').slice(0, 8000);
    if (!text.trim()) {
      return {
        categories: [],
        confidence: 0,
        severity: 'LOW',
        action: 'ALLOW',
        reasons: [],
      };
    }

    const lower = text.toLowerCase();
    const hits = new Set<ModerationCategory>();
    const reasons: string[] = [];
    let score = 0;

    const has = (re: RegExp, cat: ModerationCategory, weight: number, label: string) => {
      if (re.test(lower)) {
        hits.add(cat);
        score += weight;
        reasons.push(label);
      }
    };

    // Profanity / toxicity (sample list — replace with a vendor classifier in prod).
    has(
      /\b(fuck|shit|bitch|asshole|cunt|bastard|dick|piss off)\b/,
      'TOXICITY',
      0.25,
      'profanity',
    );
    has(/\b(idiot|stupid|dumb|loser|moron|retard)\b/, 'HARASSMENT', 0.2, 'insult');

    // Hate speech proxy (very conservative, single-word matches only).
    has(
      /\b(nigger|fag|kike|spic|chink|tranny|gook)\b/,
      'HATE_SPEECH',
      0.9,
      'slur',
    );

    // Self-harm signals.
    has(
      /\b(kill myself|suicide|end my life|cut myself)\b/,
      'SELF_HARM',
      0.7,
      'self-harm phrase',
    );
    has(/\b(kill (you|him|her|them)|i('| a)?m gonna kill)\b/, 'VIOLENCE', 0.65, 'threat');

    // NSFW heuristic.
    has(/\b(porn|nude pics|onlyfans|xxx|sex chat)\b/, 'NSFW', 0.45, 'NSFW signal');

    // Spam / phishing.
    const linkCount = (lower.match(/https?:\/\//g) ?? []).length;
    if (linkCount >= 3) {
      hits.add('SPAM');
      score += 0.4;
      reasons.push(`${linkCount} links`);
    }
    has(
      /\b(free crypto|click here|earn \$\d|whatsapp\s*\+\d|telegram\s*@\w+)\b/i,
      'PHISHING',
      0.55,
      'phishing pattern',
    );
    if (/(.)\1{6,}/.test(lower)) {
      hits.add('SPAM');
      score += 0.2;
      reasons.push('character flood');
    }
    if ((lower.match(/[A-Z]/g)?.length ?? 0) > 30 && text === text.toUpperCase()) {
      hits.add('SPAM');
      score += 0.15;
      reasons.push('all-caps');
    }

    has(/\b(buy a gun|black market|cocaine|fentanyl)\b/, 'ILLEGAL', 0.6, 'illegal');
    has(/\b(jihad|behead|terrorist attack|isis)\b/, 'EXTREMIST', 0.6, 'extremist');

    const confidence = Math.min(1, Math.max(0, score));
    const categories = Array.from(hits);

    let severity: ModerationSeverity = 'LOW';
    let action: ModerationActionKind = 'ALLOW';
    if (confidence >= 0.85 || hits.has('HATE_SPEECH') || hits.has('SELF_HARM')) {
      severity = 'CRITICAL';
      action = 'DELETE';
    } else if (confidence >= 0.55 || hits.has('PHISHING')) {
      severity = 'HIGH';
      action = hits.has('SPAM') ? 'SHADOW_BLOCK' : 'FLAG';
    } else if (confidence >= 0.3 || hits.has('SPAM')) {
      severity = 'MEDIUM';
      action = 'FLAG';
    }

    return { categories, confidence, severity, action, reasons };
  }

  /**
   * Convenience: evaluate text and persist a moderation result record. Returns
   * the verdict so callers can apply policy synchronously. Heavy-weight AI
   * providers should run via {@link enqueue} instead.
   */
  async moderateText(
    target: ModerationTarget,
    targetId: string,
    userId: string | null | undefined,
    text: string,
  ): Promise<AiModerationVerdict> {
    const verdict = this.evaluateText(text);
    await this.persist(target, targetId, userId, text, verdict);
    return verdict;
  }

  moderatePost(targetId: string, userId: string, text: string) {
    return this.moderateText('POST', targetId, userId, text);
  }

  moderateComment(targetId: string, userId: string, text: string) {
    return this.moderateText('COMMENT', targetId, userId, text);
  }

  moderateMessage(targetId: string, userId: string, text: string) {
    return this.moderateText('MESSAGE', targetId, userId, text);
  }

  moderateArticle(targetId: string, userId: string, text: string) {
    return this.moderateText('ARTICLE', targetId, userId, text);
  }

  moderateProfile(userId: string, text: string) {
    return this.moderateText('PROFILE', userId, userId, text);
  }

  // ── Queue ──────────────────────────────────────────────────────────────

  /**
   * Schedule moderation to run asynchronously. The worker drains the queue
   * with a small concurrency cap so big posts don't stall request handlers.
   */
  enqueue(job: ModerationJob) {
    this.queue.push(job);
  }

  private startWorker() {
    if (this.worker) return;
    this.worker = setInterval(() => {
      while (this.inFlight < this.maxConcurrent && this.queue.length) {
        const job = this.queue.shift();
        if (!job) break;
        this.inFlight++;
        this.process(job)
          .catch((err) =>
            this.logger.error(
              `[ai-moderation] job failed: ${err?.message ?? String(err)}`,
            ),
          )
          .finally(() => {
            this.inFlight--;
          });
      }
    }, 250);
    this.worker.unref?.();
  }

  private async process(job: ModerationJob) {
    const verdict = await this.moderateText(
      job.targetType,
      job.targetId,
      job.userId ?? null,
      job.text,
    );
    await this.applyAction(job, verdict);
  }

  /**
   * Apply the AI verdict against the underlying content document. Posts get
   * shadow-blocked / removed; comments mirror the same. Messages currently
   * only get flagged (no destructive auto-action for DMs to avoid false
   * positives breaking conversation history).
   */
  private async applyAction(job: ModerationJob, verdict: AiModerationVerdict) {
    if (verdict.action === 'ALLOW') {
      await this.setContentState(job, {
        moderationState: 'CLEARED',
        moderationSeverity: verdict.severity,
        moderationCategories: verdict.categories,
      });
      return;
    }

    const patch: Record<string, unknown> = {
      moderationSeverity: verdict.severity,
      moderationCategories: verdict.categories,
    };

    if (verdict.action === 'SHADOW_BLOCK') {
      patch.isShadowBlocked = true;
      patch.moderationState = 'SHADOW_BLOCKED';
    } else if (verdict.action === 'DELETE') {
      patch.isDeleted = true;
      patch.deletedAt = new Date();
      patch.moderationState = 'REMOVED';
    } else if (verdict.action === 'FLAG' || verdict.action === 'ESCALATE') {
      patch.moderationState = 'FLAGGED';
    }

    await this.setContentState(job, patch);
    this.broadcastModerationEvent(job, verdict);
  }

  private async setContentState(
    job: ModerationJob,
    patch: Record<string, unknown>,
  ) {
    try {
      if (job.targetType === 'POST') {
        const model = this.connection.model('Post');
        await model.updateOne({ _id: new Types.ObjectId(job.targetId) }, { $set: patch });
      } else if (job.targetType === 'COMMENT') {
        const model = this.connection.model('Comment');
        const { isShadowBlocked, moderationState, isDeleted } = patch as {
          isShadowBlocked?: boolean;
          moderationState?: string;
          isDeleted?: boolean;
        };
        const commentPatch: Record<string, unknown> = {};
        if (typeof isShadowBlocked === 'boolean')
          commentPatch.isShadowBlocked = isShadowBlocked;
        if (moderationState) commentPatch.moderationState = moderationState;
        if (typeof isDeleted === 'boolean') commentPatch.isDeleted = isDeleted;
        await model.updateOne(
          { _id: new Types.ObjectId(job.targetId) },
          { $set: commentPatch },
        );
      }
      // MESSAGE / PROFILE / ARTICLE: only the moderation result row is updated.
    } catch (err) {
      this.logger.warn(
        `[ai-moderation] failed to patch ${job.targetType}/${job.targetId}: ${(err as Error).message}`,
      );
    }
  }

  private broadcastModerationEvent(
    job: ModerationJob,
    verdict: AiModerationVerdict,
  ) {
    try {
      this.natsClient?.emit('app.events.moderation.action', {
        targetType: job.targetType,
        targetId: job.targetId,
        userId: job.userId ?? null,
        action: verdict.action,
        severity: verdict.severity,
        categories: verdict.categories,
        at: new Date().toISOString(),
      });
    } catch (err) {
      this.logger.debug?.(
        `[ai-moderation] event emit failed: ${(err as Error).message}`,
      );
    }
  }

  private async persist(
    target: ModerationTarget,
    targetId: string,
    userId: string | null | undefined,
    text: string,
    verdict: AiModerationVerdict,
  ) {
    try {
      await this.resultModel.create({
        targetType: target,
        targetId: new Types.ObjectId(targetId),
        userId: userId ? new Types.ObjectId(userId) : null,
        aiProvider: 'heuristic-v1',
        aiModel: 'rule-based',
        categories: verdict.categories,
        confidence: verdict.confidence,
        severity: verdict.severity,
        action: verdict.action,
        rawResponse: { reasons: verdict.reasons, sample: text.slice(0, 200) },
      });
    } catch (err) {
      this.logger.warn(
        `[ai-moderation] persist failed: ${(err as Error).message}`,
      );
    }
  }

  // ── Admin / Review API ─────────────────────────────────────────────────

  async listQueue(params: {
    severity?: ModerationSeverity;
    action?: ModerationActionKind;
    reviewed?: 'pending' | 'done' | 'all';
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (params.severity) filter.severity = params.severity;
    if (params.action) filter.action = params.action;
    if (params.reviewed === 'pending') filter.reviewedAt = null;
    if (params.reviewed === 'done') filter.reviewedAt = { $ne: null };

    const [items, total] = await Promise.all([
      this.resultModel
        .find(filter)
        .sort({ severity: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name profilePictureUrl username')
        .populate('reviewedBy', 'name profilePictureUrl username')
        .lean(),
      this.resultModel.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  async resolve(
    resultId: string,
    moderatorId: string,
    action: ModerationActionKind,
  ) {
    const result = await this.resultModel.findById(resultId);
    if (!result) return { ok: false };
    result.reviewedBy = new Types.ObjectId(moderatorId);
    result.reviewedAt = new Date();
    result.reviewedAction = action;
    await result.save();

    // Mirror the moderator's decision onto the underlying document.
    if (result.targetType === 'POST' || result.targetType === 'COMMENT') {
      const job: ModerationJob = {
        targetType: result.targetType,
        targetId: String(result.targetId),
        userId: result.userId ? String(result.userId) : null,
        text: '',
      };
      const verdict: AiModerationVerdict = {
        categories: (result.categories ?? []) as ModerationCategory[],
        confidence: result.confidence ?? 0,
        severity: (result.severity ?? 'LOW') as ModerationSeverity,
        action,
        reasons: ['human review'],
      };
      await this.applyAction(job, verdict);
    }
    return { ok: true, result: result.toObject() };
  }

  async stats() {
    const [bySeverity, byAction, recent] = await Promise.all([
      this.resultModel.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      this.resultModel.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
      this.resultModel.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);
    return {
      bySeverity,
      byAction,
      last24h: recent,
    };
  }
}
