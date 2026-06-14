"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  SOCKET_EVENTS,
  useCommunitySocketOptional,
} from "@/providers/community-socket-provider";
import { socialKeys } from "@/hooks/app/community/use-social";
import {
  patchPostInAllCaches,
  removePostFromAllCaches,
} from "@/lib/community/post-cache-sync";
import {
  prependNotification,
  removeNotificationFromCache,
  setUnreadCount,
  markIdsReadInCache,
} from "@/lib/community/notification-cache";
import { shouldSuppressNotification } from "@/lib/community/notification-presence";
import {
  mergeCommunityFeedItemMedia,
  mergeDirectMessageMedia,
  mergeGroupChatMessageMedia,
} from "@/lib/community/merge-presigned-media";
import type {
  CommunityFeedItem,
  CommunityFeedResponse,
  CommunityNotification,
  DirectMessage,
  GroupChatMessage,
  GroupChatMessagesResponse,
  PagedList,
} from "@/types/api/app/community/social.types";

type LikedPayload = {
  postId: string;
  userId: string;
  liked?: boolean;
  likesCount?: number;
};

type CommentedPayload = {
  postId: string;
  userId: string;
};

type RepostedPayload = {
  postId: string;
  userId: string;
  sharesCount?: number;
  sharedPost?: CommunityFeedItem;
};

type PostNewPayload = {
  authorId: string;
  post: CommunityFeedItem;
};

type MessageNewPayload = {
  conversationId: string;
  message: DirectMessage;
  senderId: string;
};

type NotificationNewPayload = Partial<CommunityNotification> & {
  type?: string;
  actorId?: string;
};

function updateFeed<F extends string>(
  qc: ReturnType<typeof useQueryClient>,
  scope: F,
  mutator: (resp: CommunityFeedResponse) => CommunityFeedResponse,
) {
  const key = socialKeys.feed(scope as "for-you" | "explore");
  qc.setQueryData<{ pages: CommunityFeedResponse[]; pageParams: unknown[] } | undefined>(
    key,
    (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((p) => mutator(p)),
      };
    },
  );
}

/**
 * Mounts inside `CommunitySocketProvider` and translates socket events into
 * React Query cache mutations + invalidations. Keeps all routes in sync
 * without any polling.
 */
export function CommunitySocketBridge() {
  const qc = useQueryClient();
  const ctx = useCommunitySocketOptional();

  useEffect(() => {
    if (!ctx?.socket) return;
    const offs: Array<() => void> = [];

    // ─── Posts ──────────────────────────────────────────────────────────
    offs.push(
      ctx.on<PostNewPayload>(SOCKET_EVENTS.POST_NEW, ({ post }) => {
        if (!post?._id) return;
        const insert = (resp: CommunityFeedResponse) => {
          const dup = resp.posts.find((p) => p._id === post._id);
          if (dup) {
            return {
              ...resp,
              posts: resp.posts.map((p) =>
                p._id === post._id
                  ? mergeCommunityFeedItemMedia(
                      dup,
                      post as CommunityFeedItem,
                    )
                  : p,
              ),
            };
          }
          return {
            ...resp,
            posts: [post, ...resp.posts],
            total: (resp.total ?? 0) + 1,
          };
        };
        updateFeed(qc, "for-you", insert);
        updateFeed(qc, "explore", insert);
      }),
    );

    offs.push(
      ctx.on<LikedPayload>(SOCKET_EVENTS.POST_LIKED, (payload) => {
        if (!payload?.postId) return;
        patchPostInAllCaches(qc, payload.postId, (p) => ({
          ...p,
          likesCount: payload.likesCount ?? p.likesCount ?? 0,
        }));
      }),
    );

    offs.push(
      ctx.on<CommentedPayload>(SOCKET_EVENTS.POST_COMMENTED, (payload) => {
        if (!payload?.postId) return;
        patchPostInAllCaches(qc, payload.postId, (p) => ({
          ...p,
          commentsCount: (p.commentsCount ?? 0) + 1,
        }));
      }),
    );

    offs.push(
      ctx.on<RepostedPayload>(SOCKET_EVENTS.POST_REPOSTED, (payload) => {
        if (!payload?.postId) return;
        const count = payload.sharesCount;
        patchPostInAllCaches(qc, payload.postId, (p) => ({
          ...p,
          sharesCount:
            count ?? (p.sharesCount ?? 0) + 1,
        }));
      }),
    );

    offs.push(
      ctx.on<{ postId: string; sharesCount?: number }>(
        SOCKET_EVENTS.POST_UNREPOSTED,
        (payload) => {
          if (!payload?.postId) return;
          const count = payload.sharesCount;
          patchPostInAllCaches(qc, payload.postId, (p) => ({
            ...p,
            sharesCount:
              count ?? Math.max(0, (p.sharesCount ?? 1) - 1),
          }));
        },
      ),
    );

    // ─── Messages ───────────────────────────────────────────────────────
    offs.push(
      ctx.on<MessageNewPayload>(SOCKET_EVENTS.MESSAGE_NEW, (payload) => {
        if (!payload?.conversationId || !payload.message) return;
        const key = socialKeys.messages(payload.conversationId);
        qc.setQueryData<
          { pages: PagedList<DirectMessage>[]; pageParams: unknown[] } | undefined
        >(key, (prev) => {
          if (!prev) return prev;
          const id = String(payload.message._id);
          const exists = prev.pages.some((p) =>
            p.items.some((m) => String(m._id) === id),
          );
          if (exists) return prev;
          const [first, ...rest] = prev.pages;
          if (!first) return prev;
          return {
            ...prev,
            pages: [
              {
                ...first,
                items: [...first.items, payload.message],
                total: (first.total ?? 0) + 1,
              },
              ...rest,
            ],
          };
        });
        qc.invalidateQueries({ queryKey: socialKeys.conversations() });
      }),
    );

    offs.push(
      ctx.on<{
        conversationId: string;
        messageId?: string;
        message?: DirectMessage;
      }>(SOCKET_EVENTS.MESSAGE_UPDATED, (payload) => {
        if (!payload?.conversationId || !payload.message) return;
        const key = socialKeys.messages(payload.conversationId);
        const id = String(payload.message._id);
        qc.setQueryData<
          { pages: PagedList<DirectMessage>[]; pageParams: unknown[] } | undefined
        >(key, (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              items: page.items.map((m) =>
                String(m._id) === id
                  ? mergeDirectMessageMedia(m, payload.message!)
                  : m,
              ),
            })),
          };
        });
        qc.invalidateQueries({ queryKey: socialKeys.conversations() });
      }),
    );

    offs.push(
      ctx.on<{ conversationId: string; messageId: string }>(
        SOCKET_EVENTS.MESSAGE_DELETED,
        (payload) => {
          if (!payload?.conversationId || !payload.messageId) return;
          const key = socialKeys.messages(payload.conversationId);
          const mid = String(payload.messageId);
          qc.setQueryData<
            { pages: PagedList<DirectMessage>[]; pageParams: unknown[] } | undefined
          >(key, (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              pages: prev.pages.map((page) => ({
                ...page,
                items: page.items.filter((m) => String(m._id) !== mid),
              })),
            };
          });
          qc.invalidateQueries({ queryKey: socialKeys.conversations() });
        },
      ),
    );

    // ─── Notifications ─────────────────────────────────────────────────
    offs.push(
      ctx.on<NotificationNewPayload & { _id?: string }>(
        SOCKET_EVENTS.NOTIFICATION_NEW,
        (payload) => {
          if (!payload?._id) return;
          if (
            shouldSuppressNotification({
              type: payload.type,
              entityId: payload.entityId,
              meta: payload.meta as Record<string, unknown> | undefined,
            })
          ) {
            return;
          }
          prependNotification(qc, payload as CommunityNotification);
        },
      ),
    );

    offs.push(
      ctx.on<{ ids?: string[] | null; unread?: number; deletedId?: string }>(
        SOCKET_EVENTS.NOTIFICATION_READ,
        (payload) => {
          if (payload?.deletedId) {
            removeNotificationFromCache(qc, String(payload.deletedId));
          }
          if (payload?.ids?.length) {
            markIdsReadInCache(qc, payload.ids.map(String));
          }
          if (payload?.unread != null) {
            setUnreadCount(qc, payload.unread);
          }
        },
      ),
    );

    offs.push(
      ctx.on<{ unread?: number }>(SOCKET_EVENTS.NOTIFICATION_ALL_READ, (p) => {
        markIdsReadInCache(qc);
        if (p?.unread != null) setUnreadCount(qc, p.unread);
      }),
    );

    // ─── Group events ──────────────────────────────────────────────────
    const invalidateGroupPosts = (groupId?: string) => {
      if (!groupId) return;
      qc.invalidateQueries({
        queryKey: [...socialKeys.all, "group", groupId, "posts"],
      });
      qc.invalidateQueries({ queryKey: socialKeys.group(groupId) });
    };

    offs.push(
      ctx.on<{ groupId: string }>(SOCKET_EVENTS.GROUP_NEW_POST, (p) =>
        invalidateGroupPosts(p?.groupId),
      ),
    );
    offs.push(
      ctx.on<{ groupId: string }>(SOCKET_EVENTS.GROUP_ANNOUNCEMENT, (p) => {
        invalidateGroupPosts(p?.groupId);
        qc.invalidateQueries({ queryKey: socialKeys.notifications() });
      }),
    );
    offs.push(
      ctx.on<{ groupId: string }>(SOCKET_EVENTS.GROUP_NEW_MEMBER, (p) => {
        if (p?.groupId) {
          qc.invalidateQueries({ queryKey: socialKeys.group(p.groupId) });
        }
      }),
    );
    offs.push(
      ctx.on<{ groupId: string }>(SOCKET_EVENTS.GROUP_MEMBER_LEFT, (p) => {
        if (p?.groupId) {
          qc.invalidateQueries({ queryKey: socialKeys.group(p.groupId) });
        }
      }),
    );
    offs.push(
      ctx.on<{ groupId: string }>(SOCKET_EVENTS.GROUP_CHANNEL_CREATED, (p) => {
        if (p?.groupId) {
          qc.invalidateQueries({
            queryKey: [...socialKeys.all, "group", p.groupId, "channels"],
          });
        }
      }),
    );
    offs.push(
      ctx.on<{ groupId: string }>(SOCKET_EVENTS.GROUP_POST_PINNED, (p) => {
        if (p?.groupId) invalidateGroupPosts(p.groupId);
      }),
    );

    const patchGroupChatMessage = (
      groupId: string,
      messageId: string,
      patcher: (m: GroupChatMessage) => GroupChatMessage,
    ) => {
      const key = [...socialKeys.groupChat(groupId), "infinite"];
      qc.setQueriesData<{
        pages: GroupChatMessagesResponse[];
        pageParams: unknown[];
      }>({ queryKey: key }, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              m._id === messageId ? patcher(m) : m,
            ),
            pinnedMessages: page.pinnedMessages?.map((m) =>
              m._id === messageId ? patcher(m) : m,
            ),
          })),
        };
      });
    };

    offs.push(
      ctx.on<{
        groupId: string;
        message: GroupChatMessage;
      }>(SOCKET_EVENTS.GROUP_MESSAGE_NEW, (payload) => {
        if (!payload?.groupId || !payload.message?._id) return;
        const key = [...socialKeys.groupChat(payload.groupId), "infinite"];
        qc.setQueriesData<{
          pages: GroupChatMessagesResponse[];
          pageParams: unknown[];
        }>({ queryKey: key }, (prev) => {
          if (!prev?.pages?.length) return prev;
          const first = prev.pages[0];
          if (first.items.some((m) => m._id === payload.message._id)) {
            return prev;
          }
          return {
            ...prev,
            pages: [
              {
                ...first,
                items: [...first.items, payload.message],
              },
              ...prev.pages.slice(1),
            ],
          };
        });
        qc.invalidateQueries({
          queryKey: socialKeys.groupChatUnread(payload.groupId),
        });
      }),
    );

    offs.push(
      ctx.on<{ groupId: string; message: GroupChatMessage }>(
        SOCKET_EVENTS.GROUP_MESSAGE_UPDATED,
        (p) => {
          if (!p?.groupId || !p.message?._id) return;
          patchGroupChatMessage(p.groupId, p.message._id, (m) =>
            mergeGroupChatMessageMedia(m, p.message),
          );
        },
      ),
    );

    offs.push(
      ctx.on<{ groupId: string; messageId: string }>(
        SOCKET_EVENTS.GROUP_MESSAGE_DELETED,
        (p) => {
          if (!p?.groupId || !p.messageId) return;
          const key = [...socialKeys.groupChat(p.groupId), "infinite"];
          qc.setQueriesData<{
            pages: GroupChatMessagesResponse[];
            pageParams: unknown[];
          }>({ queryKey: key }, (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              pages: prev.pages.map((page) => ({
                ...page,
                items: page.items.filter((m) => m._id !== p.messageId),
                pinnedMessages: page.pinnedMessages?.filter(
                  (m) => m._id !== p.messageId,
                ),
              })),
            };
          });
        },
      ),
    );

    offs.push(
      ctx.on<{ groupId: string; message: GroupChatMessage }>(
        SOCKET_EVENTS.GROUP_MESSAGE_REACTION,
        (p) => {
          if (!p?.groupId || !p.message?._id) return;
          patchGroupChatMessage(p.groupId, p.message._id, (m) =>
            mergeGroupChatMessageMedia(m, p.message),
          );
        },
      ),
    );

    offs.push(
      ctx.on<{ groupId: string; pinnedMessages?: GroupChatMessage[] }>(
        SOCKET_EVENTS.GROUP_CHAT_PINNED,
        (p) => {
          if (!p?.groupId) return;
          const key = [...socialKeys.groupChat(p.groupId), "infinite"];
          qc.setQueriesData<{
            pages: GroupChatMessagesResponse[];
            pageParams: unknown[];
          }>({ queryKey: key }, (prev) => {
            if (!prev?.pages?.length) return prev;
            return {
              ...prev,
              pages: prev.pages.map((page, i) =>
                i === 0
                  ? { ...page, pinnedMessages: p.pinnedMessages ?? [] }
                  : page,
              ),
            };
          });
        },
      ),
    );

    offs.push(
      ctx.on<{ groupId: string; userId: string }>(
        SOCKET_EVENTS.GROUP_CHAT_SEEN,
        (p) => {
          if (p?.groupId) {
            qc.invalidateQueries({
              queryKey: socialKeys.groupChatUnread(p.groupId),
            });
          }
        },
      ),
    );
    offs.push(
      ctx.on<{ groupId: string }>(
        SOCKET_EVENTS.GROUP_MODERATION_ACTION,
        (p) => {
          if (p?.groupId) {
            qc.invalidateQueries({ queryKey: socialKeys.group(p.groupId) });
            invalidateGroupPosts(p.groupId);
          }
        },
      ),
    );

    // ─── Post deleted (group + global) ─────────────────────────────────
    offs.push(
      ctx.on<{ postId?: string; groupId?: string }>(
        SOCKET_EVENTS.POST_DELETED,
        (p) => {
          if (p?.groupId) invalidateGroupPosts(p.groupId);
          if (p?.postId) {
            removePostFromAllCaches(qc, p.postId);
          }
        },
      ),
    );

    // ─── Message seen ──────────────────────────────────────────────────
    offs.push(
      ctx.on<{
        conversationId: string;
        userId: string;
        lastSeenMessage?: string | null;
        lastSeenAt?: string;
      }>(SOCKET_EVENTS.MESSAGE_SEEN, (p) => {
        if (!p?.conversationId) return;
        // Patch the conversation list cache so unread counts collapse instantly.
        qc.setQueryData<PagedList<unknown> | undefined>(
          socialKeys.conversations(),
          (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              items: (prev.items as Array<Record<string, unknown>>).map(
                (conv) =>
                  (conv as { _id?: string })._id === p.conversationId
                    ? {
                        ...conv,
                        lastSeenAt: {
                          ...(conv as { lastSeenAt?: Record<string, string> })
                            .lastSeenAt,
                          [p.userId]: p.lastSeenAt ?? new Date().toISOString(),
                        },
                        lastSeenMessage: {
                          ...(conv as {
                            lastSeenMessage?: Record<string, string>;
                          }).lastSeenMessage,
                          ...(p.lastSeenMessage
                            ? { [p.userId]: p.lastSeenMessage }
                            : {}),
                        },
                      }
                    : conv,
              ),
            };
          },
        );
        // Patch messages in-place so the sender sees ticks update.
        qc.setQueryData<
          { pages: PagedList<DirectMessage>[]; pageParams: unknown[] } | undefined
        >(socialKeys.messages(p.conversationId), (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              items: page.items.map((msg) =>
                p.lastSeenMessage && msg._id <= p.lastSeenMessage
                  ? {
                      ...msg,
                      seenBy: Array.from(
                        new Set([...(msg.seenBy ?? []), p.userId]),
                      ),
                    }
                  : msg,
              ),
            })),
          };
        });
      }),
    );

    offs.push(
      ctx.on(SOCKET_EVENTS.CONTENT_REMOVED, (p) => {
        const postId = String((p as { targetId?: string }).targetId ?? "");
        if (!postId) return;
        removePostFromAllCaches(qc, postId);
      }),
    );

    offs.push(
      ctx.on(SOCKET_EVENTS.MESSAGE_REMOVED, (p) => {
        const groupId = String((p as { groupId?: string }).groupId ?? "");
        const messageId = String((p as { targetId?: string }).targetId ?? "");
        if (!groupId || !messageId) return;
        qc.setQueryData<
          | { pages: GroupChatMessagesResponse[]; pageParams: unknown[] }
          | undefined
        >(socialKeys.groupChat(groupId), (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              items: page.items.map((m) =>
                m._id === messageId
                  ? { ...m, deletedAt: new Date().toISOString(), text: "" }
                  : m,
              ),
            })),
          };
        });
      }),
    );

    offs.push(
      ctx.on(SOCKET_EVENTS.MODERATION_REPORT_UPDATED, () => {
        void qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      }),
    );

    return () => {
      for (const off of offs) off();
    };
  }, [ctx, ctx?.socket, ctx?.status, qc]);

  return null;
}
