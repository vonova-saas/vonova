import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { resolveRequesterUserId } from '../../common/utils/request-user-id';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  RateLimit,
  RateLimitGuard,
} from '../../common/guards/rate-limit.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CommunitySocialGatewayService } from './social.gateway.service';
import {
  deliverCommunityNotification,
  emitFanOutDeliveries,
  scheduleNotificationFanOut,
} from './community-notification.helper';
import { CommunitySocketGateway } from '../../community/socket/community.gateway';
import { SOCKET_EVENTS } from '../../community/socket/socket-user.types';
import { CommunityS3Service } from '../../common/utils/storage/community-s3.service';
import {
  assertKeyPrefix,
  validateUpload,
} from '../../common/utils/upload-allowlist';
import {
  UpdateCommunityProfileDto,
  CreateDmConversationDto,
  SendDmMessageDto,
  PatchDmMessageDto,
  CreateGroupDto,
  MarkNotificationsReadDto,
  AiConsumeDto,
  CreateGroupChannelDto,
  CreateGroupPostDto,
  PresignGroupUploadDto,
  PresignMessageUploadDto,
  MarkConversationSeenDto,
  ModerationActionDto,
  MuteMemberDto,
} from './dto/social.dto';

@ApiTags('Community Social')
@ApiBearerAuth()
@Controller('api/v1/community')
@UseGuards(JwtAuthGuard)
export class CommunitySocialGatewayController {
  private readonly log = new Logger(CommunitySocialGatewayController.name);

  constructor(
    private readonly social: CommunitySocialGatewayService,
    private readonly sockets: CommunitySocketGateway,
    private readonly s3: CommunityS3Service,
  ) {}

  /** Presign attachment URLs on the HTTP edge (same S3 credentials as PUT presign). */
  private async hydrateOutgoingDirectMessage(
    message: Record<string, unknown>,
  ): Promise<void> {
    const meta = message.attachmentsMeta;
    if (Array.isArray(meta)) {
      message.attachmentsMeta = await Promise.all(
        meta.map(async (entry) => {
          if (!entry || typeof entry !== 'object') return entry;
          const o = entry as Record<string, unknown>;
          const signed = await this.s3.signCommunityAttachmentReadUrl({
            url: typeof o.url === 'string' ? o.url : undefined,
            key: typeof o.key === 'string' ? o.key : undefined,
          });
          if (signed) {
            return { ...o, url: signed };
          }
          return o;
        }),
      );
    }
    const legacy = message.attachments;
    if (Array.isArray(legacy)) {
      message.attachments = await Promise.all(
        legacy.map(async (u) => {
          if (typeof u !== 'string') return u;
          const signed = await this.s3.signCommunityAttachmentReadUrl({
            url: u,
          });
          return signed ?? u;
        }),
      );
    }
  }

  private async hydrateOutgoingDirectMessageListPayload(
    root: Record<string, unknown>,
  ): Promise<void> {
    const data = root.data as { items?: unknown[] } | undefined;
    const items = data?.items;
    if (!Array.isArray(items)) return;
    await Promise.all(
      items.map((m) =>
        m && typeof m === 'object'
          ? this.hydrateOutgoingDirectMessage(m as Record<string, unknown>)
          : Promise.resolve(),
      ),
    );
  }

  @Public()
  @Get('feed/explore')
  @ApiOperation({ summary: 'Public community feed (PUBLIC posts only)' })
  async feedExplore(@Query() query: { page?: number; limit?: number }) {
    return firstValueFrom(
      this.social.communityFeed(undefined, query.page, query.limit),
    );
  }

  @Public()
  @Get('profile/:username')
  @ApiOperation({ summary: 'Public profile by username' })
  async profileByUsername(@Param('username') username: string) {
    return firstValueFrom(this.social.profileByUsername(username));
  }

  @Public()
  @Get('users/:userId/followers')
  @ApiOperation({ summary: 'List followers of a user' })
  async followers(
    @Param('userId') userId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return firstValueFrom(
      this.social.followers(userId, query.page, query.limit),
    );
  }

  @Public()
  @Get('users/:userId/following')
  @ApiOperation({ summary: 'List users this user follows' })
  async following(
    @Param('userId') userId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return firstValueFrom(
      this.social.following(userId, query.page, query.limit),
    );
  }

  @Get('feed')
  @ApiOperation({ summary: 'Personalized community feed (requires auth)' })
  async feed(
    @Request() req: { user: { _id: string } },
    @Query() query: { page?: number; limit?: number },
  ) {
    return firstValueFrom(
      this.social.communityFeed(String(req.user._id), query.page, query.limit),
    );
  }

  @Patch('profile/me')
  @ApiOperation({ summary: 'Update current user community profile' })
  async updateProfile(
    @Request() req: { user: { _id: string } },
    @Body() body: UpdateCommunityProfileDto,
  ) {
    return firstValueFrom(
      this.social.updateMyProfile(String(req.user._id), body),
    );
  }

  @Post('profile/me/presign-avatar')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 30, windowMs: 60_000, bucket: 'profile-avatar-presign' })
  @ApiOperation({
    summary: 'Presigned PUT URL for profile avatar (community S3 bucket)',
  })
  async presignProfileAvatar(
    @Request() req: { user: { _id: string } },
    @Body() body: PresignMessageUploadDto,
  ) {
    const check = validateUpload({
      kind: body.kind,
      originalName: body.originalName,
      contentType: body.contentType,
    });
    if (!check.ok) {
      throw new BadRequestException(`upload rejected: ${check.reason}`);
    }
    const prefix = `avatars/${String(req.user._id)}`;
    const presigned = await this.s3.getPresignedPutUrl({
      folder: prefix,
      originalName: check.safeName,
      contentType: body.contentType,
    });
    assertKeyPrefix(presigned.key, prefix);
    return {
      message: 'ok',
      data: {
        ...presigned,
        kind: check.kind,
        maxBytes: check.maxBytes,
      },
    };
  }

  @Post('profile/me/presign-cover')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 30, windowMs: 60_000, bucket: 'profile-cover-presign' })
  @ApiOperation({
    summary: 'Presigned PUT URL for profile cover image (community S3 bucket)',
  })
  async presignProfileCover(
    @Request() req: { user: { _id: string } },
    @Body() body: PresignMessageUploadDto,
  ) {
    const check = validateUpload({
      kind: body.kind,
      originalName: body.originalName,
      contentType: body.contentType,
    });
    if (!check.ok) {
      throw new BadRequestException(`upload rejected: ${check.reason}`);
    }
    const prefix = `covers/${String(req.user._id)}`;
    const presigned = await this.s3.getPresignedPutUrl({
      folder: prefix,
      originalName: check.safeName,
      contentType: body.contentType,
    });
    assertKeyPrefix(presigned.key, prefix);
    return {
      message: 'ok',
      data: {
        ...presigned,
        kind: check.kind,
        maxBytes: check.maxBytes,
      },
    };
  }

  @Get('users/:userId/follow-state')
  @ApiOperation({ summary: 'Whether current user follows the given user' })
  async followState(
    @Request() req: { user: { _id: string } },
    @Param('userId') userId: string,
  ) {
    return firstValueFrom(
      this.social.isFollowing(String(req.user._id), userId),
    );
  }

  @Post('users/:userId/follow')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 60, windowMs: 60_000, bucket: 'follow' })
  @ApiOperation({ summary: 'Follow a user' })
  async follow(
    @Request() req: { user: { _id: string; name?: string } },
    @Param('userId') userId: string,
  ) {
    const result = await firstValueFrom(
      this.social.follow(String(req.user._id), userId),
    );
    this.sockets.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
      type: 'FOLLOW',
      actorId: String(req.user._id),
      actorName: req.user.name,
      createdAt: new Date().toISOString(),
    });
    return result;
  }

  @Delete('users/:userId/follow')
  @ApiOperation({ summary: 'Unfollow a user' })
  async unfollow(
    @Request() req: { user: { _id: string } },
    @Param('userId') userId: string,
  ) {
    return firstValueFrom(
      this.social.unfollow(String(req.user._id), userId),
    );
  }

  @Post('messages/conversations')
  @ApiOperation({ summary: 'Find or create a DM conversation' })
  async dmFindOrCreate(
    @Request() req: { user: { _id: string } },
    @Body() body: CreateDmConversationDto,
  ) {
    return firstValueFrom(
      this.social.findOrCreateConversation(String(req.user._id), body),
    );
  }

  @Get('messages/conversations')
  @ApiOperation({ summary: 'List DM conversations for current user' })
  async dmList(@Request() req: { user: { _id: string } }) {
    return firstValueFrom(
      this.social.listConversations(String(req.user._id)),
    );
  }

  @Get('messages/conversations/:conversationId')
  @ApiOperation({ summary: 'List messages in a conversation' })
  async dmMessages(
    @Request() req: { user: { _id: string } },
    @Param('conversationId') conversationId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    const result = (await firstValueFrom(
      this.social.listMessages(
        conversationId,
        String(req.user._id),
        query.page,
        query.limit,
      ),
    )) as Record<string, unknown>;
    await this.hydrateOutgoingDirectMessageListPayload(result);
    return result;
  }

  @Post('messages/conversations/:conversationId/messages')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 60, windowMs: 60_000, bucket: 'dm-send' })
  @ApiOperation({ summary: 'Send a message in a conversation' })
  async dmSend(
    @Request() req: { user: { _id: string; name?: string } },
    @Param('conversationId') conversationId: string,
    @Body()
    body: SendDmMessageDto & {
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
    const result = (await firstValueFrom(
      this.social.sendMessage(
        conversationId,
        String(req.user._id),
        body,
      ),
    )) as {
      data?: {
        message?: Record<string, unknown>;
        notification?: unknown;
      };
    };
    const payload = result?.data;
    const msgRecord = payload?.message;
    const dmNotif = payload?.notification;
    if (msgRecord && typeof msgRecord === 'object') {
      await this.hydrateOutgoingDirectMessage(msgRecord);
    }
    const message = msgRecord ?? result;
    if (dmNotif && typeof dmNotif === 'object') {
      const recipientId = String(
        (dmNotif as { userId?: string }).userId ?? '',
      );
      if (recipientId) {
        this.sockets.emitToUser(
          recipientId,
          SOCKET_EVENTS.NOTIFICATION_NEW,
          dmNotif,
        );
      }
    }
    const hasVoice = body.attachmentsMeta?.some((a) => a?.type === 'VOICE');
    if (hasVoice) {
      this.sockets.emitToConversation(
        conversationId,
        SOCKET_EVENTS.MESSAGE_VOICE,
        {
          conversationId,
          message,
          senderId: String(req.user._id),
          senderName: req.user.name,
        },
      );
    }
    this.sockets.emitToConversation(
      conversationId,
      SOCKET_EVENTS.MESSAGE_NEW,
      {
        conversationId,
        message,
        senderId: String(req.user._id),
        senderName: req.user.name,
      },
    );
    return result;
  }

  @Patch('messages/conversations/:conversationId/messages/:messageId')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 60, windowMs: 60_000, bucket: 'dm-edit' })
  @ApiOperation({ summary: 'Edit your own message (text only)' })
  async dmPatchMessage(
    @Request() req: { user: { _id: string } },
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() body: PatchDmMessageDto,
  ) {
    const result = (await firstValueFrom(
      this.social.updateMessage(
        conversationId,
        messageId,
        String(req.user._id),
        body.content,
      ),
    )) as { data?: { message?: Record<string, unknown> } };
    const msgRecord = result?.data?.message;
    if (msgRecord && typeof msgRecord === 'object') {
      await this.hydrateOutgoingDirectMessage(msgRecord);
    }
    const message = msgRecord ?? result;
    try {
      this.sockets.emitToConversation(
        conversationId,
        SOCKET_EVENTS.MESSAGE_UPDATED,
        {
          conversationId,
          messageId,
          message,
        },
      );
    } catch (err) {
      this.log.warn(
        `MESSAGE_UPDATED emit failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return result;
  }

  @Delete('messages/conversations/:conversationId/messages/:messageId')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 60, windowMs: 60_000, bucket: 'dm-delete' })
  @ApiOperation({ summary: 'Delete your own message' })
  async dmDeleteMessage(
    @Request() req: { user: { _id: string } },
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    const result = await firstValueFrom(
      this.social.deleteMessage(
        conversationId,
        messageId,
        String(req.user._id),
      ),
    );
    try {
      this.sockets.emitToConversation(
        conversationId,
        SOCKET_EVENTS.MESSAGE_DELETED,
        { conversationId, messageId },
      );
    } catch (err) {
      this.log.warn(
        `MESSAGE_DELETED emit failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return result;
  }

  @Get('notifications')
  @ApiOperation({ summary: 'List notifications (cursor or page)' })
  async notifications(
    @Request() req: { user: { _id: string } },
    @Query()
    query: {
      page?: number;
      limit?: number;
      cursor?: string;
      unreadOnly?: string | boolean;
    },
  ) {
    const unreadOnly =
      query.unreadOnly === true ||
      query.unreadOnly === 'true' ||
      query.unreadOnly === '1';
    return firstValueFrom(
      this.social.listNotifications(String(req.user._id), {
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        cursor: query.cursor,
        unreadOnly,
      }),
    );
  }

  @Post('notifications/read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  async notificationsRead(
    @Request() req: { user: { _id: string } },
    @Body() body: MarkNotificationsReadDto,
  ) {
    const result = await firstValueFrom(
      this.social.markNotificationsRead(String(req.user._id), body),
    );
    const unread =
      (result as { data?: { unread?: number } })?.data?.unread ??
      (result as { unread?: number })?.unread;
    const event = body?.ids?.length
      ? SOCKET_EVENTS.NOTIFICATION_READ
      : SOCKET_EVENTS.NOTIFICATION_ALL_READ;
    this.sockets.emitToUser(String(req.user._id), event, {
      ids: body?.ids ?? null,
      unread: unread ?? 0,
    });
    return result;
  }

  @Delete('notifications/:notificationId')
  @ApiOperation({ summary: 'Delete a notification' })
  async notificationDelete(
    @Request() req: { user: { _id: string } },
    @Param('notificationId') notificationId: string,
  ) {
    const result = await firstValueFrom(
      this.social.deleteNotification(String(req.user._id), notificationId),
    );
    const unread =
      (result as { data?: { unread?: number } })?.data?.unread ??
      (result as { unread?: number })?.unread;
    this.sockets.emitToUser(String(req.user._id), SOCKET_EVENTS.NOTIFICATION_READ, {
      deletedId: notificationId,
      unread: unread ?? 0,
    });
    return result;
  }

  @Delete('notifications/read/clear')
  @ApiOperation({ summary: 'Clear all read notifications' })
  async notificationsClearRead(@Request() req: { user: { _id: string } }) {
    return firstValueFrom(
      this.social.clearReadNotifications(String(req.user._id)),
    );
  }

  @Post('groups')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR_USER', 'INSTRUCTOR', 'instructor', 'ADMIN', 'admin')
  @ApiOperation({
    summary: 'Create a community group (instructors and admins only)',
  })
  async groupCreate(
    @Request() req: { user: { _id: string } },
    @Body() body: CreateGroupDto,
  ) {
    return firstValueFrom(
      this.social.createGroup(String(req.user._id), body),
    );
  }

  @Public()
  @Get('groups')
  @ApiOperation({
    summary:
      'List groups: public non-course groups for everyone; when authenticated, also course communities you belong to',
  })
  async groupList(
    @Request() req: ExpressRequest,
    @Query() query: { page?: number; limit?: number },
  ) {
    const userId = resolveRequesterUserId(req);
    this.log.log(
      `[COURSE_GROUP_QUERY] listGroups requesterId=${userId ?? 'anonymous'} page=${query.page ?? 1} limit=${query.limit ?? 20}`,
    );
    return firstValueFrom(
      this.social.listGroups(query.page, query.limit, userId),
    );
  }

  @Post('groups/:groupId/join')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 20, windowMs: 60_000, bucket: 'group-join' })
  @ApiOperation({ summary: 'Join a group' })
  async groupJoin(
    @Request() req: { user: { _id: string; name?: string } },
    @Param('groupId') groupId: string,
  ) {
    const result = await firstValueFrom(
      this.social.joinGroup(groupId, String(req.user._id)),
    );
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_NEW_MEMBER, {
      groupId,
      userId: String(req.user._id),
      name: req.user.name,
    });
    return result;
  }

  @Post('groups/:groupId/leave')
  @ApiOperation({ summary: 'Leave a group' })
  async groupLeave(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
  ) {
    const r = await firstValueFrom(
      this.social.leaveGroup(groupId, String(req.user._id)),
    );
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_MEMBER_LEFT, {
      groupId,
      userId: String(req.user._id),
    });
    return r;
  }

  @Get('ai/subscription')
  @ApiOperation({ summary: 'Get or create AI subscription for current user' })
  async aiSubscription(@Request() req: { user: { _id: string } }) {
    return firstValueFrom(
      this.social.aiSubscription(String(req.user._id)),
    );
  }

  @Get('ai/can-use')
  @ApiOperation({ summary: 'Check if user can use an AI feature' })
  async aiCanUse(
    @Request() req: { user: { _id: string } },
    @Query('feature') feature: string,
  ) {
    return firstValueFrom(
      this.social.aiCanUse(String(req.user._id), feature),
    );
  }

  @Post('ai/consume')
  @ApiOperation({ summary: 'Record AI usage (consumes quota on FREE)' })
  async aiConsume(
    @Request() req: { user: { _id: string } },
    @Body() body: AiConsumeDto,
  ) {
    return firstValueFrom(
      this.social.aiConsume(String(req.user._id), body),
    );
  }

  @Get('ai/stats')
  @ApiOperation({ summary: 'AI usage stats for today' })
  async aiStats(@Request() req: { user: { _id: string } }) {
    return firstValueFrom(this.social.aiStats(String(req.user._id)));
  }

  // ─── Course Communities ─────────────────────────────────────────────────

  @Get('courses/:courseId/community')
  @ApiOperation({ summary: 'Get the community group attached to a course' })
  async courseCommunity(
    @Request() req: ExpressRequest,
    @Param('courseId') courseId: string,
  ) {
    const viewerId = resolveRequesterUserId(req);
    if (!viewerId) {
      throw new UnauthorizedException('Authentication required');
    }
    this.log.log(
      `[COURSE_GROUP_QUERY] courseCommunity courseId=${courseId} viewerId=${viewerId}`,
    );
    return firstValueFrom(this.social.courseGroupByCourse(courseId, viewerId));
  }

  @Get('groups/:groupId')
  @ApiOperation({ summary: 'Get a group by id (enforces visibility)' })
  async groupGet(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
  ) {
    return firstValueFrom(
      this.social.groupById(groupId, String(req.user._id)),
    );
  }

  @Get('groups/:groupId/channels')
  @ApiOperation({ summary: 'List channels of a group' })
  async groupChannels(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
  ) {
    return firstValueFrom(
      this.social.groupChannelsList(groupId, String(req.user._id)),
    );
  }

  @Post('groups/:groupId/channels')
  @ApiOperation({ summary: 'Create a channel (instructor/owner/admin only)' })
  async groupChannelCreate(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Body() body: CreateGroupChannelDto,
  ) {
    const result = (await firstValueFrom(
      this.social.groupChannelsCreate(groupId, String(req.user._id), body),
    )) as { data?: { channel?: unknown } } | unknown;
    const channel =
      (result as { data?: { channel?: unknown } })?.data?.channel ?? result;
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_CHANNEL_CREATED, {
      groupId,
      channel,
      actorId: String(req.user._id),
    });
    return result;
  }

  @Get('groups/:groupId/posts')
  @ApiOperation({ summary: 'List posts in a group with optional filters' })
  async groupPosts(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Query()
    query: {
      page?: number;
      limit?: number;
      channelId?: string;
      postType?: 'DISCUSSION' | 'ANNOUNCEMENT' | 'QUESTION' | 'RESOURCE';
    },
  ) {
    return firstValueFrom(
      this.social.groupPostsList(
        groupId,
        String(req.user._id),
        query.page,
        query.limit,
        { channelId: query.channelId, postType: query.postType },
      ),
    );
  }

  @Post('groups/:groupId/posts')
  @ApiOperation({ summary: 'Create a post inside a group (DISCUSSION | ANNOUNCEMENT | QUESTION | RESOURCE)' })
  async groupPostCreate(
    @Request() req: { user: { _id: string; name?: string } },
    @Param('groupId') groupId: string,
    @Body() body: CreateGroupPostDto,
  ) {
    const result = (await firstValueFrom(
      this.social.groupPostsCreate(groupId, String(req.user._id), body),
    )) as { data?: { post?: unknown; role?: string } } | unknown;

    const data = (result as { data?: { post?: unknown; role?: string } })?.data;
    const post = data?.post ?? result;

    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_NEW_POST, {
      groupId,
      post,
      authorId: String(req.user._id),
      postType: body.postType ?? 'DISCUSSION',
    });

    if (body.postType === 'ANNOUNCEMENT') {
      this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_ANNOUNCEMENT, {
        groupId,
        post,
        authorId: String(req.user._id),
        authorName: req.user.name,
      });
      const deliveries =
        (
          data as {
            announcementDeliveries?: Array<{
              recipientId: string;
              notification: Record<string, unknown>;
              unread?: number;
            }>;
          }
        )?.announcementDeliveries ??
        (
          result as {
            data?: {
              announcementDeliveries?: Array<{
                recipientId: string;
                notification: Record<string, unknown>;
                unread?: number;
              }>;
            };
          }
        )?.data?.announcementDeliveries ??
        [];
      emitFanOutDeliveries(this.sockets, deliveries);
    }
    return result;
  }

  @Get('notifications/preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getNotificationPreferences(@Request() req: { user: { _id: string } }) {
    return firstValueFrom(
      this.social.getNotificationPreferences(String(req.user._id)),
    );
  }

  @Patch('notifications/preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async patchNotificationPreferences(
    @Request() req: { user: { _id: string } },
    @Body()
    body: {
      groupChat?: boolean;
      mentions?: boolean;
      enrollments?: boolean;
      quizzes?: boolean;
      lessons?: boolean;
      announcements?: boolean;
      marketing?: boolean;
    },
  ) {
    return firstValueFrom(
      this.social.updateNotificationPreferences(String(req.user._id), body),
    );
  }

  @Post('groups/:groupId/chat/notifications-mute')
  @ApiOperation({ summary: 'Mute or unmute group chat notifications' })
  async muteGroupChatNotifications(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Body() body: { muted: boolean },
  ) {
    return firstValueFrom(
      this.social.setGroupChatNotificationsMuted(
        groupId,
        String(req.user._id),
        !!body.muted,
      ),
    );
  }

  @Get('groups/:groupId/analytics')
  @ApiOperation({ summary: 'Instructor analytics for a group' })
  async groupAnalytics(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
  ) {
    return firstValueFrom(
      this.social.groupAnalytics(groupId, String(req.user._id)),
    );
  }

  @Get('groups/:groupId/chat/messages')
  @ApiOperation({ summary: 'List group chat messages (members only)' })
  async groupChatMessages(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Query() query: { page?: number; limit?: number; cursor?: string },
  ) {
    const result = (await firstValueFrom(
      this.social.groupChatListMessages(groupId, String(req.user._id), {
        page: query.page,
        limit: query.limit,
        cursor: query.cursor,
      }),
    )) as Record<string, unknown>;
    const data = (result as { data?: Record<string, unknown> }).data ?? result;
    const items = (data as { items?: Record<string, unknown>[] }).items;
    if (Array.isArray(items)) {
      await Promise.all(
        items.map((m) =>
          this.hydrateOutgoingDirectMessage(m),
        ),
      );
    }
    return result;
  }

  @Get('groups/:groupId/chat/unread')
  @ApiOperation({ summary: 'Unread group chat count for current user' })
  async groupChatUnread(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
  ) {
    return firstValueFrom(
      this.social.groupChatUnread(groupId, String(req.user._id)),
    );
  }

  @Post('groups/:groupId/chat/messages')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 120, windowMs: 60_000, bucket: 'group-chat-send' })
  @ApiOperation({ summary: 'Send a group chat message (members only)' })
  async groupChatSend(
    @Request() req: { user: { _id: string; name?: string } },
    @Param('groupId') groupId: string,
    @Body()
    body: SendDmMessageDto & {
      type?: 'text' | 'image' | 'file' | 'audio';
      attachmentUrl?: string | null;
      mimeType?: string | null;
      replyTo?: string | null;
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
    const result = (await firstValueFrom(
      this.social.groupChatSend(groupId, String(req.user._id), {
        text: body.content,
        type: body.type,
        attachmentUrl: body.attachmentUrl,
        mimeType: body.mimeType,
        attachmentsMeta: body.attachmentsMeta,
        replyTo: body.replyTo,
      }),
    )) as {
      data?: {
        message?: Record<string, unknown>;
        notifyUserIds?: string[];
        mentionedUserIds?: string[];
        groupName?: string;
        groupCourseId?: string | null;
      };
    };
    const chatPayload = result?.data;
    const msgRecord = chatPayload?.message;
    if (msgRecord && typeof msgRecord === 'object') {
      await this.hydrateOutgoingDirectMessage(msgRecord);
    }
    const message = msgRecord ?? result;
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_MESSAGE_NEW, {
      groupId,
      message,
      senderId: String(req.user._id),
      senderName: req.user.name,
    });
    const groupName = chatPayload?.groupName ?? 'Group';
    const senderId = String(req.user._id);
    const meta = {
      groupId,
      courseId: chatPayload?.groupCourseId ?? null,
    };
    for (const uid of chatPayload?.notifyUserIds ?? []) {
      void deliverCommunityNotification(this.social, this.sockets, {
        recipientId: uid,
        actorId: senderId,
        type: 'GROUP_CHAT',
        entityType: 'GROUP',
        entityId: groupId,
        title: groupName,
        message: 'New message in group chat',
        meta,
      });
    }
    for (const uid of chatPayload?.mentionedUserIds ?? []) {
      void deliverCommunityNotification(this.social, this.sockets, {
        recipientId: uid,
        actorId: senderId,
        type: 'MENTION',
        entityType: 'GROUP',
        entityId: groupId,
        title: groupName,
        message: 'mentioned you in group chat',
        meta: { ...meta, forceMention: true },
        force: true,
      });
    }
    return result;
  }

  @Patch('groups/:groupId/chat/messages/:messageId')
  @ApiOperation({ summary: 'Edit own group chat message' })
  async groupChatUpdateMessage(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
    @Body() body: { content: string },
  ) {
    const result = (await firstValueFrom(
      this.social.groupChatUpdateMessage(
        groupId,
        messageId,
        String(req.user._id),
        body.content ?? '',
      ),
    )) as { data?: { message?: Record<string, unknown> } };
    const message = result?.data?.message;
    if (message) {
      await this.hydrateOutgoingDirectMessage(message);
      this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_MESSAGE_UPDATED, {
        groupId,
        message,
      });
    }
    return result;
  }

  @Delete('groups/:groupId/chat/messages/:messageId')
  @ApiOperation({ summary: 'Delete group chat message (own or moderator)' })
  async groupChatDeleteMessage(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
  ) {
    await firstValueFrom(
      this.social.groupChatDeleteMessage(
        groupId,
        messageId,
        String(req.user._id),
      ),
    );
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_MESSAGE_DELETED, {
      groupId,
      messageId,
    });
    return { message: 'ok', data: { ok: true, messageId } };
  }

  @Post('groups/:groupId/chat/messages/:messageId/reactions')
  @ApiOperation({ summary: 'Toggle emoji reaction on a group message' })
  async groupChatToggleReaction(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string },
  ) {
    const result = (await firstValueFrom(
      this.social.groupChatToggleReaction(
        groupId,
        messageId,
        String(req.user._id),
        body.emoji,
      ),
    )) as { data?: { message?: Record<string, unknown> } };
    const message = result?.data?.message;
    if (message) {
      await this.hydrateOutgoingDirectMessage(message);
      this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_MESSAGE_REACTION, {
        groupId,
        message,
        emoji: body.emoji,
        userId: String(req.user._id),
      });
    }
    return result;
  }

  @Post('groups/:groupId/chat/messages/:messageId/pin')
  @ApiOperation({ summary: 'Pin group chat message (instructor)' })
  async groupChatPinMessage(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
  ) {
    const result = (await firstValueFrom(
      this.social.groupChatPinMessage(
        groupId,
        messageId,
        String(req.user._id),
      ),
    )) as { data?: { pinnedMessages?: unknown[] } };
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_CHAT_PINNED, {
      groupId,
      pinnedMessages: result?.data?.pinnedMessages ?? [],
    });
    return result;
  }

  @Delete('groups/:groupId/chat/messages/:messageId/pin')
  @ApiOperation({ summary: 'Unpin group chat message' })
  async groupChatUnpinMessage(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
  ) {
    const result = (await firstValueFrom(
      this.social.groupChatUnpinMessage(
        groupId,
        messageId,
        String(req.user._id),
      ),
    )) as { data?: { pinnedMessages?: unknown[] } };
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_CHAT_PINNED, {
      groupId,
      pinnedMessages: result?.data?.pinnedMessages ?? [],
    });
    return result;
  }

  @Get('groups/:groupId/chat/search')
  @ApiOperation({ summary: 'Search group chat messages' })
  async groupChatSearch(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Query()
    query: {
      q?: string;
      senderId?: string;
      hasAttachment?: string;
      cursor?: string;
      limit?: number;
    },
  ) {
    const result = (await firstValueFrom(
      this.social.groupChatSearch(groupId, String(req.user._id), {
        q: query.q,
        senderId: query.senderId,
        hasAttachment: query.hasAttachment === 'true',
        cursor: query.cursor,
        limit: query.limit,
      }),
    )) as Record<string, unknown>;
    const data = (result as { data?: Record<string, unknown> }).data ?? result;
    const items = (data as { items?: Record<string, unknown>[] }).items;
    if (Array.isArray(items)) {
      await Promise.all(
        items.map((m) => this.hydrateOutgoingDirectMessage(m)),
      );
    }
    return result;
  }

  @Post('groups/:groupId/chat/seen')
  @ApiOperation({ summary: 'Mark group chat as read up to a message' })
  async groupChatSeen(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Body() body: { messageId?: string },
  ) {
    const result = await firstValueFrom(
      this.social.groupChatSeen(
        groupId,
        String(req.user._id),
        body.messageId,
      ),
    );
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_CHAT_SEEN, {
      groupId,
      userId: String(req.user._id),
      messageId: body.messageId,
    });
    return result;
  }

  // ─── Uploads (presigned PUT) ────────────────────────────────────────────

  @Post('groups/:groupId/presign-upload')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 30, windowMs: 60_000, bucket: 'group-presign' })
  @ApiOperation({
    summary:
      'Presigned PUT URL to upload media for a group (images, PDFs, videos, voice)',
  })
  async presignGroupUpload(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Body() body: PresignGroupUploadDto,
  ) {
    const check = validateUpload({
      kind: body.kind,
      originalName: body.originalName,
      contentType: body.contentType,
    });
    if (!check.ok) {
      throw new BadRequestException(`upload rejected: ${check.reason}`);
    }
    // Ensure the user has access to this group before issuing a presigned URL.
    await firstValueFrom(
      this.social.groupById(groupId, String(req.user._id)),
    );
    const prefix = `community/groups/${groupId}`;
    const presigned = await this.s3.getPresignedPutUrl({
      folder: prefix,
      originalName: check.safeName,
      contentType: body.contentType,
    });
    assertKeyPrefix(presigned.key, prefix);
    return {
      message: 'ok',
      data: {
        ...presigned,
        kind: check.kind,
        maxBytes: check.maxBytes,
      },
    };
  }

  @Post('messages/presign-upload')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 30, windowMs: 60_000, bucket: 'message-presign' })
  @ApiOperation({
    summary: 'Presigned PUT URL to upload a DM attachment (voice / image / file)',
  })
  async presignMessageUpload(
    @Request() req: { user: { _id: string } },
    @Body() body: PresignMessageUploadDto,
  ) {
    const check = validateUpload({
      kind: body.kind,
      originalName: body.originalName,
      contentType: body.contentType,
    });
    if (!check.ok) {
      throw new BadRequestException(`upload rejected: ${check.reason}`);
    }
    const prefix = `community/messages/${String(req.user._id)}`;
    const presigned = await this.s3.getPresignedPutUrl({
      folder: prefix,
      originalName: check.safeName,
      contentType: body.contentType,
    });
    assertKeyPrefix(presigned.key, prefix);
    return {
      message: 'ok',
      data: {
        ...presigned,
        kind: check.kind,
        maxBytes: check.maxBytes,
      },
    };
  }

  // ─── Seen state ─────────────────────────────────────────────────────────

  @Post('messages/conversations/:conversationId/seen')
  @ApiOperation({
    summary:
      'Mark messages as seen up to the latest (or a specific messageId)',
  })
  async messagesSeen(
    @Request() req: { user: { _id: string } },
    @Param('conversationId') conversationId: string,
    @Body() body: MarkConversationSeenDto,
  ) {
    const result = (await firstValueFrom(
      this.social.markConversationSeen(
        conversationId,
        String(req.user._id),
        body?.messageId,
      ),
    )) as
      | {
          data?: {
            conversationId: string;
            userId: string;
            lastSeenMessage: string | null;
            lastSeenAt: string | Date;
          };
        }
      | unknown;
    const data = (result as { data?: Record<string, unknown> })?.data ?? result;
    this.sockets.emitToConversation(
      conversationId,
      SOCKET_EVENTS.MESSAGE_SEEN,
      data,
    );
    return result;
  }

  // ─── Moderation ─────────────────────────────────────────────────────────

  @Post('groups/:groupId/moderation/mute')
  async moderationMute(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Body() body: MuteMemberDto,
  ) {
    const r = await firstValueFrom(
      this.social.moderationMute(
        groupId,
        String(req.user._id),
        body.targetUserId,
        body.minutes,
        body.reason,
      ),
    );
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_MODERATION_ACTION, {
      groupId,
      action: 'MUTE_MEMBER',
      targetUserId: body.targetUserId,
      actorId: String(req.user._id),
    });
    return r;
  }

  @Post('groups/:groupId/moderation/unmute')
  async moderationUnmute(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Body() body: ModerationActionDto,
  ) {
    const r = await firstValueFrom(
      this.social.moderationUnmute(
        groupId,
        String(req.user._id),
        body.targetUserId,
      ),
    );
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_MODERATION_ACTION, {
      groupId,
      action: 'UNMUTE_MEMBER',
      targetUserId: body.targetUserId,
      actorId: String(req.user._id),
    });
    return r;
  }

  @Post('groups/:groupId/moderation/remove')
  async moderationRemove(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Body() body: ModerationActionDto,
  ) {
    const r = await firstValueFrom(
      this.social.moderationRemove(
        groupId,
        String(req.user._id),
        body.targetUserId,
        body.reason,
      ),
    );
    this.sockets.emitToUser(body.targetUserId, SOCKET_EVENTS.GROUP_MEMBER_LEFT, {
      groupId,
      userId: body.targetUserId,
      removed: true,
    });
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_MEMBER_LEFT, {
      groupId,
      userId: body.targetUserId,
    });
    return r;
  }

  @Post('groups/:groupId/moderation/ban')
  async moderationBan(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Body() body: ModerationActionDto,
  ) {
    const r = await firstValueFrom(
      this.social.moderationBan(
        groupId,
        String(req.user._id),
        body.targetUserId,
        body.reason,
      ),
    );
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_MODERATION_ACTION, {
      groupId,
      action: 'BAN_MEMBER',
      targetUserId: body.targetUserId,
      actorId: String(req.user._id),
    });
    return r;
  }

  @Post('groups/:groupId/moderation/unban')
  async moderationUnban(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Body() body: ModerationActionDto,
  ) {
    return firstValueFrom(
      this.social.moderationUnban(
        groupId,
        String(req.user._id),
        body.targetUserId,
      ),
    );
  }

  @Post('groups/:groupId/posts/:postId/pin')
  async moderationPin(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
    @Body() body: { pinned: boolean },
  ) {
    const pinned = !!body?.pinned;
    const r = await firstValueFrom(
      this.social.moderationPin(
        groupId,
        String(req.user._id),
        postId,
        pinned,
      ),
    );
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_POST_PINNED, {
      groupId,
      postId,
      pinned,
      actorId: String(req.user._id),
    });
    return r;
  }

  @Delete('groups/:groupId/posts/:postId')
  async moderationDeletePost(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
    @Body() body: { reason?: string },
  ) {
    const r = await firstValueFrom(
      this.social.moderationDeletePost(
        groupId,
        String(req.user._id),
        postId,
        body?.reason,
      ),
    );
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.POST_DELETED, {
      groupId,
      postId,
      actorId: String(req.user._id),
    });
    return r;
  }

  @Post('groups/:groupId/moderation/lock-chat')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 20, windowMs: 60_000, bucket: 'group:lock-chat' })
  async lockGroupChat(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Body() body: { minutes?: number; reason?: string },
  ) {
    const actorId = String(req.user._id);
    const r = await firstValueFrom(
      this.social.lockGroupChat(groupId, actorId, body.minutes, body.reason),
    );
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_LOCKED, {
      groupId,
      actorId,
      ...(r as object),
    });
    return r;
  }

  @Post('groups/:groupId/moderation/unlock-chat')
  async unlockGroupChat(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
  ) {
    const actorId = String(req.user._id);
    const r = await firstValueFrom(
      this.social.unlockGroupChat(groupId, actorId),
    );
    this.sockets.emitToGroup(groupId, SOCKET_EVENTS.GROUP_UNLOCKED, {
      groupId,
      actorId,
    });
    return r;
  }

  @Post('groups/:groupId/moderation/posting-disabled')
  async setPostingDisabled(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Body() body: { disabled: boolean; reason?: string },
  ) {
    const actorId = String(req.user._id);
    return firstValueFrom(
      this.social.setGroupPostingDisabled(
        groupId,
        actorId,
        !!body.disabled,
        body.reason,
      ),
    );
  }

  @Get('groups/:groupId/moderation/logs')
  async moderationLogs(
    @Request() req: { user: { _id: string } },
    @Param('groupId') groupId: string,
    @Query() q: { page?: number; limit?: number },
  ) {
    return firstValueFrom(
      this.social.moderationLogs(
        groupId,
        String(req.user._id),
        q.page,
        q.limit,
      ),
    );
  }

  // ─── Search ─────────────────────────────────────────────────────────────

  @Get('search')
  @ApiOperation({
    summary:
      'Global community search across users, posts, groups, and hashtags',
  })
  async search(
    @Request() req: { user: { _id: string } },
    @Query()
    query: {
      q?: string;
      type?: 'all' | 'users' | 'posts' | 'groups' | 'hashtags';
      limit?: number;
    },
  ) {
    return firstValueFrom(
      this.social.search(
        String(req.user._id),
        query.q ?? '',
        query.type ?? 'all',
        query.limit,
      ),
    );
  }

  // ─── Admin (RBAC: ADMIN) ────────────────────────────────────────────────

  @Get('admin/moderation/queue')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'admin')
  @ApiOperation({
    summary: 'List AI moderation results (admin only)',
  })
  async adminModerationQueue(
    @Query()
    query: {
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      action?: 'ALLOW' | 'FLAG' | 'SHADOW_BLOCK' | 'DELETE' | 'ESCALATE';
      reviewed?: 'pending' | 'done' | 'all';
      page?: number;
      limit?: number;
    },
  ) {
    return firstValueFrom(this.social.aiModerationQueue(query));
  }

  @Post('admin/moderation/:resultId/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'admin')
  @ApiOperation({ summary: 'Resolve a moderation result (admin only)' })
  async adminModerationResolve(
    @Request() req: { user: { _id: string } },
    @Param('resultId') resultId: string,
    @Body()
    body: {
      action: 'ALLOW' | 'FLAG' | 'SHADOW_BLOCK' | 'DELETE' | 'ESCALATE';
    },
  ) {
    const r = (await firstValueFrom(
      this.social.aiModerationResolve(
        resultId,
        String(req.user._id),
        body.action,
      ),
    )) as
      | { data?: { result?: { targetType?: string; targetId?: string } } }
      | unknown;
    const result = (
      (r as { data?: { result?: Record<string, unknown> } })?.data?.result ?? {}
    ) as { targetType?: string; targetId?: string };
    this.sockets.broadcast('moderation:resolved', {
      resultId,
      action: body.action,
      targetType: result.targetType,
      targetId: result.targetId,
      actorId: String(req.user._id),
    });
    return r;
  }

  @Get('admin/moderation/stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'admin')
  async adminModerationStats() {
    return firstValueFrom(this.social.aiModerationStats());
  }

  @Get('admin/analytics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'admin')
  @ApiOperation({ summary: 'Platform analytics (admin only)' })
  async adminAnalytics() {
    return firstValueFrom(this.social.platformAnalytics());
  }
}
