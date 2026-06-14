import { Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CommunitySocketGateway } from '../../community/socket/community.gateway';
import { SOCKET_EVENTS } from '../../community/socket/socket-user.types';
import { CommunitySocialGatewayService } from './social.gateway.service';

const logger = new Logger('CommunityNotifications');

export type NotifyInput = {
  recipientId: string;
  actorId: string;
  type: string;
  entityType?: string;
  entityId?: string;
  title?: string;
  message?: string;
  meta?: Record<string, unknown>;
  force?: boolean;
  skipSelf?: boolean;
};

export type FanOutAudience =
  | { kind: 'courseEnrolled'; courseId: string; excludeUserIds?: string[] }
  | { kind: 'groupMembers'; groupId: string; excludeUserIds?: string[] }
  | { kind: 'users'; userIds: string[] }
  | { kind: 'single'; userId: string };

export type FanOutInput = {
  audience: FanOutAudience;
  template: Omit<NotifyInput, 'recipientId'>;
  dedupeEntityId?: string;
  chunkSize?: number;
};

const SOCKET_CHUNK = 50;

/**
 * Persist notification via app service and push to user:{recipientId} socket room.
 */
export async function deliverCommunityNotification(
  social: CommunitySocialGatewayService,
  sockets: CommunitySocketGateway,
  input: NotifyInput,
): Promise<void> {
  if (
    !input.recipientId ||
    (input.skipSelf !== false && input.recipientId === input.actorId)
  ) {
    return;
  }
  try {
    const result = await firstValueFrom(social.createNotification(input));
    const notif =
      (result as { data?: { notification?: unknown } })?.data?.notification ??
      (result as { notification?: unknown })?.notification;
    const unread =
      (result as { data?: { unread?: number } })?.data?.unread ??
      (result as { unread?: number })?.unread;
    if (notif) {
      sockets.emitToUser(
        input.recipientId,
        SOCKET_EVENTS.NOTIFICATION_NEW,
        unread != null ? { ...(notif as object), unread } : notif,
      );
    }
  } catch (err) {
    logger.warn(
      `[NOTIFICATION_FAILED] type=${input.type} to=${input.recipientId}: ${String(err)}`,
    );
  }
}

/** Emit socket deliveries from fan-out result (chunked). */
export function emitFanOutDeliveries(
  sockets: CommunitySocketGateway,
  deliveries: Array<{
    recipientId: string;
    notification: Record<string, unknown>;
    unread?: number;
  }>,
): void {
  for (let i = 0; i < deliveries.length; i += SOCKET_CHUNK) {
    const batch = deliveries.slice(i, i + SOCKET_CHUNK);
    setImmediate(() => {
      for (const d of batch) {
        sockets.emitToUser(d.recipientId, SOCKET_EVENTS.NOTIFICATION_NEW, {
          ...d.notification,
          unread: d.unread,
        });
      }
    });
  }
}

/**
 * Centralized chunked fan-out — does not block HTTP; persists via app service.
 */
export function scheduleNotificationFanOut(
  social: CommunitySocialGatewayService,
  sockets: CommunitySocketGateway,
  input: FanOutInput,
): void {
  setImmediate(() => {
    void (async () => {
      try {
        const result = await firstValueFrom(
          social.dispatchNotificationFanOut({
            audience: input.audience,
            template: {
              actorId: input.template.actorId,
              type: input.template.type,
              entityType: input.template.entityType,
              entityId: input.template.entityId,
              title: input.template.title,
              message: input.template.message,
              meta: input.template.meta,
              skipSelf: false,
            },
            dedupeEntityId: input.dedupeEntityId,
            chunkSize: input.chunkSize,
          }),
        );
        const data =
          (result as { data?: { deliveries?: unknown[] } })?.data ?? result;
        const deliveries =
          (data as { deliveries?: Array<{
            recipientId: string;
            notification: Record<string, unknown>;
            unread?: number;
          }> })?.deliveries ?? [];
        emitFanOutDeliveries(sockets, deliveries);
      } catch (err) {
        logger.warn(
          `[NOTIFICATION_FAILED] fanOut type=${input.template.type}: ${String(err)}`,
        );
      }
    })();
  });
}
