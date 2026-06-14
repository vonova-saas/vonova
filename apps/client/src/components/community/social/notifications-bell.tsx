"use client";

import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useMarkNotificationsRead,
  useNotifications,
} from "@/hooks/app/community/use-social";
import { cn } from "@/lib/utils";
import type {
  CommunityNotification,
  CommunityProfileSummary,
} from "@/types/api/app/community/social.types";

const NOTIFICATION_COPY: Record<string, (n: CommunityNotification) => string> = {
  LIKE: () => "liked your post",
  COMMENT: () => "commented on your post",
  REPLY: () => "replied to your comment",
  FOLLOW: () => "started following you",
  MESSAGE: () => "sent you a message",
  REPOST: () => "reposted your post",
  MENTION: () => "mentioned you",
  GROUP_INVITE: () => "invited you to a group",
  COURSE_INVITE: () => "invited you to a course",
  COURSE_ANNOUNCEMENT: () => "posted a course announcement",
  GROUP_CHAT: () => "sent a message in your group",
  LESSON_PUBLISHED: () => "published a new lesson",
  QUIZ_PUBLISHED: () => "published a new quiz",
  QUIZ_RESULT: () => "shared quiz results",
  SHEET_ASSIGNED: () => "assigned a problem sheet",
  ENROLLMENT: () => "enrolled in your course",
};

function actor(n: CommunityNotification): CommunityProfileSummary | null {
  if (n.actorId && typeof n.actorId === "object") {
    return n.actorId as CommunityProfileSummary;
  }
  return null;
}

function summaryFor(n: CommunityNotification): string {
  return (NOTIFICATION_COPY[n.type] ?? (() => "new activity"))(n);
}

export function NotificationsBell({
  notificationsHref = "/community/notifications",
}: {
  notificationsHref?: string;
}) {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(100vw-1.5rem,22rem)] max-w-[360px] p-0 sm:w-[360px]"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            disabled={!unread || markRead.isPending}
            onClick={() => markRead.mutate(undefined)}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>

        <ScrollArea className="max-h-[420px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </div>
          ) : (
            <ul className="divide-y">
              {items.slice(0, 10).map((n) => {
                const a = actor(n);
                return (
                  <li
                    key={n._id}
                    className={cn(
                      "flex items-start gap-3 px-3 py-2.5 text-sm",
                      !n.read && "bg-violet-50/60 dark:bg-violet-900/10",
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={a?.profilePictureUrl} alt={a?.name} />
                      <AvatarFallback>
                        {(a?.name ?? "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <span className="font-medium">
                          {a?.name ?? "Someone"}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {summaryFor(n)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {n.createdAt
                          ? formatDistanceToNow(new Date(n.createdAt), {
                              addSuffix: true,
                            })
                          : ""}
                      </p>
                    </div>
                    {!n.read && (
                      <Badge
                        variant="secondary"
                        className="h-2 w-2 shrink-0 rounded-full bg-violet-500 p-0"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="border-t p-2 text-center">
          <Link
            href={notificationsHref}
            className="block rounded-md py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/10"
          >
            See all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
