import type { QueryClient } from "@tanstack/react-query";
import { socialKeys } from "@/hooks/app/community/use-social";
import { mergeCommunityNotificationMedia } from "@/lib/community/merge-presigned-media";
import type { CommunityNotification } from "@/types/api/app/community/social.types";

export type NotificationsListData = {
  items: CommunityNotification[];
  total?: number;
  unread?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  nextCursor?: string | null;
};

export function patchNotificationsCache(
  qc: QueryClient,
  patcher: (prev: NotificationsListData) => NotificationsListData,
) {
  qc.setQueriesData<NotificationsListData>(
    { queryKey: socialKeys.notifications() },
    (prev) => (prev ? patcher(prev) : prev),
  );
}

export function prependNotification(
  qc: QueryClient,
  notification: CommunityNotification & { unread?: number },
) {
  patchNotificationsCache(qc, (prev) => {
    if (prev.items.some((n) => String(n._id) === String(notification._id))) {
      return {
        ...prev,
        items: prev.items.map((n) =>
          String(n._id) === String(notification._id)
            ? mergeCommunityNotificationMedia(n, notification)
            : n,
        ),
      };
    }
    const unreadFromPayload =
      typeof notification.unread === "number" ? notification.unread : null;
    return {
      ...prev,
      items: [notification, ...prev.items],
      unread:
        unreadFromPayload ??
        (prev.unread ?? 0) + (notification.read ? 0 : 1),
      total: (prev.total ?? prev.items.length) + 1,
    };
  });
}

export function setUnreadCount(qc: QueryClient, unread: number) {
  patchNotificationsCache(qc, (prev) => ({ ...prev, unread }));
}

export function markIdsReadInCache(qc: QueryClient, ids?: string[]) {
  patchNotificationsCache(qc, (prev) => {
    const idSet = ids?.length ? new Set(ids.map(String)) : null;
    const items = prev.items.map((n) =>
      !idSet || idSet.has(String(n._id)) ? { ...n, read: true } : n,
    );
    const unread = idSet
      ? Math.max(0, (prev.unread ?? 0) - idSet.size)
      : 0;
    return { ...prev, items, unread };
  });
}

export function removeNotificationFromCache(
  qc: QueryClient,
  notificationId: string,
) {
  patchNotificationsCache(qc, (prev) => {
    const removed = prev.items.find(
      (n) => String(n._id) === String(notificationId),
    );
    return {
      ...prev,
      items: prev.items.filter(
        (n) => String(n._id) !== String(notificationId),
      ),
      total: Math.max(0, (prev.total ?? prev.items.length) - 1),
      unread: Math.max(
        0,
        (prev.unread ?? 0) - (removed && !removed.read ? 1 : 0),
      ),
    };
  });
}
