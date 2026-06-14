import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type {
  UpdateCommunityProfileDto,
  CreateDmConversationDto,
  SendDmMessageDto,
  CreateGroupDto,
  MarkNotificationsReadDto,
  AiConsumeDto,
} from './dto/social.dto';

@Injectable()
export class CommunitySocialGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  profileByUsername(username: string) {
    return this.client.send(
      { cmd: 'app.community.profile.getByUsername' },
      { username },
    );
  }

  profileById(userId: string) {
    return this.client.send(
      { cmd: 'app.community.profile.getById' },
      { userId },
    );
  }

  updateMyProfile(userId: string, patch: UpdateCommunityProfileDto) {
    return this.client.send(
      { cmd: 'app.community.profile.updateMe' },
      { userId, patch },
    );
  }

  follow(followerId: string, followingId: string) {
    return this.client.send(
      { cmd: 'app.community.follow.follow' },
      { followerId, followingId },
    );
  }

  unfollow(followerId: string, followingId: string) {
    return this.client.send(
      { cmd: 'app.community.follow.unfollow' },
      { followerId, followingId },
    );
  }

  followers(userId: string, page?: number, limit?: number) {
    return this.client.send(
      { cmd: 'app.community.follow.followers' },
      { userId, page, limit },
    );
  }

  following(userId: string, page?: number, limit?: number) {
    return this.client.send(
      { cmd: 'app.community.follow.following' },
      { userId, page, limit },
    );
  }

  isFollowing(followerId: string, followingId: string) {
    return this.client.send(
      { cmd: 'app.community.follow.isFollowing' },
      { followerId, followingId },
    );
  }

  findOrCreateConversation(userId: string, dto: CreateDmConversationDto) {
    return this.client.send(
      { cmd: 'app.community.messaging.findOrCreate' },
      { userId, otherUserId: dto.otherUserId },
    );
  }

  listConversations(userId: string) {
    return this.client.send(
      { cmd: 'app.community.messaging.listConversations' },
      { userId },
    );
  }

  listMessages(
    conversationId: string,
    userId: string,
    page?: number,
    limit?: number,
  ) {
    return this.client.send(
      { cmd: 'app.community.messaging.listMessages' },
      { conversationId, userId, page, limit },
    );
  }

  sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendDmMessageDto,
  ) {
    return this.client.send(
      { cmd: 'app.community.messaging.send' },
      {
        conversationId,
        senderId,
        content: dto.content,
        attachments: dto.attachments,
        attachmentsMeta: dto.attachmentsMeta,
      },
    );
  }

  updateMessage(
    conversationId: string,
    messageId: string,
    userId: string,
    content: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.messaging.updateMessage' },
      { conversationId, messageId, userId, content },
    );
  }

  deleteMessage(
    conversationId: string,
    messageId: string,
    userId: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.messaging.deleteMessage' },
      { conversationId, messageId, userId },
    );
  }

  markConversationSeen(
    conversationId: string,
    userId: string,
    messageId?: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.messaging.seen' },
      { conversationId, userId, messageId },
    );
  }

  listNotifications(
    userId: string,
    opts?: {
      page?: number;
      limit?: number;
      cursor?: string;
      unreadOnly?: boolean;
    },
  ) {
    return this.client.send(
      { cmd: 'app.community.notifications.list' },
      { userId, ...opts },
    );
  }

  deleteNotification(userId: string, notificationId: string) {
    return this.client.send(
      { cmd: 'app.community.notifications.delete' },
      { userId, notificationId },
    );
  }

  clearReadNotifications(userId: string) {
    return this.client.send(
      { cmd: 'app.community.notifications.clearRead' },
      { userId },
    );
  }

  markNotificationsRead(userId: string, dto: MarkNotificationsReadDto) {
    return this.client.send(
      { cmd: 'app.community.notifications.markRead' },
      { userId, ids: dto.ids },
    );
  }

  createNotification(payload: {
    recipientId: string;
    actorId: string;
    type: string;
    entityType?: string;
    entityId?: string;
    title?: string;
    message?: string;
    meta?: Record<string, unknown>;
    force?: boolean;
  }) {
    return this.client.send(
      { cmd: 'app.community.notifications.create' },
      payload,
    );
  }

  dispatchNotificationFanOut(payload: {
    audience: Record<string, unknown>;
    template: Record<string, unknown>;
    dedupeEntityId?: string;
    chunkSize?: number;
  }) {
    return this.client.send(
      { cmd: 'app.community.notifications.dispatchFanOut' },
      payload,
    );
  }

  getNotificationPreferences(userId: string) {
    return this.client.send(
      { cmd: 'app.community.notifications.preferences.get' },
      { userId },
    );
  }

  updateNotificationPreferences(
    userId: string,
    patch: Record<string, boolean>,
  ) {
    return this.client.send(
      { cmd: 'app.community.notifications.preferences.update' },
      { userId, patch },
    );
  }

  setGroupChatNotificationsMuted(
    groupId: string,
    userId: string,
    muted: boolean,
  ) {
    return this.client.send(
      { cmd: 'app.community.groups.chatNotificationsMute' },
      { groupId, userId, muted },
    );
  }

  createGroup(ownerId: string, dto: CreateGroupDto) {
    return this.client.send(
      { cmd: 'app.community.groups.create' },
      {
        ownerId,
        dto: {
          name: dto.name,
          description: dto.description,
          visibility: dto.visibility,
          avatarUrl: dto.avatar,
        },
      },
    );
  }

  listGroups(page?: number, limit?: number, userId?: string) {
    return this.client.send(
      { cmd: 'app.community.groups.list' },
      { page, limit, userId },
    );
  }

  joinGroup(groupId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.community.groups.join' },
      { groupId, userId },
    );
  }

  leaveGroup(groupId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.community.groups.leave' },
      { groupId, userId },
    );
  }

  aiSubscription(userId: string) {
    return this.client.send(
      { cmd: 'app.community.ai.subscription' },
      { userId },
    );
  }

  aiCanUse(userId: string, feature: string) {
    return this.client.send(
      { cmd: 'app.community.ai.canUse' },
      { userId, feature },
    );
  }

  aiConsume(userId: string, dto: AiConsumeDto) {
    return this.client.send(
      { cmd: 'app.community.ai.consume' },
      {
        userId,
        feature: dto.feature,
        creditsUsed: dto.creditsUsed,
        meta: dto.meta,
      },
    );
  }

  aiStats(userId: string) {
    return this.client.send({ cmd: 'app.community.ai.stats' }, { userId });
  }

  communityFeed(viewerId: string | undefined, page?: number, limit?: number) {
    return this.client.send(
      { cmd: 'app.community.feed.get' },
      { viewerId, page, limit },
    );
  }

  // ─── Course Communities ─────────────────────────────────────────────────

  courseGroupByCourse(courseId: string, viewerId?: string) {
    return this.client.send(
      { cmd: 'app.community.courseGroup.getByCourse' },
      { courseId, viewerId },
    );
  }

  courseGroupEnsure(input: {
    courseId: string;
    instructorId: string;
    name: string;
    description?: string;
    triggerSource?: string;
  }) {
    return this.client.send(
      { cmd: 'app.community.courseGroup.ensure' },
      input,
    );
  }

  /** Idempotent: add learner to the course-linked community group. */
  courseGroupJoinMember(courseId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.community.courseGroup.joinMember' },
      { courseId, userId },
    );
  }

  /** Idempotent soft-delete of the LMS-linked course group (after course removal). */
  courseGroupSoftDeleteForDeletedCourse(input: {
    courseId: string;
    ownerId: string;
    communityGroupId?: string;
  }) {
    return this.client.send(
      { cmd: 'app.community.courseGroup.softDeleteForDeletedCourse' },
      input,
    );
  }

  groupById(groupId: string, viewerId?: string) {
    return this.client.send(
      { cmd: 'app.community.group.get' },
      { groupId, viewerId },
    );
  }

  groupChannelsList(groupId: string, viewerId?: string) {
    return this.client.send(
      { cmd: 'app.community.group.channels.list' },
      { groupId, viewerId },
    );
  }

  groupChannelsCreate(
    groupId: string,
    viewerId: string,
    dto: {
      name: string;
      type?: 'GENERAL' | 'QUESTIONS' | 'RESOURCES' | 'ANNOUNCEMENTS' | 'CUSTOM';
      isReadOnlyForMembers?: boolean;
    },
  ) {
    return this.client.send(
      { cmd: 'app.community.group.channels.create' },
      { groupId, viewerId, dto },
    );
  }

  groupPostsList(
    groupId: string,
    viewerId: string | undefined,
    page?: number,
    limit?: number,
    options?: {
      channelId?: string;
      postType?: 'DISCUSSION' | 'ANNOUNCEMENT' | 'QUESTION' | 'RESOURCE';
    },
  ) {
    return this.client.send(
      { cmd: 'app.community.group.posts.list' },
      {
        groupId,
        viewerId,
        page,
        limit,
        channelId: options?.channelId,
        postType: options?.postType,
      },
    );
  }

  groupPostsCreate(
    groupId: string,
    authorId: string,
    dto: {
      content: string;
      channelId?: string | null;
      postType?: 'DISCUSSION' | 'ANNOUNCEMENT' | 'QUESTION' | 'RESOURCE';
      images?: string[];
      hashtags?: string[];
      isPinned?: boolean;
    },
  ) {
    return this.client.send(
      { cmd: 'app.community.group.posts.create' },
      { groupId, authorId, dto },
    );
  }

  groupAnalytics(groupId: string, viewerId: string) {
    return this.client.send(
      { cmd: 'app.community.group.analytics' },
      { groupId, viewerId },
    );
  }

  courseCommunityAnalytics(courseId: string, viewerId: string) {
    return this.client.send(
      { cmd: 'app.community.course.analytics' },
      { courseId, viewerId },
    );
  }

  groupChatListMessages(
    groupId: string,
    userId: string,
    opts?: { page?: number; limit?: number; cursor?: string },
  ) {
    return this.client.send(
      { cmd: 'app.community.group.chat.listMessages' },
      { groupId, userId, ...opts },
    );
  }

  groupChatUpdateMessage(
    groupId: string,
    messageId: string,
    userId: string,
    text: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.group.chat.updateMessage' },
      { groupId, messageId, userId, text },
    );
  }

  groupChatDeleteMessage(
    groupId: string,
    messageId: string,
    userId: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.group.chat.deleteMessage' },
      { groupId, messageId, userId },
    );
  }

  groupChatToggleReaction(
    groupId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.group.chat.toggleReaction' },
      { groupId, messageId, userId, emoji },
    );
  }

  groupChatPinMessage(groupId: string, messageId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.community.group.chat.pinMessage' },
      { groupId, messageId, userId },
    );
  }

  groupChatUnpinMessage(groupId: string, messageId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.community.group.chat.unpinMessage' },
      { groupId, messageId, userId },
    );
  }

  groupChatSearch(
    groupId: string,
    userId: string,
    opts: {
      q?: string;
      senderId?: string;
      hasAttachment?: boolean;
      cursor?: string;
      limit?: number;
    },
  ) {
    return this.client.send(
      { cmd: 'app.community.group.chat.search' },
      { groupId, userId, ...opts },
    );
  }

  groupChatSend(
    groupId: string,
    senderId: string,
    dto: {
      text?: string;
      type?: 'text' | 'image' | 'file' | 'audio';
      attachmentUrl?: string | null;
      mimeType?: string | null;
      attachmentsMeta?: Array<{
        type: 'IMAGE' | 'VIDEO' | 'PDF' | 'VOICE' | 'FILE';
        url: string;
        key: string;
        mimeType?: string | null;
        size?: number;
        duration?: number | null;
        width?: number | null;
        height?: number | null;
        name?: string | null;
      }>;
      replyTo?: string | null;
    },
  ) {
    return this.client.send(
      { cmd: 'app.community.group.chat.send' },
      { groupId, senderId, ...dto },
    );
  }

  groupChatSeen(groupId: string, userId: string, messageId?: string) {
    return this.client.send(
      { cmd: 'app.community.group.chat.seen' },
      { groupId, userId, messageId },
    );
  }

  groupChatUnread(groupId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.community.group.chat.unread' },
      { groupId, userId },
    );
  }

  // ─── Moderation ─────────────────────────────────────────────────────────

  moderationMute(
    groupId: string,
    actorId: string,
    targetUserId: string,
    minutes?: number,
    reason?: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.moderation.muteMember' },
      { groupId, actorId, targetUserId, minutes, reason },
    );
  }

  moderationUnmute(
    groupId: string,
    actorId: string,
    targetUserId: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.moderation.unmuteMember' },
      { groupId, actorId, targetUserId },
    );
  }

  moderationRemove(
    groupId: string,
    actorId: string,
    targetUserId: string,
    reason?: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.moderation.removeMember' },
      { groupId, actorId, targetUserId, reason },
    );
  }

  moderationBan(
    groupId: string,
    actorId: string,
    targetUserId: string,
    reason?: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.moderation.banMember' },
      { groupId, actorId, targetUserId, reason },
    );
  }

  moderationUnban(
    groupId: string,
    actorId: string,
    targetUserId: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.moderation.unbanMember' },
      { groupId, actorId, targetUserId },
    );
  }

  moderationPin(
    groupId: string,
    actorId: string,
    postId: string,
    pinned: boolean,
  ) {
    return this.client.send(
      { cmd: 'app.community.moderation.pinPost' },
      { groupId, actorId, postId, pinned },
    );
  }

  moderationDeletePost(
    groupId: string,
    actorId: string,
    postId: string,
    reason?: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.moderation.deletePost' },
      { groupId, actorId, postId, reason },
    );
  }

  moderationLogs(
    groupId: string,
    viewerId: string,
    page?: number,
    limit?: number,
  ) {
    return this.client.send(
      { cmd: 'app.community.moderation.logs' },
      { groupId, viewerId, page, limit },
    );
  }

  // ─── Search ─────────────────────────────────────────────────────────────

  search(
    viewerId: string | undefined,
    query: string,
    type: 'all' | 'users' | 'posts' | 'groups' | 'hashtags' = 'all',
    limit?: number,
  ) {
    return this.client.send(
      { cmd: 'app.community.search' },
      { viewerId, query, type, limit },
    );
  }

  // ─── AI Moderation ──────────────────────────────────────────────────────

  aiModerationQueue(params: {
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    action?:
      | 'ALLOW'
      | 'FLAG'
      | 'SHADOW_BLOCK'
      | 'DELETE'
      | 'ESCALATE';
    reviewed?: 'pending' | 'done' | 'all';
    page?: number;
    limit?: number;
  }) {
    return this.client.send({ cmd: 'app.community.moderation.queue' }, params);
  }

  aiModerationResolve(
    resultId: string,
    moderatorId: string,
    action: 'ALLOW' | 'FLAG' | 'SHADOW_BLOCK' | 'DELETE' | 'ESCALATE',
  ) {
    return this.client.send(
      { cmd: 'app.community.moderation.resolve' },
      { resultId, moderatorId, action },
    );
  }

  aiModerationStats() {
    return this.client.send({ cmd: 'app.community.moderation.stats' }, {});
  }

  platformAnalytics() {
    return this.client.send({ cmd: 'app.community.analytics.platform' }, {});
  }

  createContentReport(payload: {
    reporterId: string;
    targetType: string;
    targetId: string;
    reason: string;
    description?: string;
    groupId?: string;
  }) {
    return this.client.send({ cmd: 'app.community.reports.create' }, payload);
  }

  adminListReports(params: {
    status?: string;
    targetType?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    return this.client.send({ cmd: 'app.community.admin.reports.list' }, params);
  }

  adminGetReport(reportId: string) {
    return this.client.send(
      { cmd: 'app.community.admin.reports.get' },
      { reportId },
    );
  }

  adminUpdateReportStatus(
    reportId: string,
    moderatorId: string,
    status: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.admin.reports.status' },
      { reportId, moderatorId, status },
    );
  }

  adminApplyReportAction(
    reportId: string,
    moderatorId: string,
    action: string,
    notes?: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.admin.reports.action' },
      { reportId, moderatorId, action, notes },
    );
  }

  lockGroupChat(
    groupId: string,
    actorId: string,
    minutes?: number,
    reason?: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.group.lockChat' },
      { groupId, actorId, minutes, reason },
    );
  }

  unlockGroupChat(groupId: string, actorId: string) {
    return this.client.send(
      { cmd: 'app.community.group.unlockChat' },
      { groupId, actorId },
    );
  }

  setGroupPostingDisabled(
    groupId: string,
    actorId: string,
    disabled: boolean,
    reason?: string,
  ) {
    return this.client.send(
      { cmd: 'app.community.group.postingDisabled' },
      { groupId, actorId, disabled, reason },
    );
  }
}
