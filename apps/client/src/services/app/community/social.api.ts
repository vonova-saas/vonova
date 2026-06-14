import API from "@/services/axios-client";
import type {
  AiSubscription,
  AiUsageGate,
  AiUsageStats,
  CommunityFeedResponse,
  CommunityFollowState,
  CommunityGroup,
  CommunityGroupVisibility,
  CommunityNotification,
  CommunityProfile,
  CommunityProfileSummary,
  DirectConversation,
  DirectMessage,
  GroupChatMessage,
  GroupChatMessagesResponse,
  PagedList,
  ProfileLmsIntegrationBundle,
} from "@/types/api/app/community/social.types";

const C = "/community";

type ApiEnvelope<T> = { message?: string; data: T };

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as object)) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export interface AiConsumeInput {
  feature: string;
  creditsUsed?: number;
  meta?: Record<string, unknown>;
}

export interface UpdateProfileInput {
  username?: string;
  headline?: string;
  bio?: string;
  experience?: string;
  skills?: string[];
  website?: string;
  github?: string;
  linkedin?: string;
  coverImageUrl?: string;
  profilePictureUrl?: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  avatar?: string;
  visibility?: CommunityGroupVisibility;
}

// ─── Profile ────────────────────────────────────────────────────────────────

export async function fetchProfileByUsername(
  username: string,
): Promise<CommunityProfile> {
  const res = await API.get(`${C}/profile/${encodeURIComponent(username)}`);
  const inner = unwrap<{ profile: CommunityProfile } | CommunityProfile>(res.data);
  return (inner as { profile?: CommunityProfile }).profile ?? (inner as CommunityProfile);
}

export async function updateMyCommunityProfile(
  patch: UpdateProfileInput,
): Promise<CommunityProfile> {
  const res = await API.patch(`${C}/profile/me`, patch);
  const inner = unwrap<{ profile: CommunityProfile } | CommunityProfile>(res.data);
  return (inner as { profile?: CommunityProfile }).profile ?? (inner as CommunityProfile);
}

export async function fetchProfileLmsIntegration(
  username: string,
): Promise<ProfileLmsIntegrationBundle> {
  const res = await API.get(
    `${C}/profile-integration/${encodeURIComponent(username)}`,
  );
  return unwrap<ProfileLmsIntegrationBundle>(res.data);
}

// ─── Follow ─────────────────────────────────────────────────────────────────

export async function followUser(userId: string) {
  const res = await API.post(`${C}/users/${userId}/follow`);
  return unwrap<{ following?: boolean; alreadyFollowing?: boolean }>(res.data);
}

export async function unfollowUser(userId: string) {
  const res = await API.delete(`${C}/users/${userId}/follow`);
  return unwrap<{ following: boolean }>(res.data);
}

export async function checkFollowState(
  userId: string,
): Promise<CommunityFollowState> {
  const res = await API.get(`${C}/users/${userId}/follow-state`);
  return unwrap<CommunityFollowState>(res.data);
}

export async function listFollowers(
  userId: string,
  page = 1,
  limit = 20,
): Promise<PagedList<CommunityProfileSummary>> {
  const res = await API.get(`${C}/users/${userId}/followers`, {
    params: { page, limit },
  });
  return unwrap<PagedList<CommunityProfileSummary>>(res.data);
}

export async function listFollowing(
  userId: string,
  page = 1,
  limit = 20,
): Promise<PagedList<CommunityProfileSummary>> {
  const res = await API.get(`${C}/users/${userId}/following`, {
    params: { page, limit },
  });
  return unwrap<PagedList<CommunityProfileSummary>>(res.data);
}

// ─── Feed ───────────────────────────────────────────────────────────────────

export async function fetchCommunityFeed(
  page = 1,
  limit = 10,
): Promise<CommunityFeedResponse> {
  const res = await API.get(`${C}/feed`, { params: { page, limit } });
  return unwrap<CommunityFeedResponse>(res.data);
}

export async function fetchExploreFeed(
  page = 1,
  limit = 10,
): Promise<CommunityFeedResponse> {
  const res = await API.get(`${C}/feed/explore`, { params: { page, limit } });
  return unwrap<CommunityFeedResponse>(res.data);
}

// ─── Posts ──────────────────────────────────────────────────────────────────

export interface CreatePostInput {
  content: string;
  tags?: string[];
  hashtags?: string[];
  visibility?: "PUBLIC" | "FOLLOWERS";
  courseId?: string;
  images?: File[];
  videos?: File[];
}

export interface CommunityCreatedPost {
  _id: string;
  content: string;
  author?: CommunityProfileSummary;
  images?: string[];
  videos?: string[];
  createdAt: string;
  visibility?: "PUBLIC" | "FOLLOWERS";
}

/**
 * Create a community post. Uses multipart/form-data so we can attach images
 * and short videos in the same request the gateway already supports.
 */
export async function createPost(
  input: CreatePostInput,
): Promise<{ post: CommunityCreatedPost }> {
  const form = new FormData();
  form.append("content", input.content);
  if (input.visibility) form.append("visibility", input.visibility);
  if (input.courseId) form.append("courseId", input.courseId);
  if (input.tags && input.tags.length > 0) {
    form.append("tags", JSON.stringify(input.tags));
  }
  if (input.hashtags && input.hashtags.length > 0) {
    form.append("hashtags", JSON.stringify(input.hashtags));
  }
  for (const file of input.images ?? []) form.append("files", file);
  for (const file of input.videos ?? []) form.append("videos", file);
  const res = await API.post(`/community/posts`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const inner = unwrap<
    { post: CommunityCreatedPost } | CommunityCreatedPost
  >(res.data);
  if (inner && typeof inner === "object" && "post" in inner) {
    return inner as { post: CommunityCreatedPost };
  }
  return { post: inner as CommunityCreatedPost };
}

// ─── Messaging ──────────────────────────────────────────────────────────────

export async function findOrCreateConversation(
  otherUserId: string,
): Promise<DirectConversation> {
  const res = await API.post(`${C}/messages/conversations`, { otherUserId });
  const inner = unwrap<{ conversation: DirectConversation } | DirectConversation>(
    res.data,
  );
  return (
    (inner as { conversation?: DirectConversation }).conversation ??
    (inner as DirectConversation)
  );
}

export async function listConversations(): Promise<DirectConversation[]> {
  const res = await API.get(`${C}/messages/conversations`);
  const inner = unwrap<{ conversations: DirectConversation[] } | DirectConversation[]>(
    res.data,
  );
  if (Array.isArray(inner)) return inner;
  return (inner as { conversations?: DirectConversation[] }).conversations ?? [];
}

export async function listMessages(
  conversationId: string,
  page = 1,
  limit = 50,
): Promise<PagedList<DirectMessage>> {
  const res = await API.get(`${C}/messages/conversations/${conversationId}`, {
    params: { page, limit },
  });
  return unwrap<PagedList<DirectMessage>>(res.data);
}

export type CommunityAttachmentKind =
  | "IMAGE"
  | "VIDEO"
  | "PDF"
  | "VOICE"
  | "FILE";

export interface CommunityAttachment {
  type: CommunityAttachmentKind;
  url: string;
  key: string;
  mimeType?: string | null;
  size?: number;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  name?: string | null;
}

export interface SendMessageInput {
  content?: string;
  attachments?: string[];
  attachmentsMeta?: CommunityAttachment[];
}

export async function sendMessage(
  conversationId: string,
  input: SendMessageInput | string,
  legacyAttachments?: string[],
): Promise<DirectMessage> {
  const body: SendMessageInput =
    typeof input === "string"
      ? { content: input, attachments: legacyAttachments }
      : input;
  const res = await API.post(
    `${C}/messages/conversations/${conversationId}/messages`,
    body,
  );
  const inner = unwrap<{ message: DirectMessage } | DirectMessage>(res.data);
  return (
    (inner as { message?: DirectMessage }).message ?? (inner as DirectMessage)
  );
}

export async function updateDmMessage(
  conversationId: string,
  messageId: string,
  content: string,
): Promise<DirectMessage> {
  const res = await API.patch(
    `${C}/messages/conversations/${conversationId}/messages/${messageId}`,
    { content },
  );
  const inner = unwrap<{ message: DirectMessage } | DirectMessage>(res.data);
  return (
    (inner as { message?: DirectMessage }).message ?? (inner as DirectMessage)
  );
}

export async function deleteDmMessage(
  conversationId: string,
  messageId: string,
): Promise<{ ok: boolean; messageId: string }> {
  const res = await API.delete(
    `${C}/messages/conversations/${conversationId}/messages/${messageId}`,
  );
  return unwrap<{ ok: boolean; messageId: string }>(res.data);
}

export async function markConversationSeen(
  conversationId: string,
  messageId?: string,
): Promise<{
  conversationId: string;
  userId: string;
  lastSeenMessage: string | null;
  lastSeenAt: string;
}> {
  const res = await API.post(
    `${C}/messages/conversations/${conversationId}/seen`,
    { messageId },
  );
  return unwrap(res.data);
}

// ─── Uploads ─────────────────────────────────────────────────────────────

const FLEX_CHECKSUM_QUERY = [
  "x-amz-checksum-crc32",
  "x-amz-checksum-crc32c",
  "x-amz-checksum-sha1",
  "x-amz-checksum-sha256",
  "x-amz-sdk-checksum-algorithm",
] as const;

function presignUrlSafeDiagnostics(url: string): {
  host: string;
  path: string;
  signedHeaders: string | null;
  checksumQueryKeys: string[];
} {
  try {
    const u = new URL(url);
    const checksumQueryKeys = FLEX_CHECKSUM_QUERY.filter((k) =>
      u.searchParams.has(k),
    );
    return {
      host: u.host,
      path: u.pathname,
      signedHeaders: u.searchParams.get("X-Amz-SignedHeaders"),
      checksumQueryKeys,
    };
  } catch {
    return {
      host: "(invalid-url)",
      path: "(invalid-url)",
      signedHeaders: null,
      checksumQueryKeys: [],
    };
  }
}

export interface PresignedPutResponse {
  url: string;
  key: string;
  location: string;
  expiresIn: number;
  kind: CommunityAttachmentKind;
  /** Exact Content-Type embedded in the signature — use for the PUT body headers. */
  contentType?: string;
}

export async function presignProfileAvatarUpload(body: {
  originalName: string;
  contentType: string;
  kind?: CommunityAttachmentKind;
}): Promise<PresignedPutResponse> {
  const res = await API.post(`${C}/profile/me/presign-avatar`, body);
  return unwrap<PresignedPutResponse>(res.data);
}

export async function presignProfileCoverUpload(body: {
  originalName: string;
  contentType: string;
  kind?: CommunityAttachmentKind;
}): Promise<PresignedPutResponse> {
  const res = await API.post(`${C}/profile/me/presign-cover`, body);
  return unwrap<PresignedPutResponse>(res.data);
}

export async function presignGroupUpload(
  groupId: string,
  body: {
    originalName: string;
    contentType: string;
    kind?: CommunityAttachmentKind;
  },
): Promise<PresignedPutResponse> {
  const res = await API.post(`${C}/groups/${groupId}/presign-upload`, body);
  return unwrap(res.data);
}

export async function presignMessageUpload(body: {
  originalName: string;
  contentType: string;
  kind?: CommunityAttachmentKind;
}): Promise<PresignedPutResponse> {
  const res = await API.post(`${C}/messages/presign-upload`, body);
  return unwrap(res.data);
}

// ─── Group chat (course groups; members only) ─────────────────────────────

export async function fetchGroupChatMessages(
  groupId: string,
  opts?: { page?: number; limit?: number; cursor?: string },
): Promise<GroupChatMessagesResponse> {
  const res = await API.get(`${C}/groups/${groupId}/chat/messages`, {
    params: {
      page: opts?.page,
      limit: opts?.limit ?? 40,
      cursor: opts?.cursor,
    },
  });
  return unwrap<GroupChatMessagesResponse>(res.data);
}

export async function updateGroupChatMessage(
  groupId: string,
  messageId: string,
  content: string,
): Promise<GroupChatMessage> {
  const res = await API.patch(
    `${C}/groups/${groupId}/chat/messages/${encodeURIComponent(messageId)}`,
    { content },
  );
  const inner = unwrap<{ message: GroupChatMessage } | GroupChatMessage>(res.data);
  return (inner as { message?: GroupChatMessage }).message ?? (inner as GroupChatMessage);
}

export async function deleteGroupChatMessage(
  groupId: string,
  messageId: string,
): Promise<{ ok: boolean; messageId: string }> {
  const res = await API.delete(
    `${C}/groups/${groupId}/chat/messages/${encodeURIComponent(messageId)}`,
  );
  return unwrap(res.data);
}

export async function toggleGroupChatReaction(
  groupId: string,
  messageId: string,
  emoji: string,
): Promise<GroupChatMessage> {
  const res = await API.post(
    `${C}/groups/${groupId}/chat/messages/${encodeURIComponent(messageId)}/reactions`,
    { emoji },
  );
  const inner = unwrap<{ message: GroupChatMessage }>(res.data);
  return inner.message;
}

export async function pinGroupChatMessage(
  groupId: string,
  messageId: string,
): Promise<{ pinnedMessages: GroupChatMessage[] }> {
  const res = await API.post(
    `${C}/groups/${groupId}/chat/messages/${encodeURIComponent(messageId)}/pin`,
  );
  return unwrap(res.data);
}

export async function unpinGroupChatMessage(
  groupId: string,
  messageId: string,
): Promise<{ pinnedMessages: GroupChatMessage[] }> {
  const res = await API.delete(
    `${C}/groups/${groupId}/chat/messages/${encodeURIComponent(messageId)}/pin`,
  );
  return unwrap(res.data);
}

export async function searchGroupChatMessages(
  groupId: string,
  opts: {
    q?: string;
    senderId?: string;
    hasAttachment?: boolean;
    cursor?: string;
    limit?: number;
  },
): Promise<{
  items: GroupChatMessage[];
  hasMore?: boolean;
  nextCursor?: string | null;
}> {
  const res = await API.get(`${C}/groups/${groupId}/chat/search`, {
    params: {
      q: opts.q,
      senderId: opts.senderId,
      hasAttachment: opts.hasAttachment ? "true" : undefined,
      cursor: opts.cursor,
      limit: opts.limit,
    },
  });
  return unwrap(res.data);
}

export async function fetchGroupChatUnread(
  groupId: string,
): Promise<{ unreadCount: number }> {
  const res = await API.get(`${C}/groups/${groupId}/chat/unread`);
  return unwrap<{ unreadCount: number }>(res.data);
}

export async function sendGroupChatMessage(
  groupId: string,
  input: SendMessageInput & {
    type?: "text" | "image" | "file" | "audio";
    replyTo?: string | null;
  },
): Promise<GroupChatMessage> {
  const res = await API.post(`${C}/groups/${groupId}/chat/messages`, {
    content: input.content ?? "",
    attachments: input.attachments,
    attachmentsMeta: input.attachmentsMeta,
    type: input.type,
    replyTo: input.replyTo,
  });
  const inner = unwrap<{ message: GroupChatMessage } | GroupChatMessage>(
    res.data,
  );
  return (
    (inner as { message?: GroupChatMessage }).message ??
    (inner as GroupChatMessage)
  );
}

export async function markGroupChatSeen(
  groupId: string,
  messageId?: string,
): Promise<{ ok: boolean; unreadCount: number }> {
  const res = await API.post(`${C}/groups/${groupId}/chat/seen`, { messageId });
  return unwrap<{ ok: boolean; unreadCount: number }>(res.data);
}

/**
 * Uploads a Blob/File directly to S3 using a presigned PUT URL. Returns the
 * public `location` once the upload succeeds. Surfaces progress through the
 * optional callback.
 */
export async function uploadToPresignedUrl(
  presigned: PresignedPutResponse,
  blob: Blob,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<{ url: string; key: string }> {
  const signedCt = presigned.contentType?.trim();
  const ct = signedCt || contentType;

  const urlDiag = presignUrlSafeDiagnostics(presigned.url);
  const bodyDesc =
    blob instanceof File
      ? "File"
      : blob instanceof Blob
        ? "Blob"
        : typeof blob;
  console.info(
    JSON.stringify({
      event: "[CLIENT PUT REQUEST]",
      contentType: ct,
      fileType: blob instanceof Blob ? blob.type : "",
      fileName: blob instanceof File ? blob.name : "",
      urlHost: urlDiag.host,
      urlPath: urlDiag.path,
      signedHeaders: urlDiag.signedHeaders,
      checksumQueryKeys: urlDiag.checksumQueryKeys,
      bodyKind: bodyDesc,
    }),
  );

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presigned.url, true);
    xhr.timeout = 120_000;
    xhr.setRequestHeader("Content-Type", ct);
    if (onProgress) {
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          onProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ url: presigned.location, key: presigned.key });
      } else {
        const detail = xhr.responseText?.slice(0, 400) ?? "";
        const failDiag = presignUrlSafeDiagnostics(presigned.url);
        console.error(
          JSON.stringify({
            event: "[S3 PUT FAILURE]",
            status: xhr.status,
            responseBodyPreview: detail,
            signedHeaders: failDiag.signedHeaders,
            checksumQueryKeys: failDiag.checksumQueryKeys,
            contentTypeSent: ct,
            hint:
              failDiag.checksumQueryKeys.length > 0
                ? "Presigned URL embeds flexible checksum params for an empty body; API must use S3Client requestChecksumCalculation WHEN_REQUIRED."
                : undefined,
          }),
        );
        let msg = `Upload failed (${xhr.status}).`;
        if (/SignatureDoesNotMatch|signature we calculated/i.test(detail)) {
          msg =
            failDiag.checksumQueryKeys.length > 0
              ? "Upload failed: S3 rejected the request (flexible checksum in presigned URL does not match file bytes). The API gateway must sign presigned PUTs with requestChecksumCalculation WHEN_REQUIRED."
              : "Image upload failed: S3 signature mismatch (verify Content-Type matches presign, URL unchanged, and clock skew).";
        } else if (xhr.status === 403) {
          msg = "Upload was rejected (403). Check file type and size limits.";
        }
        reject(new Error(msg));
      }
    };
    xhr.ontimeout = () =>
      reject(
        new Error(
          "Upload timed out. Try again with a smaller file or check your connection.",
        ),
      );
    xhr.onerror = () =>
      reject(
        new Error(
          "Could not connect to upload server. Check your network or VPN.",
        ),
      );
    xhr.send(blob);
  });
}

// ─── Search ──────────────────────────────────────────────────────────────

export type SearchType = "all" | "users" | "posts" | "groups" | "hashtags";

export interface CommunitySearchResult {
  query: string;
  users: CommunityProfileSummary[];
  posts: Array<{
    _id: string;
    content: string;
    author?: CommunityProfileSummary;
    hashtags?: string[];
    createdAt: string;
    likesCount?: number;
    commentsCount?: number;
  }>;
  groups: CommunityGroup[];
  hashtags: Array<{ tag: string; count: number }>;
}

export async function searchCommunity(params: {
  q: string;
  type?: SearchType;
  limit?: number;
}): Promise<CommunitySearchResult> {
  const res = await API.get(`${C}/search`, {
    params: { q: params.q, type: params.type ?? "all", limit: params.limit },
  });
  return unwrap(res.data);
}

// ─── Moderation ──────────────────────────────────────────────────────────

export type ModerationAction =
  | "MUTE_MEMBER"
  | "UNMUTE_MEMBER"
  | "REMOVE_MEMBER"
  | "BAN_MEMBER"
  | "UNBAN_MEMBER"
  | "APPROVE_MEMBER"
  | "PIN_POST"
  | "UNPIN_POST"
  | "DELETE_POST"
  | "LOCK_CHANNEL"
  | "UNLOCK_CHANNEL"
  | "SLOW_MODE";

export interface ModerationLog {
  _id: string;
  groupId: string;
  actorId: CommunityProfileSummary | string;
  action: ModerationAction;
  targetUserId?: CommunityProfileSummary | string | null;
  targetPostId?: string | null;
  reason?: string | null;
  createdAt: string;
}

export async function moderationMute(
  groupId: string,
  targetUserId: string,
  minutes?: number,
  reason?: string,
) {
  const res = await API.post(`${C}/groups/${groupId}/moderation/mute`, {
    targetUserId,
    minutes,
    reason,
  });
  return unwrap(res.data);
}

export async function moderationUnmute(
  groupId: string,
  targetUserId: string,
) {
  const res = await API.post(`${C}/groups/${groupId}/moderation/unmute`, {
    targetUserId,
  });
  return unwrap(res.data);
}

export async function moderationRemove(
  groupId: string,
  targetUserId: string,
  reason?: string,
) {
  const res = await API.post(`${C}/groups/${groupId}/moderation/remove`, {
    targetUserId,
    reason,
  });
  return unwrap(res.data);
}

export async function moderationBan(
  groupId: string,
  targetUserId: string,
  reason?: string,
) {
  const res = await API.post(`${C}/groups/${groupId}/moderation/ban`, {
    targetUserId,
    reason,
  });
  return unwrap(res.data);
}

export async function moderationUnban(
  groupId: string,
  targetUserId: string,
) {
  const res = await API.post(`${C}/groups/${groupId}/moderation/unban`, {
    targetUserId,
  });
  return unwrap(res.data);
}

export async function moderationPinPost(
  groupId: string,
  postId: string,
  pinned: boolean,
) {
  const res = await API.post(
    `${C}/groups/${groupId}/posts/${postId}/pin`,
    { pinned },
  );
  return unwrap(res.data);
}

export async function moderationDeletePost(
  groupId: string,
  postId: string,
  reason?: string,
) {
  const res = await API.delete(`${C}/groups/${groupId}/posts/${postId}`, {
    data: { reason },
  });
  return unwrap(res.data);
}

export async function listModerationLogs(
  groupId: string,
  page = 1,
  limit = 20,
) {
  const res = await API.get(`${C}/groups/${groupId}/moderation/logs`, {
    params: { page, limit },
  });
  return unwrap<{
    items: ModerationLog[];
    total: number;
    page: number;
    limit: number;
  }>(res.data);
}

// ─── Admin: AI moderation queue ─────────────────────────────────────────

export type AiModerationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AiModerationAction =
  | "ALLOW"
  | "FLAG"
  | "SHADOW_BLOCK"
  | "DELETE"
  | "ESCALATE";
export type AiModerationTarget =
  | "POST"
  | "COMMENT"
  | "MESSAGE"
  | "PROFILE"
  | "ARTICLE";
export type AiModerationCategory =
  | "TOXICITY"
  | "HATE_SPEECH"
  | "HARASSMENT"
  | "NSFW"
  | "SPAM"
  | "PHISHING"
  | "SELF_HARM"
  | "VIOLENCE"
  | "EXTREMIST"
  | "ILLEGAL";

export interface AiModerationResult {
  _id: string;
  targetType: AiModerationTarget;
  targetId: string;
  userId?: CommunityProfileSummary | string | null;
  aiProvider: string;
  aiModel: string;
  categories: AiModerationCategory[];
  confidence: number;
  severity: AiModerationSeverity;
  action: AiModerationAction;
  rawResponse?: { reasons?: string[]; sample?: string } | null;
  reviewedBy?: CommunityProfileSummary | string | null;
  reviewedAt?: string | null;
  reviewedAction?: AiModerationAction | null;
  createdAt: string;
}

export async function adminModerationQueue(params: {
  severity?: AiModerationSeverity;
  action?: AiModerationAction;
  reviewed?: "pending" | "done" | "all";
  page?: number;
  limit?: number;
}) {
  const res = await API.get(`${C}/admin/moderation/queue`, { params });
  return unwrap<{
    items: AiModerationResult[];
    total: number;
    page: number;
    limit: number;
  }>(res.data);
}

export async function adminModerationResolve(
  resultId: string,
  action: AiModerationAction,
) {
  const res = await API.post(`${C}/admin/moderation/${resultId}/resolve`, {
    action,
  });
  return unwrap<{ ok: boolean; result?: AiModerationResult }>(res.data);
}

export async function adminModerationStats() {
  const res = await API.get(`${C}/admin/moderation/stats`);
  return unwrap<{
    bySeverity: Array<{ _id: AiModerationSeverity; count: number }>;
    byAction: Array<{ _id: AiModerationAction; count: number }>;
    last24h: number;
  }>(res.data);
}

// ─── Admin: Platform analytics ──────────────────────────────────────────

export interface PlatformAnalytics {
  generatedAt: string;
  totals: {
    users: number;
    posts: number;
    groups: number;
    messages: number;
    follows: number;
  };
  activity: {
    dau: number;
    wau: number;
    mau: number;
    postsToday: number;
  };
  series: {
    postsLast7: Array<{ _id: string; count: number }>;
    messagesLast7: Array<{ _id: string; count: number }>;
    followsLast7: Array<{ _id: string; count: number }>;
  };
  topGroups: Array<{
    _id: string;
    name: string;
    visibility: "PUBLIC" | "PRIVATE";
    membersCount: number;
    postsCount: number;
    isCourseGroup?: boolean;
  }>;
  topAuthors: Array<{
    _id: string;
    posts: number;
    user: {
      _id: string;
      name?: string;
      username?: string;
      profilePictureUrl?: string;
    };
  }>;
  moderation: {
    byAction: Array<{ _id: AiModerationAction; count: number }>;
  };
}

export async function adminPlatformAnalytics(): Promise<PlatformAnalytics> {
  const res = await API.get(`${C}/admin/analytics`);
  return unwrap<PlatformAnalytics>(res.data);
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function listNotifications(opts?: {
  page?: number;
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
}): Promise<{
  items: CommunityNotification[];
  total: number;
  unread: number;
  page: number;
  limit: number;
  hasMore?: boolean;
  nextCursor?: string | null;
}> {
  const res = await API.get(`${C}/notifications`, {
    params: {
      page: opts?.page,
      limit: opts?.limit,
      cursor: opts?.cursor,
      unreadOnly: opts?.unreadOnly ? "true" : undefined,
    },
  });
  return unwrap(res.data);
}

export async function markNotificationsRead(ids?: string[]) {
  const res = await API.post(`${C}/notifications/read`, { ids });
  return unwrap<{ ok: boolean; unread?: number }>(res.data);
}

export async function deleteNotification(notificationId: string) {
  const res = await API.delete(
    `${C}/notifications/${encodeURIComponent(notificationId)}`,
  );
  return unwrap<{ ok: boolean; unread?: number }>(res.data);
}

export async function clearReadNotifications() {
  const res = await API.delete(`${C}/notifications/read/clear`);
  return unwrap<{ ok: boolean; deleted?: number }>(res.data);
}

export type NotificationPreferences = {
  userId: string;
  groupChat: boolean;
  mentions: boolean;
  enrollments: boolean;
  quizzes: boolean;
  lessons: boolean;
  announcements: boolean;
  marketing: boolean;
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await API.get(`${C}/notifications/preferences`);
  return unwrap<NotificationPreferences>(res.data);
}

export async function updateNotificationPreferences(
  patch: Partial<Omit<NotificationPreferences, "userId">>,
): Promise<NotificationPreferences> {
  const res = await API.patch(`${C}/notifications/preferences`, patch);
  return unwrap<NotificationPreferences>(res.data);
}

export async function setGroupChatNotificationsMuted(
  groupId: string,
  muted: boolean,
): Promise<{ ok: boolean; muted: boolean }> {
  const res = await API.post(
    `${C}/groups/${encodeURIComponent(groupId)}/chat/notifications-mute`,
    { muted },
  );
  return unwrap(res.data);
}

// ─── Groups ─────────────────────────────────────────────────────────────────

export async function listGroups(
  page = 1,
  limit = 20,
): Promise<PagedList<CommunityGroup>> {
  const res = await API.get(`${C}/groups`, { params: { page, limit } });
  return unwrap<PagedList<CommunityGroup>>(res.data);
}

export async function createGroup(input: CreateGroupInput): Promise<CommunityGroup> {
  const res = await API.post(`${C}/groups`, input);
  const inner = unwrap<{ group: CommunityGroup } | CommunityGroup>(res.data);
  return (inner as { group?: CommunityGroup }).group ?? (inner as CommunityGroup);
}

export async function joinGroup(groupId: string) {
  const res = await API.post(`${C}/groups/${groupId}/join`);
  return unwrap<{ joined: boolean }>(res.data);
}

export async function leaveGroup(groupId: string) {
  const res = await API.post(`${C}/groups/${groupId}/leave`);
  return unwrap<{ left: boolean }>(res.data);
}

// ─── AI subscription / credits ─────────────────────────────────────────────

export async function fetchAiSubscription(): Promise<AiSubscription> {
  const res = await API.get(`${C}/ai/subscription`);
  const inner = unwrap<{ subscription: AiSubscription } | AiSubscription>(res.data);
  return (
    (inner as { subscription?: AiSubscription }).subscription ??
    (inner as AiSubscription)
  );
}

export async function fetchAiUsageStats(): Promise<AiUsageStats> {
  const res = await API.get(`${C}/ai/stats`);
  return unwrap<AiUsageStats>(res.data);
}

export async function checkAiUsage(feature: string): Promise<AiUsageGate> {
  const res = await API.get(`${C}/ai/can-use`, { params: { feature } });
  return unwrap<AiUsageGate>(res.data);
}

export async function consumeAiCredits(input: AiConsumeInput) {
  const res = await API.post(`${C}/ai/consume`, input);
  return unwrap<{ ok: boolean; plan: string }>(res.data);
}

// ─── Course Communities ────────────────────────────────────────────────────

export type GroupRole =
  | "OWNER"
  | "ADMIN"
  | "MODERATOR"
  | "INSTRUCTOR"
  | "MEMBER"
  | "GUEST"
  | null;

export type CommunityGroupFull = CommunityGroup & {
  isCourseGroup?: boolean;
  courseId?: string | null;
  instructorId?: string | null;
  bannerUrl?: string | null;
  membersCount?: number;
  postsCount?: number;
};

export type GroupChannel = {
  _id: string;
  groupId: string;
  name: string;
  description?: string;
  type: "GENERAL" | "QUESTIONS" | "RESOURCES" | "ANNOUNCEMENTS" | "CUSTOM";
  isDefault?: boolean;
  isReadOnlyForMembers?: boolean;
  createdAt: string;
};

export type GroupPostType =
  | "DISCUSSION"
  | "ANNOUNCEMENT"
  | "QUESTION"
  | "RESOURCE";

export type GroupPost = {
  _id: string;
  content: string;
  author:
    | string
    | {
        _id: string;
        name?: string;
        username?: string;
        profilePictureUrl?: string;
      };
  hashtags?: string[];
  images?: string[] | null;
  postType: GroupPostType;
  isPinned?: boolean;
  channelId?: string | null;
  groupId?: string | null;
  likesCount?: number;
  commentsCount?: number;
  createdAt: string;
  updatedAt: string;
};

export interface CourseCommunityResponse {
  group: CommunityGroupFull;
  role: GroupRole;
}

export async function fetchCourseCommunity(
  courseId: string,
): Promise<CourseCommunityResponse> {
  const res = await API.get(`${C}/courses/${courseId}/community`);
  return unwrap<CourseCommunityResponse>(res.data);
}

export async function fetchGroupChannels(
  groupId: string,
): Promise<GroupChannel[]> {
  const res = await API.get(`${C}/groups/${groupId}/channels`);
  const inner = unwrap<{ channels: GroupChannel[] } | GroupChannel[]>(res.data);
  return (
    (inner as { channels?: GroupChannel[] }).channels ?? (inner as GroupChannel[])
  );
}

export async function createGroupChannel(
  groupId: string,
  input: {
    name: string;
    type?: GroupChannel["type"];
    isReadOnlyForMembers?: boolean;
  },
): Promise<GroupChannel> {
  const res = await API.post(`${C}/groups/${groupId}/channels`, input);
  const inner = unwrap<{ channel: GroupChannel } | GroupChannel>(res.data);
  return (
    (inner as { channel?: GroupChannel }).channel ?? (inner as GroupChannel)
  );
}

export interface GroupPostsResponse {
  posts: GroupPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pinned?: GroupPost[];
  group: CommunityGroupFull;
  role: GroupRole;
}

export async function fetchGroupPosts(
  groupId: string,
  page = 1,
  limit = 20,
  options: { channelId?: string; postType?: GroupPostType } = {},
): Promise<GroupPostsResponse> {
  const res = await API.get(`${C}/groups/${groupId}/posts`, {
    params: { page, limit, ...options },
  });
  return unwrap<GroupPostsResponse>(res.data);
}

export interface CreateGroupPostInput {
  content: string;
  channelId?: string | null;
  postType?: GroupPostType;
  images?: string[];
  hashtags?: string[];
  isPinned?: boolean;
}

export async function createGroupPost(
  groupId: string,
  input: CreateGroupPostInput,
): Promise<GroupPost> {
  const res = await API.post(`${C}/groups/${groupId}/posts`, input);
  const inner = unwrap<{ post: GroupPost } | GroupPost>(res.data);
  return (inner as { post?: GroupPost }).post ?? (inner as GroupPost);
}

export interface GroupAnalytics {
  postsTotal: number;
  postsByType: Array<{ _id: GroupPostType; count: number }>;
  topActiveMembers: Array<{
    _id: string;
    count: number;
    likes: number;
    comments: number;
  }>;
  since: string;
}

export async function fetchGroupAnalytics(
  groupId: string,
): Promise<GroupAnalytics> {
  const res = await API.get(`${C}/groups/${groupId}/analytics`);
  return unwrap<GroupAnalytics>(res.data);
}
