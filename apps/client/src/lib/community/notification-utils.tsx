import {
  AtSign,
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Heart,
  MessageCircle,
  Repeat2,
  UserPlus,
  Users,
} from "lucide-react";
import type { CommunityNotification } from "@/types/api/app/community/social.types";
import { cn } from "@/lib/utils";

export const NOTIFICATION_COPY: Record<string, string> = {
  LIKE: "liked your post",
  COMMENT: "commented on your post",
  REPLY: "replied to your comment",
  REPOST: "reposted your post",
  FOLLOW: "started following you",
  MESSAGE: "sent you a message",
  GROUP_CHAT: "sent a group message",
  MENTION: "mentioned you",
  ENROLLMENT: "enrolled in your course",
  LESSON_PUBLISHED: "published a new lesson",
  QUIZ_PUBLISHED: "published a new quiz",
  QUIZ_RESULT: "completed a quiz",
  SHEET_ASSIGNED: "assigned a problem sheet",
  COURSE_ANNOUNCEMENT: "posted a course announcement",
  GROUP_INVITE: "invited you to a group",
  COURSE_INVITE: "invited you to a course",
};

export function notificationSummary(n: CommunityNotification): string {
  if (n.message?.trim()) return n.message.trim();
  return NOTIFICATION_COPY[String(n.type).toUpperCase()] ?? "new activity";
}

export function NotificationTypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const t = String(type).toUpperCase();
  const props = { className: cn("h-4 w-4 shrink-0", className) };
  switch (t) {
    case "LIKE":
      return <Heart {...props} className={cn(props.className, "text-rose-500")} />;
    case "COMMENT":
    case "REPLY":
      return (
        <MessageCircle
          {...props}
          className={cn(props.className, "text-sky-500")}
        />
      );
    case "REPOST":
      return <Repeat2 {...props} className={cn(props.className, "text-emerald-500")} />;
    case "FOLLOW":
      return <UserPlus {...props} className={cn(props.className, "text-violet-500")} />;
    case "MESSAGE":
      return (
        <MessageCircle
          {...props}
          className={cn(props.className, "text-indigo-500")}
        />
      );
    case "GROUP_CHAT":
      return <Users {...props} className={cn(props.className, "text-teal-500")} />;
    case "MENTION":
      return <AtSign {...props} className={cn(props.className, "text-amber-500")} />;
    case "ENROLLMENT":
      return (
        <GraduationCap
          {...props}
          className={cn(props.className, "text-blue-500")}
        />
      );
    case "LESSON_PUBLISHED":
      return <BookOpen {...props} className={cn(props.className, "text-blue-600")} />;
    case "QUIZ_PUBLISHED":
    case "QUIZ_RESULT":
      return (
        <ClipboardList
          {...props}
          className={cn(props.className, "text-orange-500")}
        />
      );
    case "SHEET_ASSIGNED":
      return (
        <ClipboardList
          {...props}
          className={cn(props.className, "text-fuchsia-500")}
        />
      );
    case "COURSE_ANNOUNCEMENT":
      return <Bell {...props} className={cn(props.className, "text-violet-600")} />;
    default:
      return <Bell {...props} />;
  }
}

export function notificationTargetHref(
  n: CommunityNotification,
): string | null {
  const t = String(n.type ?? "").toUpperCase();
  const entity = n.entityId ? String(n.entityId) : "";
  const meta = n.meta ?? {};
  const courseId = meta.courseId ? String(meta.courseId) : "";
  const groupId = meta.groupId ? String(meta.groupId) : "";
  const postId = meta.postId ? String(meta.postId) : entity;

  if (t === "COURSE_ANNOUNCEMENT" && postId) {
    if (courseId) {
      return `/community/courses/${encodeURIComponent(courseId)}`;
    }
    if (groupId) {
      return `/community/groups`;
    }
    return `/community/posts/${encodeURIComponent(postId)}`;
  }

  if (["LIKE", "COMMENT", "REPLY", "REPOST"].includes(t) && entity) {
    return `/community/posts/${encodeURIComponent(entity)}`;
  }

  if (t === "MENTION") {
    if (groupId || meta.courseId) {
      const cid = courseId || groupId;
      return cid
        ? `/community/courses/${encodeURIComponent(String(meta.courseId ?? cid))}`
        : null;
    }
    if (entity) return `/community/posts/${encodeURIComponent(entity)}`;
  }

  if (t === "MESSAGE") {
    const cid = meta.conversationId
      ? String(meta.conversationId)
      : entity;
    if (cid) return `/community/messages/${encodeURIComponent(cid)}`;
  }

  if (t === "GROUP_CHAT") {
    if (courseId) {
      return `/community/courses/${encodeURIComponent(courseId)}`;
    }
    if (groupId) return `/community/groups`;
  }

  if (t === "FOLLOW") {
    const a = n.actorId;
    if (a && typeof a === "object" && "username" in a && a.username) {
      return `/community/profile/${encodeURIComponent(String(a.username))}`;
    }
  }

  if (t === "ENROLLMENT" && courseId) {
    return `/instructor`;
  }

  if (t === "LESSON_PUBLISHED" && courseId) {
    return `/community/courses/${encodeURIComponent(courseId)}`;
  }

  if (t === "QUIZ_PUBLISHED" && courseId) {
    return `/community/courses/${encodeURIComponent(courseId)}`;
  }

  if (t === "QUIZ_RESULT") {
    const qid = meta.quizId ? String(meta.quizId) : entity;
    if (courseId) {
      return `/community/courses/${encodeURIComponent(courseId)}`;
    }
    if (qid) return `/student`;
  }

  if (t === "SHEET_ASSIGNED") {
    const sheetId = meta.sheetId ? String(meta.sheetId) : entity;
    if (courseId) {
      return `/community/courses/${encodeURIComponent(courseId)}`;
    }
    if (sheetId) return `/student`;
  }

  return null;
}

function actorName(n: CommunityNotification): string {
  const a = n.actorId;
  if (a && typeof a === "object" && "name" in a) {
    return String((a as { name?: string }).name ?? "Someone");
  }
  return "Someone";
}

/** Collapse duplicate LIKE/COMMENT/REPOST on the same entity for display. */
export function collapseSocialNotificationBuckets(
  items: CommunityNotification[],
): CommunityNotification[] {
  const buckets = new Map<string, CommunityNotification[]>();
  const bucketOrder: string[] = [];
  const result: CommunityNotification[] = [];

  for (const n of items) {
    const t = String(n.type).toUpperCase();
    if (["LIKE", "COMMENT", "REPOST"].includes(t) && n.entityId) {
      const key = `${t}:${n.entityId}`;
      if (!buckets.has(key)) {
        buckets.set(key, []);
        bucketOrder.push(key);
      }
      buckets.get(key)!.push(n);
    } else {
      result.push(n);
    }
  }

  for (const key of bucketOrder) {
    const list = buckets.get(key)!;
    const head = { ...list[0] };
    if (list.length > 1) {
      const first = actorName(list[0]);
      const rest = list.length - 1;
      const action = NOTIFICATION_COPY[String(head.type).toUpperCase()] ?? "interacted";
      head.message = `${first} and ${rest} other${rest > 1 ? "s" : ""} ${action}`;
    }
    result.push(head);
  }

  return result.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

export function groupNotificationsByDate(items: CommunityNotification[]) {
  const today: CommunityNotification[] = [];
  const yesterday: CommunityNotification[] = [];
  const earlier: CommunityNotification[] = [];
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);

  for (const n of items) {
    const d = n.createdAt ? new Date(n.createdAt) : null;
    if (!d || Number.isNaN(d.getTime())) {
      earlier.push(n);
      continue;
    }
    if (d >= startToday) today.push(n);
    else if (d >= startYesterday) yesterday.push(n);
    else earlier.push(n);
  }
  return { today, yesterday, earlier };
}
