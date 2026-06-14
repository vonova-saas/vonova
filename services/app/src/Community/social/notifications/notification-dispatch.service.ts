import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { S3Service } from '../../../common/aws/s3.service';
import {
  NotificationAudienceResolver,
  type AudienceSpec,
} from './notification-audience.resolver';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationUnreadService } from './notification-unread.service';
import { applyStableUserPublicMedia } from '../../../common/media/community-media-hydration.helper';
import { stableMediaGetEnabled } from '../../../common/media/stable-media-url';

export const DISPATCH_CHUNK_SIZE = 100;

export type DispatchTemplate = {
  actorId: string;
  type: string;
  entityType?: string;
  entityId?: string;
  title?: string;
  message?: string;
  meta?: Record<string, unknown>;
  skipSelf?: boolean;
};

export type DispatchOneInput = DispatchTemplate & {
  recipientId: string;
  dedupeKey?: string;
  force?: boolean;
};

export type DispatchFanOutInput = {
  audience: AudienceSpec;
  template: DispatchTemplate;
  dedupeEntityId?: string;
  chunkSize?: number;
};

export type DispatchDelivery = {
  recipientId: string;
  notification: Record<string, unknown>;
  unread: number;
};

export type DispatchFanOutResult = {
  deliveries: DispatchDelivery[];
  stats: {
    targeted: number;
    delivered: number;
    skipped: number;
    deduped: number;
    failed: number;
  };
};

@Injectable()
export class NotificationDispatchService {
  private readonly log = new Logger('NotificationDispatch');

  constructor(
    @InjectModel('CommunityNotification')
    private readonly notificationModel: Model<unknown>,
    private readonly audienceResolver: NotificationAudienceResolver,
    private readonly preferences: NotificationPreferencesService,
    private readonly unreadService: NotificationUnreadService,
    private readonly appS3: S3Service,
  ) {}

  static buildDedupeKey(
    type: string,
    entityId: string | undefined,
    userId: string,
  ): string {
    return `${String(type).toUpperCase()}:${entityId ?? ''}:${userId}`;
  }

  private oid(id: string) {
    return new Types.ObjectId(id);
  }

  private async hydrateActor(
    lean: Record<string, unknown>,
  ): Promise<void> {
    const a = lean.actorId;
    if (a && typeof a === 'object') {
      const user = a as Record<string, unknown>;
      if (stableMediaGetEnabled()) {
        applyStableUserPublicMedia(user);
        return;
      }
      const pic = user.profilePictureUrl;
      if (typeof pic === 'string') {
        const signed = await this.appS3.signProfileMediaReadUrl(pic);
        if (signed) user.profilePictureUrl = signed;
      }
    }
  }

  async dispatchOne(input: DispatchOneInput): Promise<{
    notification: Record<string, unknown> | null;
    skipped?: boolean;
    duplicate?: boolean;
    unread?: number;
  }> {
    const recipientId = String(input.recipientId);
    const actorId = String(input.actorId);
    const type = String(input.type).toUpperCase();

    if (input.skipSelf !== false && recipientId === actorId) {
      this.log.log(
        `[NOTIFICATION_SKIPPED] type=${type} reason=self recipient=${recipientId}`,
      );
      return { notification: null, skipped: true };
    }

    if (!input.force) {
      const enabled = await this.preferences.isDeliveryEnabled(
        recipientId,
        type,
      );
      if (!enabled) {
        this.log.log(
          `[NOTIFICATION_SKIPPED] type=${type} reason=preferences recipient=${recipientId}`,
        );
        return { notification: null, skipped: true };
      }
    }

    const dedupeKey =
      input.dedupeKey ??
      NotificationDispatchService.buildDedupeKey(
        type,
        input.entityId,
        recipientId,
      );

    try {
      const existing = await this.notificationModel
        .findOne({ dedupeKey })
        .populate('actorId', 'name profilePictureUrl username')
        .lean();
      if (existing) {
        this.log.log(
          `[NOTIFICATION_DEDUPED] type=${type} recipient=${recipientId} key=${dedupeKey}`,
        );
        const row = existing as Record<string, unknown>;
        await this.hydrateActor(row);
        return {
          notification: row,
          duplicate: true,
          unread: await this.unreadService.getUnread(recipientId),
        };
      }

      const doc = await this.notificationModel.create({
        userId: this.oid(recipientId),
        actorId: this.oid(actorId),
        type,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        title: input.title?.slice(0, 200) ?? '',
        message: input.message?.slice(0, 500) ?? '',
        read: false,
        meta: input.meta ?? {},
        dedupeKey,
      });

      const lean = await this.notificationModel
        .findById((doc as { _id: Types.ObjectId })._id)
        .populate('actorId', 'name profilePictureUrl username')
        .lean();

      const notification = (lean ?? doc.toObject()) as Record<string, unknown>;
      await this.hydrateActor(notification);
      const unread = await this.unreadService.increment(recipientId, 1);

      this.log.log(
        `[NOTIFICATION_DELIVERED] type=${type} recipient=${recipientId} entity=${input.entityId ?? ''}`,
      );

      return { notification, unread };
    } catch (err) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        this.log.log(
          `[NOTIFICATION_DEDUPED] type=${type} recipient=${recipientId} key=${dedupeKey}`,
        );
        const existing = await this.notificationModel
          .findOne({ dedupeKey })
          .populate('actorId', 'name profilePictureUrl username')
          .lean();
        if (existing) {
          const row = existing as Record<string, unknown>;
          await this.hydrateActor(row);
          return {
            notification: row,
            duplicate: true,
            unread: await this.unreadService.getUnread(recipientId),
          };
        }
      }
      this.log.warn(
        `[NOTIFICATION_FAILED] type=${type} recipient=${recipientId}: ${(err as Error).message}`,
      );
      return { notification: null, skipped: true };
    }
  }

  /**
   * Chunked fan-out — idempotent per recipient via dedupeKey.
   * Safe to call without awaiting from HTTP handlers (queue-ready).
   */
  async dispatchFanOut(input: DispatchFanOutInput): Promise<DispatchFanOutResult> {
    const chunkSize = Math.min(
      Math.max(input.chunkSize ?? DISPATCH_CHUNK_SIZE, 10),
      200,
    );
    const userIds = await this.audienceResolver.resolveUserIds(input.audience);
    const stats = {
      targeted: userIds.length,
      delivered: 0,
      skipped: 0,
      deduped: 0,
      failed: 0,
    };
    const deliveries: DispatchDelivery[] = [];
    const entityId =
      input.dedupeEntityId ?? input.template.entityId ?? undefined;
    const type = String(input.template.type).toUpperCase();

    this.log.log(
      `[NOTIFICATION_DISPATCH] type=${type} audience=${input.audience.kind} targets=${userIds.length}`,
    );

    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      for (const recipientId of chunk) {
        const result = await this.dispatchOne({
          ...input.template,
          recipientId,
          dedupeKey: NotificationDispatchService.buildDedupeKey(
            type,
            entityId,
            recipientId,
          ),
        });
        if (!result.notification) {
          if (result.duplicate) stats.deduped += 1;
          else stats.skipped += 1;
          continue;
        }
        if (result.duplicate) stats.deduped += 1;
        else stats.delivered += 1;
        deliveries.push({
          recipientId,
          notification: result.notification,
          unread: result.unread ?? 0,
        });
      }
    }

    return { deliveries, stats };
  }

  /** Fire-and-forget wrapper for HTTP handlers (async queue compatible). */
  scheduleFanOut(input: DispatchFanOutInput): void {
    setImmediate(() => {
      void this.dispatchFanOut(input).catch((err) => {
        this.log.warn(
          `[NOTIFICATION_FAILED] scheduleFanOut: ${(err as Error).message}`,
        );
      });
    });
  }
}
