export type CommunityRole = "STUDENT" | "INSTRUCTOR_USER" | string;

export type CommunityProfile = {
  _id: string;
  name?: string;
  email?: string;
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
  role?: CommunityRole;
  followersCount?: number;
  followingCount?: number;
  isVerifiedInstructor?: boolean;
  createdAt?: string;
};

export type CommunityProfileSummary = Pick<
  CommunityProfile,
  | "_id"
  | "name"
  | "username"
  | "headline"
  | "profilePictureUrl"
  | "role"
  | "isVerifiedInstructor"
>;

export type CommunityFollowState = { following: boolean };

export type CommunityPostVisibility = "PUBLIC" | "FOLLOWERS";

export type CommunityFeedItem = {
  _id: string;
  content: string;
  author?: CommunityProfileSummary | string;
  hashtags?: string[];
  visibility?: CommunityPostVisibility;
  courseId?: string | null;
  isPinned?: boolean;
  instructorOnly?: boolean;
  image?: string | null;
  images?: string[] | null;
  video?: string | null;
  videos?: string[] | null;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  likes?: string[];
  sharedPost?: CommunityFeedItem | null;
  shareComment?: string | null;
  sharedBy?: CommunityProfileSummary | string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CommunityFeedResponse = {
  posts: CommunityFeedItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CommunityAttachmentKindLite =
  | "IMAGE"
  | "VIDEO"
  | "PDF"
  | "VOICE"
  | "FILE";

export type CommunityAttachmentLite = {
  type: CommunityAttachmentKindLite;
  url: string;
  key: string;
  mimeType?: string | null;
  size?: number;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  name?: string | null;
};

export type DirectConversation = {
  _id: string;
  participants: Array<string | CommunityProfileSummary>;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
  /** Per-participant cursor of the latest message they've seen. */
  lastSeenMessage?: Record<string, string>;
  lastSeenAt?: Record<string, string>;
  updatedAt?: string;
  createdAt?: string;
};

export type GroupChatReaction = {
  emoji: string;
  userId: string;
};

export type GroupChatMessage = {
  _id: string;
  groupId: string;
  senderId: string | CommunityProfileSummary;
  type?: "text" | "image" | "file" | "audio";
  text?: string;
  attachmentUrl?: string | null;
  mimeType?: string | null;
  attachmentsMeta?: CommunityAttachmentLite[];
  replyTo?: string | GroupChatMessage | null;
  reactions?: GroupChatReaction[];
  createdAt?: string;
  updatedAt?: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  __optimistic?: boolean;
};

export type GroupChatMessagesResponse = {
  items: GroupChatMessage[];
  total?: number;
  page?: number;
  limit: number;
  unreadCount: number;
  hasMore?: boolean;
  nextCursor?: string | null;
  pinnedMessages?: GroupChatMessage[];
};

export type DirectMessage = {
  _id: string;
  conversationId: string;
  /** Raw id string, or populated user object from the API, or `"me"` while optimistic. */
  senderId: string | CommunityProfileSummary;
  content: string;
  attachments?: string[];
  attachmentsMeta?: CommunityAttachmentLite[];
  seenBy?: string[];
  createdAt?: string;
  updatedAt?: string;
  editedAt?: string;
  /** Client-only flag used by optimistic UI. */
  __optimistic?: boolean;
};

export type CommunityNotificationType =
  | "LIKE"
  | "COMMENT"
  | "REPLY"
  | "FOLLOW"
  | "MESSAGE"
  | "GROUP_CHAT"
  | "ENROLLMENT"
  | "LESSON_PUBLISHED"
  | "QUIZ_PUBLISHED"
  | "QUIZ_RESULT"
  | "SHEET_ASSIGNED"
  | "COURSE_ANNOUNCEMENT"
  | "QUIZ_PUBLISHED"
  | "GROUP_INVITE"
  | "COURSE_INVITE"
  | "MENTION"
  | "REPOST"
  | string;

export type CommunityNotification = {
  _id: string;
  userId: string;
  type: CommunityNotificationType;
  actorId?: string | CommunityProfileSummary;
  entityType?: string;
  entityId?: string;
  title?: string;
  message?: string;
  read: boolean;
  meta?: Record<string, unknown>;
  createdAt?: string;
};

export type CommunityGroupVisibility = "PUBLIC" | "PRIVATE";

export type CommunityGroup = {
  _id: string;
  name: string;
  description?: string;
  avatarUrl?: string | null;
  ownerId?: string | CommunityProfileSummary;
  members?: Array<string | CommunityProfileSummary>;
  visibility: CommunityGroupVisibility;
  /** When true, linked to an LMS course; open via `/community/courses/:courseId`. */
  isCourseGroup?: boolean;
  /** Course spaces are not discoverable as global-feed content. */
  coursePrivacyMode?: "NONE" | "COURSE_PRIVATE";
  courseId?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** `GET .../community/profile-integration/:username` (self only). */
export type ProfileLmsIntegrationBundle = {
  profileUserId: string;
  role: string | null;
  groups: CommunityGroup[];
  groupsTotal: number;
  enrolledCourses: Array<{
    course: unknown;
    progress: number;
    status: string;
    enrollmentId: string;
  }>;
  teachingCourses: { items: unknown[] };
};

export type AiSubscriptionPlan = "FREE" | "PRO";

export type AiSubscription = {
  _id?: string;
  userId: string;
  plan: AiSubscriptionPlan;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AiUsageFeature =
  | "PDF_CHAT"
  | "PDF_SUMMARY"
  | "QUIZ_GENERATION"
  | "ARTICLE_GENERATION"
  | "MINDMAP_GENERATION";

export type AiUsageStats = {
  plan: AiSubscriptionPlan;
  used?: number;
  remaining?: number;
  limit?: number;
  today: Array<{ _id: AiUsageFeature; count: number; credits?: number }>;
};

export type AiUsageGate = {
  allowed: boolean;
  plan: AiSubscriptionPlan;
  reason?: string;
  cost?: number;
  used?: number;
  remaining?: number;
  limit?: number;
};

export type PagedList<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
