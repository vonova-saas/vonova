"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CheckCheck, Loader2, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useClearReadNotifications,
  useDeleteNotification,
  useMarkNotificationsRead,
  useNotificationsInfinite,
} from "@/hooks/app/community/use-social";
import type {
  CommunityNotification,
  CommunityProfileSummary,
} from "@/types/api/app/community/social.types";
import {
  NotificationTypeIcon,
  collapseSocialNotificationBuckets,
  groupNotificationsByDate,
  notificationSummary,
  notificationTargetHref,
} from "@/lib/community/notification-utils";
import { NotificationPreferencesPanel } from "@/components/community/social/notification-preferences-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { PresignedMediaImage } from "@/components/shared/presigned-media-image";
import { socialKeys } from "@/hooks/app/community/use-social";

function actor(n: CommunityNotification): CommunityProfileSummary | null {
  if (n.actorId && typeof n.actorId === "object") {
    return n.actorId as CommunityProfileSummary;
  }
  return null;
}

function NotificationRow({
  n,
  onOpen,
  onDelete,
}: {
  n: CommunityNotification;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const a = actor(n);
  return (
    <div
      className={`flex w-full items-start gap-3 px-4 py-3 text-sm transition hover:bg-muted/60 ${!n.read ? "bg-violet-50/50 dark:bg-violet-900/10" : ""}`}
    >
      <NotificationTypeIcon type={n.type} className="mt-1" />
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen}>
        <div className="flex items-center gap-2">
          {a?.profilePictureUrl ? (
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
              <PresignedMediaImage
                src={a.profilePictureUrl}
                width={32}
                height={32}
                alt={a?.name ?? ""}
                className="h-8 w-8 object-cover"
                onRefreshSrc={async () => {
                  await qc.invalidateQueries({
                    queryKey: [...socialKeys.all, "notifications"],
                  });
                  return null;
                }}
              />
            </div>
          ) : (
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>
                {(a?.name ?? "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <p className="truncate">
              <span className="font-medium">{a?.name ?? "Someone"}</span>{" "}
              <span className="text-muted-foreground">
                {notificationSummary(n)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {n.createdAt
                ? formatDistanceToNow(new Date(n.createdAt), {
                    addSuffix: true,
                  })
                : ""}
            </p>
          </div>
        </div>
      </button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0"
        aria-label="Delete notification"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function Section({
  title,
  items,
  onOpen,
  onDelete,
}: {
  title: string;
  items: CommunityNotification[];
  onOpen: (n: CommunityNotification) => void;
  onDelete: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="divide-y">
        {items.map((n) => (
          <NotificationRow
            key={n._id}
            n={n}
            onOpen={() => onOpen(n)}
            onDelete={() => onDelete(n._id)}
          />
        ))}
      </div>
    </div>
  );
}

export function NotificationsCenter() {
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const q = useNotificationsInfinite(unreadOnly);
  const markRead = useMarkNotificationsRead();
  const deleteOne = useDeleteNotification();
  const clearRead = useClearReadNotifications();

  const items = useMemo(() => {
    const raw = q.data?.pages.flatMap((p) => p.items) ?? [];
    return collapseSocialNotificationBuckets(raw);
  }, [q.data]);
  const unread = q.data?.pages[0]?.unread ?? 0;
  const grouped = useMemo(() => groupNotificationsByDate(items), [items]);

  const handleOpen = (n: CommunityNotification) => {
    const href = notificationTargetHref(n);
    if (!href) return;
    if (!n.read) markRead.mutate([n._id]);
    router.push(href);
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !q.hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && q.hasNextPage && !q.isFetchingNextPage) {
          void q.fetchNextPage();
        }
      },
      { rootMargin: "120px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [q]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-2 sm:px-0">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "You're all caught up."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={unreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setUnreadOnly((v) => !v)}
          >
            Unread only
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!unread || markRead.isPending}
            onClick={() => markRead.mutate(undefined)}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={clearRead.isPending}
            onClick={() => clearRead.mutate()}
          >
            <Trash2 className="h-4 w-4" />
            Clear read
          </Button>
        </div>
      </header>

      <NotificationPreferencesPanel />

      {q.isLoading ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          {unreadOnly ? "No unread notifications." : "No notifications yet."}
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Section
            title="Today"
            items={grouped.today}
            onOpen={handleOpen}
            onDelete={(id) => deleteOne.mutate(id)}
          />
          <Section
            title="Yesterday"
            items={grouped.yesterday}
            onOpen={handleOpen}
            onDelete={(id) => deleteOne.mutate(id)}
          />
          <Section
            title="Earlier"
            items={grouped.earlier}
            onOpen={handleOpen}
            onDelete={(id) => deleteOne.mutate(id)}
          />
          <div ref={sentinelRef} className="h-8" />
          {q.isFetchingNextPage ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
