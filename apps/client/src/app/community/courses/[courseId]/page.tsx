"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isAxiosError } from "axios";
import {
  BookOpen,
  Hash,
  Lock,
  Megaphone,
  MessageCircle,
  MessageCircleQuestion,
  Pin,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useCourseCommunity,
  useCreateGroupPost,
  useGroupChannels,
  useGroupChatUnread,
  useGroupPosts,
} from "@/hooks/app/community/use-social";
import { GroupCourseChat } from "@/components/community/groups/group-course-chat";
import { useCommunitySocket } from "@/providers/community-socket-provider";
import type {
  GroupPost,
  GroupPostType,
} from "@/services/app/community/social.api";

const POST_TYPE_OPTIONS: Array<{
  value: GroupPostType;
  label: string;
  icon: typeof BookOpen;
  hint: string;
  instructorOnly?: boolean;
}> = [
  { value: "DISCUSSION", label: "Discussion", icon: BookOpen, hint: "Share thoughts or notes." },
  {
    value: "QUESTION",
    label: "Question",
    icon: MessageCircleQuestion,
    hint: "Ask the community for help.",
  },
  {
    value: "RESOURCE",
    label: "Resource",
    icon: Sparkles,
    hint: "Share a useful link or file.",
  },
  {
    value: "ANNOUNCEMENT",
    label: "Announcement",
    icon: Megaphone,
    hint: "Instructor-only. Notifies all members.",
    instructorOnly: true,
  },
];

function isInstructor(role: string | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "INSTRUCTOR";
}

function isMember(role: string | null | undefined): boolean {
  return (
    role === "OWNER" ||
    role === "ADMIN" ||
    role === "MODERATOR" ||
    role === "INSTRUCTOR" ||
    role === "MEMBER"
  );
}

export default function CourseCommunityPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? "";

  const community = useCourseCommunity(courseId);
  const status = community.status;
  const group = community.data?.group;
  const role = community.data?.role ?? null;
  const groupId = group?._id ?? null;
  const errorStatus = isAxiosError(community.error)
    ? community.error.response?.status
    : undefined;

  const channels = useGroupChannels(groupId);
  const [activeChannel, setActiveChannel] = useState<string | undefined>(
    undefined,
  );
  const [activeType, setActiveType] = useState<GroupPostType | undefined>(
    undefined,
  );
  const [mainTab, setMainTab] = useState<"forum" | "chat">("forum");
  const chatUnread = useGroupChatUnread(groupId);

  const posts = useGroupPosts(groupId, {
    channelId: activeChannel,
    postType: activeType,
  });

  const create = useCreateGroupPost(groupId ?? "");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<GroupPostType>("DISCUSSION");

  const socket = useCommunitySocket();
  useEffect(() => {
    if (!groupId || !socket.isConnected) return;
    socket.joinGroup(groupId);
  }, [groupId, socket]);

  const flatPosts = useMemo(() => {
    const pages = posts.data?.pages ?? [];
    return pages.flatMap((p) => p.posts);
  }, [posts.data]);

  const pinned = posts.data?.pages?.[0]?.pinned ?? [];

  if (status === "pending") {
    return (
      <div className="space-y-4">
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  // Course community gated by enrollment / privacy
  if (status === "error" || !group) {
    return <EnrollmentLock status={errorStatus} />;
  }

  const canPost = isMember(role);
  const canAnnounce = isInstructor(role);

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-64 md:shrink-0">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div
            className="h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500"
            style={
              group.bannerUrl
                ? {
                    backgroundImage: `url(${group.bannerUrl})`,
                    backgroundSize: "cover",
                  }
                : undefined
            }
          />
          <div className="space-y-3 p-4">
            <div>
              <h2 className="line-clamp-2 text-base font-semibold">
                {group.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Course community
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {group.membersCount ?? 0} members
              </span>
              <span className="inline-flex items-center gap-1">
                <Pin className="h-3.5 w-3.5" />
                {group.postsCount ?? 0} posts
              </span>
            </div>
            <Link href="/community" className="block w-full">
              <Button variant="outline" size="sm" className="w-full">
                Back to community
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border bg-card p-2">
          <button
            type="button"
            onClick={() => setMainTab("forum")}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition",
              mainTab === "forum"
                ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            Forum
          </button>
          <button
            type="button"
            onClick={() => setMainTab("chat")}
            className={cn(
              "mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition",
              mainTab === "chat"
                ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </span>
            {(chatUnread.data?.unreadCount ?? 0) > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {(chatUnread.data?.unreadCount ?? 0) > 99
                  ? "99+"
                  : chatUnread.data?.unreadCount}
              </span>
            ) : null}
          </button>
        </div>

        {/* Channels */}
        <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-2 text-xs font-semibold text-muted-foreground">
            <span>Channels</span>
          </div>
          <ul className="p-2 text-sm">
            <ChannelItem
              label="All"
              active={!activeChannel}
              onClick={() => setActiveChannel(undefined)}
            />
            {(channels.data ?? []).map((c) => (
              <ChannelItem
                key={c._id}
                label={c.name}
                active={activeChannel === c._id}
                onClick={() => setActiveChannel(c._id)}
              />
            ))}
          </ul>
        </div>

        {/* Filters */}
        <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-2 text-xs font-semibold text-muted-foreground">
            Filter by type
          </div>
          <ul className="p-2 text-sm">
            <ChannelItem
              label="All posts"
              active={!activeType}
              onClick={() => setActiveType(undefined)}
            />
            {POST_TYPE_OPTIONS.map((t) => (
              <ChannelItem
                key={t.value}
                label={t.label}
                icon={t.icon}
                active={activeType === t.value}
                onClick={() => setActiveType(t.value)}
              />
            ))}
          </ul>
        </div>
      </aside>

      {/* Feed / Chat */}
      <div className="min-w-0 flex-1 space-y-4">
        {mainTab === "chat" && groupId ? (
          <GroupCourseChat
            groupId={groupId}
            canPost={canPost}
            canModerate={canAnnounce}
          />
        ) : null}
        {mainTab === "forum" && canPost && (
          <div className="rounded-2xl border bg-card p-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Share with the ${group.name} community…`}
              className="min-h-20 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {POST_TYPE_OPTIONS.filter(
                  (t) => !t.instructorOnly || canAnnounce,
                ).map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setPostType(t.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition",
                      postType === t.value
                        ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                disabled={!content.trim() || create.isPending}
                onClick={() => {
                  const value = content.trim();
                  if (!value) return;
                  create.mutate(
                    {
                      content: value,
                      postType,
                      channelId: activeChannel ?? null,
                    },
                    {
                      onSuccess: () => {
                        setContent("");
                        setPostType("DISCUSSION");
                      },
                    },
                  );
                }}
              >
                {create.isPending ? "Publishing…" : (
                  <>
                    <Send className="mr-1 h-3.5 w-3.5" />
                    Publish
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {mainTab === "forum" && pinned.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Pin className="h-3.5 w-3.5" /> Pinned
            </h3>
            <div className="space-y-3">
              {pinned.map((p) => (
                <PostCardLite key={p._id} post={p} pinned />
              ))}
            </div>
          </section>
        )}

        {mainTab === "forum" ? (
        <section>
          {posts.isLoading ? (
            <div className="space-y-3">
              <div className="h-24 animate-pulse rounded-2xl bg-muted" />
              <div className="h-24 animate-pulse rounded-2xl bg-muted" />
              <div className="h-24 animate-pulse rounded-2xl bg-muted" />
            </div>
          ) : flatPosts.length === 0 ? (
            <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
              No posts yet — start the conversation!
            </div>
          ) : (
            <div className="space-y-3">
              {flatPosts.map((p) => (
                <PostCardLite key={p._id} post={p} />
              ))}
            </div>
          )}

          {posts.hasNextPage && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                disabled={posts.isFetchingNextPage}
                onClick={() => posts.fetchNextPage()}
              >
                {posts.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </section>
        ) : null}
      </div>
    </div>
  );
}

function ChannelItem({
  label,
  icon: Icon = Hash,
  active,
  onClick,
}: {
  label: string;
  icon?: typeof Hash;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition",
          active
            ? "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="truncate">{label}</span>
      </button>
    </li>
  );
}

function PostCardLite({ post, pinned }: { post: GroupPost; pinned?: boolean }) {
  const author =
    typeof post.author === "object" ? post.author : null;
  const name = author?.name ?? "User";
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const typeColor: Record<GroupPostType, string> = {
    DISCUSSION: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    QUESTION:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    RESOURCE:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    ANNOUNCEMENT:
      "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300",
  };

  return (
    <article className="rounded-2xl border bg-card p-4">
      <header className="mb-2 flex items-center gap-3">
        <Avatar className="h-9 w-9">
          {author?.profilePictureUrl && (
            <AvatarImage src={author.profilePictureUrl} alt={name} />
          )}
          <AvatarFallback>{initials || "U"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">{name}</span>
            <Badge
              variant="secondary"
              className={cn("rounded-full text-[10px]", typeColor[post.postType])}
            >
              {post.postType.toLowerCase()}
            </Badge>
            {pinned && (
              <Badge
                variant="secondary"
                className="rounded-full bg-violet-50 text-[10px] text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
              >
                <Pin className="mr-1 h-3 w-3" />
                pinned
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>
      </header>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
    </article>
  );
}

function EnrollmentLock({ status }: { status?: number }) {
  const isForbidden = status === 403;
  const isMissing = status === 404;
  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-card p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
        <Lock className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-semibold">
        {isMissing
          ? "Course community not available yet"
          : "This community is private."}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {isMissing
          ? "The instructor hasn't set up this community yet. Check back soon."
          : "Enroll in the course to join discussions, ask questions and access resources."}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/community">
          <Button variant="outline">Back to community</Button>
        </Link>
      </div>
      {!isForbidden && !isMissing && (
        <p className="mt-4 text-xs text-muted-foreground">
          Already enrolled? Try refreshing.
        </p>
      )}
    </div>
  );
}
