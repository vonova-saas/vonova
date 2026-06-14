"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AiConsumeInput,
  checkAiUsage,
  checkFollowState,
  consumeAiCredits,
  createGroup,
  createGroupChannel,
  createGroupPost,
  CreateGroupInput,
  CreateGroupPostInput,
  createPost,
  CreatePostInput,
  fetchAiSubscription,
  fetchAiUsageStats,
  fetchCommunityFeed,
  fetchCourseCommunity,
  fetchExploreFeed,
  fetchGroupAnalytics,
  fetchGroupChannels,
  fetchGroupPosts,
  fetchGroupChatMessages,
  fetchGroupChatUnread,
  sendGroupChatMessage,
  markGroupChatSeen,
  fetchProfileByUsername,
  fetchProfileLmsIntegration,
  findOrCreateConversation,
  followUser,
  GroupPostType,
  joinGroup,
  leaveGroup,
  listConversations,
  listFollowers,
  listFollowing,
  listGroups,
  listMessages,
  listNotifications,
  markNotificationsRead,
  sendMessage,
  deleteDmMessage,
  updateDmMessage,
  unfollowUser,
  updateMyCommunityProfile,
  UpdateProfileInput,
} from "@/services/app/community/social.api";
import type {
  AiUsageStats,
  CommunityFeedResponse,
  DirectMessage,
  GroupChatMessage,
  GroupChatMessagesResponse,
  CommunityFollowState,
  ProfileLmsIntegrationBundle,
} from "@/types/api/app/community/social.types";
import {
  getFeatureCost,
  getMonthlyCreditAllowance,
} from "@/lib/ai/credits";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import {
  invalidatePostInteractionCaches,
  patchPostInAllCaches,
  removePostFromAllCaches,
} from "@/lib/community/post-cache-sync";
import {
  markIdsReadInCache,
  removeNotificationFromCache,
  setUnreadCount,
} from "@/lib/community/notification-cache";
import {
  clearReadNotifications,
  deleteNotification,
} from "@/services/app/community/social.api";
import { S3_PRESIGNED_QUERY_STALE_MS } from "@/lib/lms/presigned-url";

/** gcTime slightly above presign-aligned stale window so active views keep data through one refresh cycle */
const COMMUNITY_SIGNED_GC_MS = S3_PRESIGNED_QUERY_STALE_MS + 15 * 60 * 1000;

function toastMutationError(err: unknown, fallback: string) {
  const m =
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
      ? (err as { message: string }).message.trim()
      : "";
  toast.error(m || fallback);
}

export const socialKeys = {
  all: ["community-social"] as const,
  feed: (scope: "for-you" | "explore") =>
    [...socialKeys.all, "feed", scope] as const,
  profile: (username: string) =>
    [...socialKeys.all, "profile", username] as const,
  profileIntegration: (username: string) =>
    [...socialKeys.all, "profile-integration", username] as const,
  followers: (userId: string) =>
    [...socialKeys.all, "followers", userId] as const,
  following: (userId: string) =>
    [...socialKeys.all, "following", userId] as const,
  followState: (userId: string) =>
    [...socialKeys.all, "follow-state", userId] as const,
  postComments: (postId: string) =>
    [...socialKeys.all, "post-comments", postId] as const,
  postLikes: (postId: string) =>
    [...socialKeys.all, "post-likes", postId] as const,
  commentLikes: (commentId: string) =>
    [...socialKeys.all, "comment-likes", commentId] as const,
  conversations: () => [...socialKeys.all, "conversations"] as const,
  messages: (id: string) => [...socialKeys.all, "messages", id] as const,
  notifications: (unreadOnly = false) =>
    [...socialKeys.all, "notifications", unreadOnly ? "unread" : "all"] as const,
  groups: () => [...socialKeys.all, "groups"] as const,
  aiSubscription: () => [...socialKeys.all, "ai-subscription"] as const,
  aiStats: () => [...socialKeys.all, "ai-stats"] as const,
  aiCanUse: (feature: string) =>
    [...socialKeys.all, "ai-can-use", feature] as const,
  courseCommunity: (courseId: string) =>
    [...socialKeys.all, "course-community", courseId] as const,
  group: (groupId: string) =>
    [...socialKeys.all, "group", groupId] as const,
  groupChannels: (groupId: string) =>
    [...socialKeys.all, "group", groupId, "channels"] as const,
  groupPosts: (
    groupId: string,
    filters: { channelId?: string; postType?: string } = {},
  ) =>
    [
      ...socialKeys.all,
      "group",
      groupId,
      "posts",
      filters.channelId ?? "all-channels",
      filters.postType ?? "all-types",
    ] as const,
  groupAnalytics: (groupId: string) =>
    [...socialKeys.all, "group", groupId, "analytics"] as const,
  groupChat: (groupId: string) =>
    [...socialKeys.all, "group", groupId, "chat"] as const,
  groupChatUnread: (groupId: string) =>
    [...socialKeys.all, "group", groupId, "chat-unread"] as const,
  articles: (
    filters: {
      category?: string;
      search?: string;
      status?: string;
      author?: string;
    } = {},
  ) =>
    [
      ...socialKeys.all,
      "articles",
      filters.category ?? "all",
      filters.search ?? "",
      filters.status ?? "any",
      filters.author ?? "",
    ] as const,
  article: (id: string) => [...socialKeys.all, "article", id] as const,
  articleBySlug: (slug: string) =>
    [...socialKeys.all, "article", "slug", slug] as const,
  userPosts: (userId: string) =>
    [...socialKeys.all, "user-posts", userId] as const,
  communityPost: (postId: string) =>
    [...socialKeys.all, "post", postId] as const,
};

// ─── Profile ────────────────────────────────────────────────────────────────

export function useCommunityProfile(username: string | null | undefined) {
  return useQuery({
    queryKey: socialKeys.profile(username ?? ""),
    queryFn: () => fetchProfileByUsername(String(username)),
    enabled: !!username,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: COMMUNITY_SIGNED_GC_MS,
  });
}

export function useProfileLmsIntegration(
  username: string | null | undefined,
  enabled: boolean,
) {
  return useQuery<ProfileLmsIntegrationBundle>({
    queryKey: socialKeys.profileIntegration(username ?? ""),
    queryFn: () => fetchProfileLmsIntegration(String(username)),
    enabled: !!username?.trim() && enabled,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: COMMUNITY_SIGNED_GC_MS,
  });
}

export function useUpdateMyCommunityProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateProfileInput) => updateMyCommunityProfile(patch),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: socialKeys.all });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message ?? "Failed to update profile",
      );
    },
  });
}

// ─── Follow ─────────────────────────────────────────────────────────────────

export function useFollowState(userId: string | null | undefined) {
  const auth = useAuthContextOptional();
  return useQuery({
    queryKey: socialKeys.followState(userId ?? ""),
    queryFn: () => checkFollowState(String(userId)),
    enabled: !!userId && !!auth?.isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useFollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onMutate: async (userId) => {
      await qc.cancelQueries({ queryKey: socialKeys.followState(userId) });
      const prev = qc.getQueryData<CommunityFollowState>(
        socialKeys.followState(userId),
      );
      qc.setQueryData<CommunityFollowState>(socialKeys.followState(userId), {
        following: true,
      });
      return { prev, userId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(socialKeys.followState(ctx.userId), ctx.prev);
      }
      toast.error("Failed to follow user");
    },
    onSettled: (_d, _e, userId) => {
      qc.invalidateQueries({ queryKey: socialKeys.followState(userId) });
      qc.invalidateQueries({ queryKey: socialKeys.followers(userId) });
      qc.invalidateQueries({ queryKey: socialKeys.all });
    },
  });
}

export function useUnfollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unfollowUser(userId),
    onMutate: async (userId) => {
      await qc.cancelQueries({ queryKey: socialKeys.followState(userId) });
      const prev = qc.getQueryData<CommunityFollowState>(
        socialKeys.followState(userId),
      );
      qc.setQueryData<CommunityFollowState>(socialKeys.followState(userId), {
        following: false,
      });
      return { prev, userId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(socialKeys.followState(ctx.userId), ctx.prev);
      }
      toast.error("Failed to unfollow user");
    },
    onSettled: (_d, _e, userId) => {
      qc.invalidateQueries({ queryKey: socialKeys.followState(userId) });
      qc.invalidateQueries({ queryKey: socialKeys.followers(userId) });
      qc.invalidateQueries({ queryKey: socialKeys.all });
    },
  });
}

export function useFollowers(userId: string | null | undefined) {
  return useInfiniteQuery({
    queryKey: socialKeys.followers(userId ?? ""),
    queryFn: ({ pageParam = 1 }) =>
      listFollowers(String(userId), pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.items.length < 20 ? undefined : all.length + 1,
    enabled: !!userId,
  });
}

export function useFollowing(userId: string | null | undefined) {
  return useInfiniteQuery({
    queryKey: socialKeys.following(userId ?? ""),
    queryFn: ({ pageParam = 1 }) =>
      listFollowing(String(userId), pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.items.length < 20 ? undefined : all.length + 1,
    enabled: !!userId,
  });
}

// ─── Feed ───────────────────────────────────────────────────────────────────

export function useCommunityFeed(scope: "for-you" | "explore" = "for-you") {
  const fetcher = scope === "explore" ? fetchExploreFeed : fetchCommunityFeed;
  return useInfiniteQuery<CommunityFeedResponse>({
    queryKey: socialKeys.feed(scope),
    queryFn: ({ pageParam = 1 }) => fetcher(pageParam as number, 10),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: COMMUNITY_SIGNED_GC_MS,
    refetchOnMount: "always",
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => createPost(input),
    onSuccess: () => {
      toast.success("Post published");
      qc.invalidateQueries({ queryKey: socialKeys.feed("for-you") });
      qc.invalidateQueries({ queryKey: socialKeys.feed("explore") });
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "user-posts"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to publish post");
    },
  });
}

export function useUserPosts(userId: string | null | undefined) {
  return useInfiniteQuery({
    queryKey: socialKeys.userPosts(userId ?? ""),
    queryFn: async ({ pageParam = 1 }) => {
      const { fetchPostsByUser } = await import(
        "@/services/app/community/posts.api"
      );
      return fetchPostsByUser(String(userId), pageParam as number, 12);
    },
    initialPageParam: 1,
    enabled: !!userId,
    getNextPageParam: (last) =>
      (last.page ?? 1) < (last.totalPages ?? 1)
        ? (last.page ?? 1) + 1
        : undefined,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: COMMUNITY_SIGNED_GC_MS,
  });
}

export function useCommunityPost(postId: string | null | undefined) {
  return useQuery({
    queryKey: socialKeys.communityPost(postId ?? ""),
    queryFn: async () => {
      const { fetchPostById } = await import(
        "@/services/app/community/posts.api"
      );
      return fetchPostById(String(postId));
    },
    enabled: !!postId,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: COMMUNITY_SIGNED_GC_MS,
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: {
      postId: string;
      content: string;
      visibility?: "PUBLIC" | "FOLLOWERS";
      images?: File[];
      videos?: File[];
    }) => {
      const { updatePostRequest } = await import(
        "@/services/app/community/posts.api"
      );
      return updatePostRequest(opts.postId, {
        content: opts.content,
        visibility: opts.visibility,
        images: opts.images,
        videos: opts.videos,
      });
    },
    onSuccess: (_data, vars) => {
      toast.success("Post updated");
      qc.invalidateQueries({ queryKey: socialKeys.communityPost(vars.postId) });
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "user-posts"] });
      qc.invalidateQueries({ queryKey: socialKeys.feed("for-you") });
      qc.invalidateQueries({ queryKey: socialKeys.feed("explore") });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to update post");
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { deletePostRequest } = await import(
        "@/services/app/community/posts.api"
      );
      return deletePostRequest(postId);
    },
    onSuccess: (data, postId) => {
      toast.success("Post deleted");
      removePostFromAllCaches(qc, postId);
      if (data?.originalPostId) {
        const count = data.originalPostSharesCount;
        patchPostInAllCaches(qc, data.originalPostId, (p) => ({
          ...p,
          sharesCount:
            count ?? Math.max(0, (p.sharesCount ?? 1) - 1),
        }));
      }
      invalidatePostInteractionCaches(qc);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete post");
    },
  });
}

// ─── Messages ──────────────────────────────────────────────────────────────

export function useConversations() {
  return useQuery({
    queryKey: socialKeys.conversations(),
    queryFn: () => listConversations(),
    staleTime: 30 * 1000,
  });
}

export function useFindOrCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) => findOrCreateConversation(otherUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.conversations() });
    },
  });
}

export function useMessages(conversationId: string | null | undefined) {
  return useInfiniteQuery({
    queryKey: socialKeys.messages(conversationId ?? ""),
    queryFn: ({ pageParam = 1 }) =>
      listMessages(String(conversationId), pageParam as number, 50),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.page ?? 1;
      const limit = lastPage.limit ?? 50;
      const total = lastPage.total ?? 0;
      if (!lastPage.items?.length) return undefined;
      if (page * limit >= total) return undefined;
      return page + 1;
    },
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: ({
      content,
      attachments,
      attachmentsMeta,
    }: {
      content?: string;
      attachments?: string[];
      attachmentsMeta?: import("@/services/app/community/social.api").CommunityAttachment[];
    }) =>
      sendMessage(conversationId, {
        content,
        attachments,
        attachmentsMeta,
      }),
    onMutate: async ({ content, attachments, attachmentsMeta }) => {
      const key = socialKeys.messages(conversationId);
      await qc.cancelQueries({ queryKey: key });
      const tempId = `optim-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const optimistic = {
        _id: tempId,
        conversationId,
        senderId: "me",
        content: content ?? "",
        attachments: attachments ?? [],
        attachmentsMeta: attachmentsMeta ?? [],
        seenBy: [],
        createdAt: new Date().toISOString(),
        __optimistic: true,
      };
      const prev = qc.getQueryData(key);
      qc.setQueryData<
        | {
            pages: { items: typeof optimistic[]; total?: number }[];
            pageParams: unknown[];
          }
        | undefined
      >(key, (curr) => {
        if (!curr) return curr;
        const [first, ...rest] = curr.pages;
        if (!first) return curr;
        return {
          ...curr,
          pages: [
            { ...first, items: [...first.items, optimistic] },
            ...rest,
          ],
        };
      });
      return { prev, tempId };
    },
    onError: (_err, _vars, ctx) => {
      const key = socialKeys.messages(conversationId);
      if (ctx?.prev !== undefined) qc.setQueryData(key, ctx.prev);
      toast.error("Failed to send message");
    },
    onSuccess: (serverMsg, _vars, ctx) => {
      const key = socialKeys.messages(conversationId);
      const tempId = ctx?.tempId;
      if (serverMsg?._id && tempId) {
        qc.setQueryData<
          | {
              pages: { items: import("@/types/api/app/community/social.types").DirectMessage[]; total?: number }[];
              pageParams: unknown[];
            }
          | undefined
        >(key, (curr) => {
          if (!curr?.pages?.length) return curr;
          const sid = String(serverMsg._id);
          const pages = curr.pages.map((page, pageIndex) => {
            if (pageIndex !== 0) return page;
            const withoutTemp = page.items.filter(
              (m) => String(m._id) !== String(tempId),
            );
            const deduped = withoutTemp.filter((m) => String(m._id) !== sid);
            return {
              ...page,
              items: [...deduped, serverMsg],
            };
          });
          return { ...curr, pages };
        });
      } else {
        qc.invalidateQueries({ queryKey: key });
      }
      qc.invalidateQueries({ queryKey: socialKeys.conversations() });
    },
  });
}

export function useUpdateDmMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => updateDmMessage(conversationId, messageId, content),
    onSuccess: (serverMsg) => {
      const key = socialKeys.messages(conversationId);
      const mid = String(serverMsg._id);
      qc.setQueryData<
        | {
            pages: { items: DirectMessage[]; total?: number }[];
            pageParams: unknown[];
          }
        | undefined
      >(key, (curr) => {
        if (!curr?.pages) return curr;
        return {
          ...curr,
          pages: curr.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              String(m._id) === mid ? { ...m, ...serverMsg } : m,
            ),
          })),
        };
      });
      qc.invalidateQueries({ queryKey: socialKeys.conversations() });
      toast.success("Message updated");
    },
    onError: (err: unknown) =>
      toastMutationError(err, "Could not update message"),
  });
}

export function useDeleteDmMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: (messageId: string) =>
      deleteDmMessage(conversationId, messageId),
    onSuccess: (_data, messageId) => {
      const key = socialKeys.messages(conversationId);
      const mid = String(messageId);
      qc.setQueryData<
        | {
            pages: { items: DirectMessage[]; total?: number }[];
            pageParams: unknown[];
          }
        | undefined
      >(key, (curr) => {
        if (!curr?.pages) return curr;
        return {
          ...curr,
          pages: curr.pages.map((page) => ({
            ...page,
            items: page.items.filter((m) => String(m._id) !== mid),
          })),
        };
      });
      qc.invalidateQueries({ queryKey: socialKeys.conversations() });
      toast.success("Message deleted");
    },
    onError: (err: unknown) =>
      toastMutationError(err, "Could not delete message"),
  });
}

export function useMarkConversationSeen(conversationId: string) {
  return useMutation({
    mutationFn: (messageId?: string) =>
      import("@/services/app/community/social.api").then((m) =>
        m.markConversationSeen(conversationId, messageId),
      ),
  });
}

// ─── Notifications ─────────────────────────────────────────────────────────

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: socialKeys.notifications(unreadOnly),
    queryFn: () => listNotifications({ limit: 30, unreadOnly }),
    /** Align with presigned avatar/media TTL; realtime + sockets still update the list. */
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
  });
}

export function useNotificationsInfinite(unreadOnly = false) {
  return useInfiniteQuery({
    queryKey: [...socialKeys.notifications(unreadOnly), "infinite"],
    queryFn: ({ pageParam }) =>
      listNotifications({
        limit: 25,
        cursor: pageParam as string | undefined,
        unreadOnly,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => markNotificationsRead(ids),
    onSuccess: (data, ids) => {
      markIdsReadInCache(qc, ids);
      if (data?.unread != null) setUnreadCount(qc, data.unread);
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: (data, id) => {
      removeNotificationFromCache(qc, id);
      if (data?.unread != null) setUnreadCount(qc, data.unread);
    },
  });
}

export function useClearReadNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearReadNotifications(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "notifications"] });
    },
  });
}

// ─── Groups ────────────────────────────────────────────────────────────────

export function useGroups(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useInfiniteQuery({
    queryKey: socialKeys.groups(),
    queryFn: ({ pageParam = 1 }) => listGroups(pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.items.length < last.limit ? undefined : last.page + 1,
    enabled,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupInput) => createGroup(input),
    onSuccess: () => {
      toast.success("Group created");
      qc.invalidateQueries({ queryKey: socialKeys.groups() });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to create group");
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => joinGroup(groupId),
    onSuccess: () => {
      toast.success("Joined group");
      qc.invalidateQueries({ queryKey: socialKeys.groups() });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => leaveGroup(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.groups() });
    },
  });
}

// ─── AI subscription / credits ─────────────────────────────────────────────

export function useAiSubscription() {
  return useQuery({
    queryKey: socialKeys.aiSubscription(),
    queryFn: () => fetchAiSubscription(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAiUsageStats() {
  return useQuery({
    queryKey: socialKeys.aiStats(),
    queryFn: () => fetchAiUsageStats(),
    staleTime: 30 * 1000,
  });
}

export function useAiCanUse(feature: string | null | undefined) {
  return useQuery({
    queryKey: socialKeys.aiCanUse(feature ?? ""),
    queryFn: () => checkAiUsage(String(feature)),
    enabled: !!feature,
    staleTime: 15 * 1000,
  });
}

export function useConsumeAiCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AiConsumeInput) => consumeAiCredits(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: socialKeys.aiStats() });
      const previous = qc.getQueryData<AiUsageStats>(socialKeys.aiStats());
      if (previous) {
        const cost = input.creditsUsed ?? getFeatureCost(input.feature);
        const limit =
          previous.limit && previous.limit > 0
            ? previous.limit
            : getMonthlyCreditAllowance(previous.plan);
        const nextUsed = (previous.used ?? 0) + cost;
        qc.setQueryData<AiUsageStats>(socialKeys.aiStats(), {
          ...previous,
          used: nextUsed,
          remaining: Math.max(0, limit - nextUsed),
          limit,
        });
      }
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(socialKeys.aiStats(), ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: socialKeys.aiStats() });
      qc.invalidateQueries({ queryKey: socialKeys.aiSubscription() });
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "ai-can-use"] });
    },
  });
}

// ─── Course Communities ────────────────────────────────────────────────────

export function useCourseCommunity(courseId: string | null | undefined) {
  return useQuery({
    queryKey: socialKeys.courseCommunity(courseId ?? ""),
    queryFn: () => fetchCourseCommunity(String(courseId)),
    enabled: !!courseId,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: COMMUNITY_SIGNED_GC_MS,
    retry: (failureCount, err) => {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 403 || status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useGroupChannels(groupId: string | null | undefined) {
  return useQuery({
    queryKey: socialKeys.groupChannels(groupId ?? ""),
    queryFn: () => fetchGroupChannels(String(groupId)),
    enabled: !!groupId,
    staleTime: 60 * 1000,
  });
}

export function useGroupPosts(
  groupId: string | null | undefined,
  filters: { channelId?: string; postType?: GroupPostType } = {},
) {
  return useInfiniteQuery({
    queryKey: socialKeys.groupPosts(groupId ?? "", filters),
    queryFn: ({ pageParam = 1 }) =>
      fetchGroupPosts(String(groupId), pageParam as number, 20, filters),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    enabled: !!groupId,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: COMMUNITY_SIGNED_GC_MS,
  });
}

export function useCreateGroupPost(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupPostInput) =>
      createGroupPost(groupId, input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [...socialKeys.all, "group", groupId, "posts"],
      });
      qc.invalidateQueries({ queryKey: socialKeys.group(groupId) });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to publish post");
    },
  });
}

export function useCreateGroupChannel(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      type?:
        | "GENERAL"
        | "QUESTIONS"
        | "RESOURCES"
        | "ANNOUNCEMENTS"
        | "CUSTOM";
      isReadOnlyForMembers?: boolean;
    }) => createGroupChannel(groupId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.groupChannels(groupId) });
    },
  });
}

export function useGroupAnalytics(groupId: string | null | undefined) {
  return useQuery({
    queryKey: socialKeys.groupAnalytics(groupId ?? ""),
    queryFn: () => fetchGroupAnalytics(String(groupId)),
    enabled: !!groupId,
    staleTime: 30 * 1000,
  });
}

// ─── Articles ──────────────────────────────────────────────────────────────

export function useCommunityArticles(
  params: import("@/services/app/community/articles.api").ListArticlesParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: socialKeys.articles({
      category: params.category,
      search: params.search,
      status: params.status,
      author: params.author,
    }),
    queryFn: async () => {
      const { listArticles } = await import(
        "@/services/app/community/articles.api"
      );
      return listArticles(params);
    },
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: COMMUNITY_SIGNED_GC_MS,
    refetchOnMount: "always",
    enabled: options?.enabled ?? true,
  });
}

export function useCommunityArticle(id: string | null | undefined) {
  return useQuery({
    queryKey: socialKeys.article(id ?? ""),
    queryFn: async () => {
      const { getArticleById } = await import(
        "@/services/app/community/articles.api"
      );
      return getArticleById(String(id));
    },
    enabled: !!id,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: COMMUNITY_SIGNED_GC_MS,
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: import("@/services/app/community/articles.api").CreateArticleInput,
    ) => {
      const { createArticle } = await import(
        "@/services/app/community/articles.api"
      );
      return createArticle(input);
    },
    onSuccess: () => {
      toast.success("Article submitted");
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "articles"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to submit article");
    },
  });
}

export function useUpdateArticle(articleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: import("@/services/app/community/articles.api").UpdateArticleInput,
    ) => {
      const { updateArticle } = await import(
        "@/services/app/community/articles.api"
      );
      return updateArticle(articleId, input);
    },
    onSuccess: () => {
      toast.success("Article updated");
      qc.invalidateQueries({ queryKey: socialKeys.article(articleId) });
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "articles"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to update article");
    },
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { deleteArticle } = await import(
        "@/services/app/community/articles.api"
      );
      await deleteArticle(id);
    },
    onSuccess: (_void, id) => {
      toast.success("Article deleted");
      qc.removeQueries({ queryKey: socialKeys.article(id) });
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "articles"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete article");
    },
  });
}

// ─── Post interactions (likes, comments, shares) ────────────────────────────

export function usePostComments(postId: string | null | undefined) {
  return useQuery({
    queryKey: socialKeys.postComments(postId ?? ""),
    queryFn: async () => {
      const { fetchPostComments } = await import(
        "@/services/app/community/posts.api"
      );
      return fetchPostComments(String(postId), 1, 30);
    },
    enabled: !!postId,
    staleTime: 15 * 1000,
  });
}

export function useTogglePostLike() {
  const qc = useQueryClient();
  const auth = useAuthContextOptional();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { togglePostLike } = await import(
        "@/services/app/community/posts.api"
      );
      return togglePostLike(postId);
    },
    onMutate: async (postId) => {
      const meId = auth?.user?._id;
      if (!meId) return;
      patchPostInAllCaches(qc, postId, (p) => {
        if (String(p._id) !== String(postId)) return p;
        const likes = (p.likes ?? []).map(String);
        const liked = likes.includes(String(meId));
        const nextLiked = !liked;
        const nextLikes = nextLiked
          ? [...likes.filter((id) => id !== String(meId)), String(meId)]
          : likes.filter((id) => id !== String(meId));
        return {
          ...p,
          likes: nextLikes,
          likesCount: Math.max(
            0,
            (p.likesCount ?? 0) + (nextLiked ? 1 : -1),
          ),
        };
      });
    },
    onSuccess: (data, postId) => {
      const meId = auth?.user?._id;
      patchPostInAllCaches(qc, postId, (p) => {
        if (String(p._id) !== String(postId)) return p;
        const likes = (p.likes ?? []).map(String);
        const liked = data.liked ?? likes.includes(String(meId));
        const nextLikes =
          liked && meId
            ? [...likes.filter((id) => id !== String(meId)), String(meId)]
            : likes.filter((id) => id !== String(meId));
        return {
          ...p,
          likes: nextLikes,
          likesCount: data.likesCount ?? p.likesCount ?? 0,
        };
      });
      qc.invalidateQueries({ queryKey: socialKeys.postLikes(postId) });
      invalidatePostInteractionCaches(qc);
    },
    onError: () => {
      invalidatePostInteractionCaches(qc);
      toast.error("Could not update like");
    },
  });
}

export function useSharePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      comment,
    }: {
      postId: string;
      comment?: string;
    }) => {
      const { sharePostRequest } = await import(
        "@/services/app/community/posts.api"
      );
      return sharePostRequest(postId, comment);
    },
    onMutate: async ({ postId }) => {
      patchPostInAllCaches(qc, postId, (p) => ({
        ...p,
        sharesCount: (p.sharesCount ?? 0) + 1,
      }));
    },
    onSuccess: (data, { postId }) => {
      toast.success("Repost published");
      const count = data?.originalPostSharesCount;
      if (count != null) {
        patchPostInAllCaches(qc, postId, (p) => ({
          ...p,
          sharesCount: count,
        }));
      }
      invalidatePostInteractionCaches(qc);
    },
    onError: (_e, { postId }) => {
      patchPostInAllCaches(qc, postId, (p) => ({
        ...p,
        sharesCount: Math.max(0, (p.sharesCount ?? 1) - 1),
      }));
      invalidatePostInteractionCaches(qc);
      toast.error("Could not repost");
    },
  });
}

export function useCreatePostComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const { createPostComment } = await import(
        "@/services/app/community/posts.api"
      );
      return createPostComment(postId, text);
    },
    onMutate: async () => {
      patchPostInAllCaches(qc, postId, (p) => {
        if (String(p._id) !== String(postId)) return p;
        return {
          ...p,
          commentsCount: (p.commentsCount ?? 0) + 1,
        };
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.postComments(postId) });
      invalidatePostInteractionCaches(qc);
    },
    onError: () => {
      patchPostInAllCaches(qc, postId, (p) => {
        if (String(p._id) !== String(postId)) return p;
        return {
          ...p,
          commentsCount: Math.max(0, (p.commentsCount ?? 1) - 1),
        };
      });
      invalidatePostInteractionCaches(qc);
      toast.error("Could not post comment");
    },
  });
}

export function useToggleCommentLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { toggleCommentLikeRequest } = await import(
        "@/services/app/community/posts.api"
      );
      return toggleCommentLikeRequest(commentId);
    },
    onSuccess: (_d, commentId) => {
      qc.invalidateQueries({ queryKey: socialKeys.commentLikes(commentId) });
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === socialKeys.all[0] &&
          q.queryKey[1] === "post-comments",
      });
    },
    onError: () => {
      toast.error("Could not update comment like");
    },
  });
}

export function usePostLikers(
  postId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: socialKeys.postLikes(postId ?? ""),
    queryFn: async () => {
      const { fetchPostLikes } = await import(
        "@/services/app/community/posts.api"
      );
      return fetchPostLikes(String(postId), 1, 40);
    },
    enabled: !!postId && enabled,
    staleTime: 20 * 1000,
  });
}

export function useCommentLikers(
  commentId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: socialKeys.commentLikes(commentId ?? ""),
    queryFn: async () => {
      const { fetchCommentLikes } = await import(
        "@/services/app/community/posts.api"
      );
      return fetchCommentLikes(String(commentId), 1, 40);
    },
    enabled: !!commentId && enabled,
    staleTime: 20 * 1000,
  });
}

export function useGroupChatMessages(groupId: string | null | undefined) {
  return useInfiniteQuery({
    queryKey: [...socialKeys.groupChat(groupId ?? ""), "infinite"],
    queryFn: ({ pageParam }) =>
      fetchGroupChatMessages(String(groupId), {
        limit: 40,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!groupId,
    staleTime: 5_000,
  });
}

export function useGroupChatUnread(groupId: string | null | undefined) {
  return useQuery({
    queryKey: socialKeys.groupChatUnread(groupId ?? ""),
    queryFn: () => fetchGroupChatUnread(String(groupId)),
    enabled: !!groupId,
    refetchInterval: 30_000,
  });
}

export function useSendGroupChatMessage(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Parameters<typeof sendGroupChatMessage>[1],
    ) => sendGroupChatMessage(groupId, input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [...socialKeys.groupChat(groupId), "infinite"],
      });
      qc.invalidateQueries({ queryKey: socialKeys.groupChatUnread(groupId) });
    },
    onError: () => toast.error("Could not send message"),
  });
}

export function useUpdateGroupChatMessage(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      import("@/services/app/community/social.api").then((m) =>
        m.updateGroupChatMessage(groupId, messageId, content),
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [...socialKeys.groupChat(groupId), "infinite"],
      });
    },
  });
}

export function useDeleteGroupChatMessage(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      import("@/services/app/community/social.api").then((m) =>
        m.deleteGroupChatMessage(groupId, messageId),
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [...socialKeys.groupChat(groupId), "infinite"],
      });
    },
  });
}

export function useToggleGroupChatReaction(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      import("@/services/app/community/social.api").then((m) =>
        m.toggleGroupChatReaction(groupId, messageId, emoji),
      ),
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: [...socialKeys.groupChat(groupId), "infinite"],
      });
    },
  });
}

export function useMarkGroupChatSeen(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId?: string) => markGroupChatSeen(groupId, messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.groupChatUnread(groupId) });
    },
  });
}

export function useCreateReply(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      parentCommentId,
      text,
    }: {
      parentCommentId: string;
      text: string;
    }) => {
      const { createReplyRequest } = await import(
        "@/services/app/community/posts.api"
      );
      return createReplyRequest(postId, parentCommentId, text);
    },
    onMutate: async () => {
      patchPostInAllCaches(qc, postId, (p) => {
        if (String(p._id) !== String(postId)) return p;
        return {
          ...p,
          commentsCount: (p.commentsCount ?? 0) + 1,
        };
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.postComments(postId) });
      invalidatePostInteractionCaches(qc);
    },
    onError: () => {
      patchPostInAllCaches(qc, postId, (p) => {
        if (String(p._id) !== String(postId)) return p;
        return {
          ...p,
          commentsCount: Math.max(0, (p.commentsCount ?? 1) - 1),
        };
      });
      invalidatePostInteractionCaches(qc);
      toast.error("Could not post reply");
    },
  });
}
