import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { SocialHubService } from './social-hub.service';
import { AiModerationService } from './ai-moderation.service';
import { ContentReportService } from './content-report.service';
import type {
  ModerationResolutionAction,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from './moderation.constants';

@Controller()
export class CommunitySocialController {
  private readonly logger = new Logger('CommunitySocialController');

  constructor(
    private readonly social: SocialHubService,
    private readonly aiModeration: AiModerationService,
    private readonly reports: ContentReportService,
  ) {}

  @MessagePattern({ cmd: 'app.community.profile.getByUsername' })
  async profileByUsername(@Payload() data: { username: string }) {
    if (!data?.username) throw new Error('username is required');
    const profile = await this.social.getProfileByUsername(data.username);
    return { message: 'ok', data: { profile } };
  }

  @MessagePattern({ cmd: 'app.community.profile.getById' })
  async profileById(@Payload() data: { userId: string }) {
    if (!data?.userId) throw new Error('userId is required');
    const profile = await this.social.getProfileById(data.userId);
    return { message: 'ok', data: { profile } };
  }

  @MessagePattern({ cmd: 'app.community.profile.updateMe' })
  async profileUpdate(
    @Payload() data: { userId: string; patch: Record<string, unknown> },
  ) {
    if (!data?.userId) throw new Error('userId is required');
    const profile = await this.social.updateMyProfile(data.userId, data.patch as any);
    return { message: 'ok', data: { profile } };
  }

  @MessagePattern({ cmd: 'app.community.follow.follow' })
  async follow(@Payload() data: { followerId: string; followingId: string }) {
    const r = await this.social.followUser(data.followerId, data.followingId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.follow.unfollow' })
  async unfollow(@Payload() data: { followerId: string; followingId: string }) {
    const r = await this.social.unfollowUser(data.followerId, data.followingId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.follow.followers' })
  async followers(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    const r = await this.social.listFollowers(
      data.userId,
      data.page,
      data.limit,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.follow.following' })
  async following(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    const r = await this.social.listFollowing(
      data.userId,
      data.page,
      data.limit,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.follow.isFollowing' })
  async isFollowing(
    @Payload() data: { followerId: string; followingId: string },
  ) {
    const r = await this.social.isFollowing(data.followerId, data.followingId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.messaging.findOrCreate' })
  async dmFind(@Payload() data: { userId: string; otherUserId: string }) {
    const conv = await this.social.findOrCreateConversation(
      data.userId,
      data.otherUserId,
    );
    return { message: 'ok', data: { conversation: conv } };
  }

  @MessagePattern({ cmd: 'app.community.messaging.listConversations' })
  async dmList(@Payload() data: { userId: string }) {
    const items = await this.social.listConversations(data.userId);
    return { message: 'ok', data: { conversations: items } };
  }

  @MessagePattern({ cmd: 'app.community.messaging.listMessages' })
  async dmMessages(
    @Payload() data: {
      conversationId: string;
      userId: string;
      page?: number;
      limit?: number;
    },
  ) {
    const r = await this.social.listMessages(
      data.conversationId,
      data.userId,
      data.page,
      data.limit,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.messaging.send' })
  async dmSend(
    @Payload() data: {
      conversationId: string;
      senderId: string;
      content: string;
      attachments?: string[];
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
    },
  ) {
    const result = await this.social.sendMessage(
      data.conversationId,
      data.senderId,
      data.content,
      data.attachments,
      data.attachmentsMeta,
    );
    return { message: 'ok', data: result };
  }

  @MessagePattern({ cmd: 'app.community.messaging.updateMessage' })
  async dmUpdate(
    @Payload()
    data: {
      conversationId: string;
      messageId: string;
      userId: string;
      content: string;
    },
  ) {
    const msg = await this.social.updateDirectMessage(
      data.conversationId,
      data.messageId,
      data.userId,
      data.content,
    );
    return { message: 'ok', data: { message: msg } };
  }

  @MessagePattern({ cmd: 'app.community.messaging.deleteMessage' })
  async dmDelete(
    @Payload()
    data: { conversationId: string; messageId: string; userId: string },
  ) {
    const r = await this.social.deleteDirectMessage(
      data.conversationId,
      data.messageId,
      data.userId,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.messaging.seen' })
  async dmSeen(
    @Payload()
    data: { conversationId: string; userId: string; messageId?: string },
  ) {
    const r = await this.social.markConversationSeen(
      data.conversationId,
      data.userId,
      data.messageId,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.notifications.list' })
  async notifList(
    @Payload()
    data: {
      userId: string;
      page?: number;
      limit?: number;
      cursor?: string;
      unreadOnly?: boolean;
    },
  ) {
    const r = await this.social.listNotifications(data.userId, {
      page: data.page,
      limit: data.limit,
      cursor: data.cursor,
      unreadOnly: data.unreadOnly,
    });
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.notifications.markRead' })
  async notifRead(@Payload() data: { userId: string; ids?: string[] }) {
    const r = await this.social.markNotificationsRead(data.userId, data.ids);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.notifications.create' })
  async notifCreate(
    @Payload()
    data: {
      recipientId: string;
      actorId: string;
      type: string;
      entityType?: string;
      entityId?: string;
      title?: string;
      message?: string;
      meta?: Record<string, unknown>;
    },
  ) {
    const r = await this.social.createNotification(data);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.notifications.delete' })
  async notifDelete(
    @Payload() data: { userId: string; notificationId: string },
  ) {
    const r = await this.social.deleteNotification(
      data.userId,
      data.notificationId,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.notifications.clearRead' })
  async notifClearRead(@Payload() data: { userId: string }) {
    const r = await this.social.clearReadNotifications(data.userId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.notifications.dispatchFanOut' })
  async notifDispatchFanOut(
    @Payload()
    data: {
      audience: Record<string, unknown>;
      template: Record<string, unknown>;
      dedupeEntityId?: string;
      chunkSize?: number;
    },
  ) {
    const r = await this.social.dispatchNotificationFanOut(data as never);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.notifications.preferences.get' })
  async notifPrefsGet(@Payload() data: { userId: string }) {
    const r = await this.social.getNotificationPreferences(data.userId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.notifications.preferences.update' })
  async notifPrefsUpdate(
    @Payload() data: { userId: string; patch: Record<string, boolean> },
  ) {
    const r = await this.social.updateNotificationPreferences(
      data.userId,
      data.patch,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.groups.chatNotificationsMute' })
  async groupChatMute(
    @Payload() data: { groupId: string; userId: string; muted: boolean },
  ) {
    const r = await this.social.setGroupChatNotificationsMuted(
      data.groupId,
      data.userId,
      data.muted,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.groups.create' })
  async groupCreate(
    @Payload() data: { ownerId: string; dto: Record<string, unknown> },
  ) {
    const g = await this.social.createGroup(data.ownerId, data.dto as any);
    return { message: 'ok', data: { group: g } };
  }

  @MessagePattern({ cmd: 'app.community.groups.list' })
  async groupList(
    @Payload() data: { page?: number; limit?: number; userId?: string },
  ) {
    const r = await this.social.listGroups(data.page, data.limit, data.userId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.groups.join' })
  async groupJoin(@Payload() data: { groupId: string; userId: string }) {
    const r = await this.social.joinGroup(data.groupId, data.userId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.groups.leave' })
  async groupLeave(@Payload() data: { groupId: string; userId: string }) {
    const r = await this.social.leaveGroup(data.groupId, data.userId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.ai.subscription' })
  async aiSub(@Payload() data: { userId: string }) {
    const sub = await this.social.getOrCreateAiSubscription(data.userId);
    return { message: 'ok', data: { subscription: sub } };
  }

  @MessagePattern({ cmd: 'app.community.ai.canUse' })
  async aiCan(@Payload() data: { userId: string; feature: string }) {
    const r = await this.social.canUseAiFeature(data.userId, data.feature);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.ai.consume' })
  async aiConsume(
    @Payload() data: {
      userId: string;
      feature: string;
      creditsUsed?: number;
      meta?: Record<string, unknown>;
    },
  ) {
    const r = await this.social.consumeAiCredits(
      data.userId,
      data.feature,
      data.creditsUsed,
      data.meta,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.ai.stats' })
  async aiStats(@Payload() data: { userId: string }) {
    const r = await this.social.getAiUsageStats(data.userId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.feed.get' })
  async feed(
    @Payload() data: { viewerId?: string; page?: number; limit?: number },
  ) {
    const r = await this.social.getCommunityFeed(
      data.viewerId,
      data.page,
      data.limit,
    );
    return { message: 'ok', data: r };
  }

  // ─── Course Communities (request/response) ──────────────────────────────

  @MessagePattern({ cmd: 'app.community.courseGroup.getByCourse' })
  async courseGroupGetByCourse(
    @Payload() data: { courseId: string; viewerId?: string },
  ) {
    const r = await this.social.getGroupByCourseId(
      data.courseId,
      data.viewerId,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.courseGroup.ensure' })
  async courseGroupEnsure(
    @Payload()
    data: {
      courseId: string;
      instructorId: string;
      name: string;
      description?: string;
      triggerSource?: string;
    },
  ) {
    const g = await this.social.ensureCourseGroup({
      courseId: data.courseId,
      instructorId: data.instructorId,
      name: data.name,
      description: data.description,
      triggerSource:
        data.triggerSource ?? 'rpc.app.community.courseGroup.ensure',
    });
    return { message: 'ok', data: { group: g } };
  }

  @MessagePattern({ cmd: 'app.community.courseGroup.joinMember' })
  async courseGroupJoinMember(
    @Payload() data: { courseId: string; userId: string },
  ) {
    const r = await this.social.joinCourseGroup(data.courseId, data.userId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.courseGroup.softDeleteForDeletedCourse' })
  async courseGroupSoftDeleteForDeletedCourse(
    @Payload()
    data: { courseId: string; ownerId: string; communityGroupId?: string },
  ) {
    const r = await this.social.softDeleteCourseGroupForDeletedCourse(data);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.get' })
  async groupGet(
    @Payload() data: { groupId: string; viewerId?: string },
  ) {
    const r = await this.social.getGroupById(data.groupId, data.viewerId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.channels.list' })
  async groupChannelsList(
    @Payload() data: { groupId: string; viewerId?: string },
  ) {
    const channels = await this.social.listGroupChannels(
      data.groupId,
      data.viewerId,
    );
    return { message: 'ok', data: { channels } };
  }

  @MessagePattern({ cmd: 'app.community.group.channels.create' })
  async groupChannelsCreate(
    @Payload()
    data: {
      groupId: string;
      viewerId: string;
      dto: {
        name: string;
        type?: 'GENERAL' | 'QUESTIONS' | 'RESOURCES' | 'ANNOUNCEMENTS' | 'CUSTOM';
        isReadOnlyForMembers?: boolean;
      };
    },
  ) {
    const channel = await this.social.createGroupChannel(
      data.groupId,
      data.viewerId,
      data.dto,
    );
    return { message: 'ok', data: { channel } };
  }

  @MessagePattern({ cmd: 'app.community.group.posts.list' })
  async groupPostsList(
    @Payload()
    data: {
      groupId: string;
      viewerId?: string;
      page?: number;
      limit?: number;
      channelId?: string;
      postType?: 'DISCUSSION' | 'ANNOUNCEMENT' | 'QUESTION' | 'RESOURCE';
    },
  ) {
    const r = await this.social.listGroupPosts(data.groupId, data.viewerId, {
      page: data.page,
      limit: data.limit,
      channelId: data.channelId,
      postType: data.postType,
    });
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.posts.create' })
  async groupPostsCreate(
    @Payload()
    data: {
      groupId: string;
      authorId: string;
      dto: {
        content: string;
        channelId?: string | null;
        postType?: 'DISCUSSION' | 'ANNOUNCEMENT' | 'QUESTION' | 'RESOURCE';
        images?: string[];
        hashtags?: string[];
        isPinned?: boolean;
      };
    },
  ) {
    const r = await this.social.createGroupPost(
      data.groupId,
      data.authorId,
      data.dto,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.analytics' })
  async groupAnalytics(
    @Payload() data: { groupId: string; viewerId: string },
  ) {
    const r = await this.social.getGroupAnalytics(data.groupId, data.viewerId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.course.analytics' })
  async courseCommunityAnalytics(
    @Payload() data: { courseId: string; viewerId: string },
  ) {
    const r = await this.social.getCourseCommunityAnalytics(
      data.courseId,
      data.viewerId,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.chat.listMessages' })
  async groupChatList(
    @Payload()
    data: {
      groupId: string;
      userId: string;
      page?: number;
      limit?: number;
      cursor?: string;
    },
  ) {
    const r = await this.social.listGroupMessages(data.groupId, data.userId, {
      page: data.page,
      limit: data.limit,
      cursor: data.cursor,
    });
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.chat.updateMessage' })
  async groupChatUpdate(
    @Payload()
    data: {
      groupId: string;
      messageId: string;
      userId: string;
      text: string;
    },
  ) {
    const r = await this.social.updateGroupMessage(
      data.groupId,
      data.messageId,
      data.userId,
      data.text,
    );
    return { message: 'ok', data: { message: r } };
  }

  @MessagePattern({ cmd: 'app.community.group.chat.deleteMessage' })
  async groupChatDelete(
    @Payload()
    data: { groupId: string; messageId: string; userId: string },
  ) {
    const r = await this.social.deleteGroupMessage(
      data.groupId,
      data.messageId,
      data.userId,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.chat.toggleReaction' })
  async groupChatReaction(
    @Payload()
    data: {
      groupId: string;
      messageId: string;
      userId: string;
      emoji: string;
    },
  ) {
    const r = await this.social.toggleGroupMessageReaction(
      data.groupId,
      data.messageId,
      data.userId,
      data.emoji,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.chat.pinMessage' })
  async groupChatPin(
    @Payload()
    data: { groupId: string; messageId: string; userId: string },
  ) {
    const r = await this.social.pinGroupChatMessage(
      data.groupId,
      data.messageId,
      data.userId,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.chat.unpinMessage' })
  async groupChatUnpin(
    @Payload()
    data: { groupId: string; messageId: string; userId: string },
  ) {
    const r = await this.social.unpinGroupChatMessage(
      data.groupId,
      data.messageId,
      data.userId,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.chat.search' })
  async groupChatSearch(
    @Payload()
    data: {
      groupId: string;
      userId: string;
      q?: string;
      senderId?: string;
      hasAttachment?: boolean;
      cursor?: string;
      limit?: number;
    },
  ) {
    const r = await this.social.searchGroupMessages(data.groupId, data.userId, {
      q: data.q,
      senderId: data.senderId,
      hasAttachment: data.hasAttachment,
      cursor: data.cursor,
      limit: data.limit,
    });
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.chat.send' })
  async groupChatSend(
    @Payload()
    data: {
      groupId: string;
      senderId: string;
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
    const result = await this.social.sendGroupMessage(data.groupId, data.senderId, {
      text: data.text,
      type: data.type,
      attachmentUrl: data.attachmentUrl,
      mimeType: data.mimeType,
      attachmentsMeta: data.attachmentsMeta,
      replyTo: data.replyTo,
    });
    return { message: 'ok', data: result };
  }

  @MessagePattern({ cmd: 'app.community.group.chat.seen' })
  async groupChatSeen(
    @Payload()
    data: { groupId: string; userId: string; messageId?: string },
  ) {
    const r = await this.social.markGroupChatSeen(
      data.groupId,
      data.userId,
      data.messageId,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.chat.unread' })
  async groupChatUnread(
    @Payload() data: { groupId: string; userId: string },
  ) {
    const r = await this.social.getGroupChatUnreadCount(data.groupId, data.userId);
    return { message: 'ok', data: r };
  }

  // ─── Moderation ─────────────────────────────────────────────────────────

  @MessagePattern({ cmd: 'app.community.moderation.muteMember' })
  async modMute(
    @Payload()
    data: {
      groupId: string;
      actorId: string;
      targetUserId: string;
      minutes?: number;
      reason?: string;
    },
  ) {
    const r = await this.social.muteMember(
      data.groupId,
      data.actorId,
      data.targetUserId,
      data.minutes,
      data.reason,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.moderation.unmuteMember' })
  async modUnmute(
    @Payload()
    data: { groupId: string; actorId: string; targetUserId: string },
  ) {
    const r = await this.social.unmuteMember(
      data.groupId,
      data.actorId,
      data.targetUserId,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.moderation.removeMember' })
  async modRemove(
    @Payload()
    data: {
      groupId: string;
      actorId: string;
      targetUserId: string;
      reason?: string;
    },
  ) {
    const r = await this.social.removeMember(
      data.groupId,
      data.actorId,
      data.targetUserId,
      data.reason,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.moderation.banMember' })
  async modBan(
    @Payload()
    data: {
      groupId: string;
      actorId: string;
      targetUserId: string;
      reason?: string;
    },
  ) {
    const r = await this.social.banMember(
      data.groupId,
      data.actorId,
      data.targetUserId,
      data.reason,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.moderation.unbanMember' })
  async modUnban(
    @Payload()
    data: { groupId: string; actorId: string; targetUserId: string },
  ) {
    const r = await this.social.unbanMember(
      data.groupId,
      data.actorId,
      data.targetUserId,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.moderation.pinPost' })
  async modPin(
    @Payload()
    data: {
      groupId: string;
      actorId: string;
      postId: string;
      pinned: boolean;
    },
  ) {
    const r = await this.social.setPostPinned(
      data.groupId,
      data.actorId,
      data.postId,
      data.pinned,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.moderation.deletePost' })
  async modDeletePost(
    @Payload()
    data: {
      groupId: string;
      actorId: string;
      postId: string;
      reason?: string;
    },
  ) {
    const r = await this.social.deleteGroupPost(
      data.groupId,
      data.actorId,
      data.postId,
      data.reason,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.moderation.logs' })
  async modLogs(
    @Payload()
    data: {
      groupId: string;
      viewerId: string;
      page?: number;
      limit?: number;
    },
  ) {
    const r = await this.social.listModerationLogs(
      data.groupId,
      data.viewerId,
      data.page,
      data.limit,
    );
    return { message: 'ok', data: r };
  }

  // ─── Search ─────────────────────────────────────────────────────────────

  @MessagePattern({ cmd: 'app.community.search' })
  async search(
    @Payload()
    data: {
      viewerId?: string;
      query: string;
      type?: 'all' | 'users' | 'posts' | 'groups' | 'hashtags';
      limit?: number;
    },
  ) {
    const r = await this.social.search(
      data.viewerId,
      data.query,
      data.type,
      data.limit,
    );
    return { message: 'ok', data: r };
  }

  // ─── AI Moderation (admin) ───────────────────────────────────────────────

  @MessagePattern({ cmd: 'app.community.moderation.queue' })
  async moderationQueue(
    @Payload()
    data: {
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
    },
  ) {
    const r = await this.aiModeration.listQueue(data ?? {});
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.moderation.resolve' })
  async moderationResolve(
    @Payload()
    data: {
      resultId: string;
      moderatorId: string;
      action: 'ALLOW' | 'FLAG' | 'SHADOW_BLOCK' | 'DELETE' | 'ESCALATE';
    },
  ) {
    const r = await this.aiModeration.resolve(
      data.resultId,
      data.moderatorId,
      data.action,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.moderation.stats' })
  async moderationStatsCmd() {
    const r = await this.aiModeration.stats();
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.analytics.platform' })
  async platformAnalytics() {
    const r = await this.social.getPlatformAnalytics();
    return { message: 'ok', data: r };
  }

  // ─── Cross-service events (LMS → Community sync) ─────────────────────────

  @EventPattern('app.events.course.created')
  async onCourseCreated(
    @Payload()
    data: {
      courseId: string;
      instructorId: string;
      title: string;
      description?: string;
    },
  ) {
    try {
      const group = await this.social.ensureCourseGroup({
        courseId: data.courseId,
        instructorId: data.instructorId,
        name: data.title,
        description: data.description,
        triggerSource: 'nats.app.events.course.created',
      });
      const gid = (group as { _id?: unknown })?._id;
      this.logger.log(
        `[COURSE_GROUP_VERIFY] course.created courseId=${data.courseId} instructorId=${data.instructorId} groupId=${gid != null ? String(gid) : 'n/a'}`,
      );
      this.logger.log(
        `[course.created] ensured community group for courseId=${data.courseId}`,
      );
    } catch (err) {
      this.logger.error(
        `[course.created] ensure group failed for ${data.courseId}: ${
          (err as Error).message
        }`,
      );
    }
  }

  @EventPattern('app.events.course.deleted')
  async onCourseDeleted(
    @Payload()
    data: {
      courseId: string;
      ownerId: string;
      communityGroupId?: string;
    },
  ) {
    try {
      await this.social.softDeleteCourseGroupForDeletedCourse({
        courseId: data.courseId,
        ownerId: data.ownerId,
        communityGroupId: data.communityGroupId,
      });
      this.logger.log(
        `[course.deleted] community soft-delete ok courseId=${data.courseId}`,
      );
    } catch (err) {
      this.logger.error(
        `[course.deleted] community soft-delete failed for ${data.courseId}: ${
          (err as Error).message
        }`,
      );
    }
  }

  @MessagePattern({ cmd: 'app.community.reports.create' })
  async createReport(
    @Payload()
    data: {
      reporterId: string;
      targetType: ReportTargetType;
      targetId: string;
      reason: ReportReason;
      description?: string;
      groupId?: string;
    },
  ) {
    const r = await this.reports.createReport(data);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.admin.reports.list' })
  async adminListReports(
    @Payload()
    data: {
      status?: ReportStatus;
      targetType?: ReportTargetType;
      search?: string;
      page?: number;
      limit?: number;
      sort?: 'newest' | 'oldest' | 'score';
    },
  ) {
    const r = await this.reports.listAdminReports(data);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.admin.reports.get' })
  async adminGetReport(@Payload() data: { reportId: string }) {
    const r = await this.reports.getAdminReport(data.reportId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.admin.reports.status' })
  async adminReportStatus(
    @Payload()
    data: { reportId: string; moderatorId: string; status: ReportStatus },
  ) {
    const r = await this.reports.updateReportStatus(
      data.reportId,
      data.moderatorId,
      data.status,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.admin.reports.action' })
  async adminReportAction(
    @Payload()
    data: {
      reportId: string;
      moderatorId: string;
      action: ModerationResolutionAction;
      notes?: string;
    },
  ) {
    const r = await this.reports.applyReportAction(
      data.reportId,
      data.moderatorId,
      data.action,
      data.notes,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.lockChat' })
  async lockChat(
    @Payload()
    data: {
      groupId: string;
      actorId: string;
      minutes?: number;
      reason?: string;
    },
  ) {
    const r = await this.social.lockGroupChat(
      data.groupId,
      data.actorId,
      data.minutes,
      data.reason,
    );
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.unlockChat' })
  async unlockChat(
    @Payload() data: { groupId: string; actorId: string },
  ) {
    const r = await this.social.unlockGroupChat(data.groupId, data.actorId);
    return { message: 'ok', data: r };
  }

  @MessagePattern({ cmd: 'app.community.group.postingDisabled' })
  async postingDisabled(
    @Payload()
    data: {
      groupId: string;
      actorId: string;
      disabled: boolean;
      reason?: string;
    },
  ) {
    const r = await this.social.setGroupPostingDisabled(
      data.groupId,
      data.actorId,
      data.disabled,
      data.reason,
    );
    return { message: 'ok', data: r };
  }

  @EventPattern('app.events.enroll.completed')
  async onEnrollCompleted(
    @Payload() data: { courseId: string; userId: string },
  ) {
    try {
      await this.social.joinCourseGroup(data.courseId, data.userId);
      this.logger.log(
        `[enroll.completed] joined course group userId=${data.userId} courseId=${data.courseId}`,
      );
    } catch (err) {
      this.logger.error(
        `[enroll.completed] join group failed for ${data.userId}@${data.courseId}: ${
          (err as Error).message
        }`,
      );
    }
  }

  @EventPattern('app.events.enroll.cancelled')
  async onEnrollCancelled(
    @Payload() data: { courseId: string; userId: string },
  ) {
    try {
      await this.social.leaveCourseGroup(data.courseId, data.userId);
      this.logger.log(
        `[enroll.cancelled] left course group userId=${data.userId} courseId=${data.courseId}`,
      );
    } catch (err) {
      this.logger.error(
        `[enroll.cancelled] leave group failed for ${data.userId}@${data.courseId}: ${
          (err as Error).message
        }`,
      );
    }
  }
}
