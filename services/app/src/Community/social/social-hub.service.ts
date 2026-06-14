import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import { Types } from 'mongoose';
import { User, UserDocument } from '../../auth/schema/user.schema';
import { AiModerationService } from './ai-moderation.service';
import { AutoModerationService } from './auto-moderation.service';
import { sanitizeText } from '../../common/utils/sanitize';
import type { PostDocument } from '../posts/schemas/posts/post.schema';
import {
  assertNotRapidPostDuplicate,
  fingerprintIncomingMedia,
} from '../posts/post-duplicate.util';
import { CommunityS3Service } from '../../common/aws/community-s3.service';
import { S3Service } from '../../common/aws/s3.service';
import { NotificationDispatchService } from './notifications/notification-dispatch.service';
import { NotificationUnreadService } from './notifications/notification-unread.service';
import { NotificationPreferencesService } from './notifications/notification-preferences.service';
import { NotificationAudienceResolver } from './notifications/notification-audience.resolver';
import {
  applyStableDmMessageMedia,
  applyStableGroupMessageMedia,
  applyStablePostMedia,
  applyStableUserPublicMedia,
} from '../../common/media/community-media-hydration.helper';
import { stableMediaGetEnabled } from '../../common/media/stable-media-url';

const USER_PUBLIC =
  'name email profilePictureUrl username headline bio experience skills website github linkedin coverImageUrl role followersCount followingCount isVerifiedInstructor createdAt';

@Injectable()
export class SocialHubService {
  private readonly logger = new Logger(SocialHubService.name);

  private readonly postModel: Model<any>;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel('CommunityFollow')
    private readonly followModel: Model<any>,
    @InjectModel('DirectConversation')
    private readonly conversationModel: Model<any>,
    @InjectModel('DirectMessage')
    private readonly messageModel: Model<any>,
    @InjectModel('GroupMessage')
    private readonly groupMessageModel: Model<any>,
    @InjectModel('CommunityNotification')
    private readonly notificationModel: Model<any>,
    @InjectModel('CommunityGroup')
    private readonly groupModel: Model<any>,
    @InjectModel('GroupChannel')
    private readonly channelModel: Model<any>,
    @InjectModel('CommunityModerationLog')
    private readonly modLogModel: Model<any>,
    @InjectModel('PlatformUserSanction')
    private readonly sanctionModel: Model<any>,
    private readonly aiModeration: AiModerationService,
    private readonly autoMod: AutoModerationService,
    @InjectModel('AiUserSubscription')
    private readonly aiSubModel: Model<any>,
    @InjectModel('AiUsageLog')
    private readonly aiUsageModel: Model<any>,
    private readonly communityS3: CommunityS3Service,
    private readonly appS3: S3Service,
    private readonly notificationDispatch: NotificationDispatchService,
    private readonly notificationUnread: NotificationUnreadService,
    private readonly notificationPreferences: NotificationPreferencesService,
    private readonly notificationAudience: NotificationAudienceResolver,
  ) {
    this.postModel = this.connection.model('Post');
  }

  /** Treat 24-char hex segment as Mongo id for `/community/profile/:id` links. */
  private looksLikeMongoObjectId(value: string): boolean {
    const v = String(value).trim();
    if (!/^[a-f0-9]{24}$/i.test(v)) return false;
    return Types.ObjectId.isValid(v) && new Types.ObjectId(v).toString() === v;
  }

  private async hydrateUserPublicMedia(
    user: Record<string, unknown> | null | undefined,
  ): Promise<void> {
    if (!user || typeof user !== 'object') return;
    if (stableMediaGetEnabled()) {
      applyStableUserPublicMedia(user);
      return;
    }
    const pic = user.profilePictureUrl;
    if (typeof pic === 'string') {
      const signed = await this.appS3.signProfileMediaReadUrl(pic);
      if (signed) user.profilePictureUrl = signed;
    }
    const cover = user.coverImageUrl;
    if (typeof cover === 'string') {
      const signed =
        (await this.signCommunityProfileMediaReadUrl(cover)) ??
        (await this.appS3.signProfileMediaReadUrl(cover));
      if (signed) user.coverImageUrl = signed;
    }
  }

  /** Community bucket covers/avatars (path-style or virtual-hosted). */
  private async signCommunityProfileMediaReadUrl(
    url: string,
    expiresInSeconds = 3600,
  ): Promise<string | undefined> {
    const key = url.startsWith('http')
      ? this.communityS3.extractKeyFromUrl(url)
      : url;
    if (!key) return undefined;
    if (!key.startsWith('covers/') && !key.startsWith('avatars/')) {
      return undefined;
    }
    try {
      return await this.communityS3.getSignedUrl(key, expiresInSeconds);
    } catch {
      return undefined;
    }
  }

  /** Resolve S3 object key for community media we are allowed to presign for reads. */
  private communityMediaKeyFromUrlOrKey(urlOrKey: string): string | null {
    const key = urlOrKey.startsWith('http')
      ? this.communityS3.extractKeyFromUrl(urlOrKey)
      : urlOrKey;
    if (!key) return null;
    if (
      key.startsWith('posts/') ||
      key.startsWith('articles/') ||
      key.startsWith('community/messages/') ||
      key.startsWith('community/groups/') ||
      key.startsWith('covers/') ||
      key.startsWith('avatars/')
    ) {
      return key;
    }
    return null;
  }

  private async signCommunityMediaReadUrl(
    url: string | null | undefined,
    expiresInSeconds = 3600,
  ): Promise<string | undefined> {
    if (!url || typeof url !== 'string') return undefined;
    const key = this.communityMediaKeyFromUrlOrKey(url);
    if (!key) return undefined;
    try {
      return await this.communityS3.getSignedUrl(key, expiresInSeconds);
    } catch {
      return undefined;
    }
  }

  private async hydrateDirectMessageMedia(
    msg: Record<string, unknown>,
    conversationId?: string,
  ): Promise<void> {
    if (stableMediaGetEnabled() && conversationId) {
      applyStableDmMessageMedia(conversationId, msg);
      return;
    }
    const att = msg.attachmentsMeta;
    if (Array.isArray(att)) {
      const next = await Promise.all(
        att.map(async (a) => {
          if (!a || typeof a !== 'object') return a;
          const o = { ...(a as Record<string, unknown>) };
          const url = o.url;
          const keyField = o.key;
          let signed: string | undefined;
          if (typeof url === 'string') {
            signed = await this.signCommunityMediaReadUrl(url, 3600);
          }
          if (
            !signed &&
            typeof keyField === 'string' &&
            keyField.trim().length > 0
          ) {
            signed = await this.signCommunityMediaReadUrl(
              keyField.trim(),
              3600,
            );
          }
          if (signed) {
            o.url = signed;
          }
          return o;
        }),
      );
      msg.attachmentsMeta = next;
    }
    if (Array.isArray(msg.attachments)) {
      msg.attachments = await Promise.all(
        (msg.attachments as unknown[]).map(async (u) =>
          typeof u === 'string'
            ? (await this.signCommunityMediaReadUrl(u, 3600)) ?? u
            : u,
        ),
      );
    }
  }

  private async hydrateOnePostMedia(post: Record<string, unknown>): Promise<void> {
    if (stableMediaGetEnabled()) {
      applyStablePostMedia(post);
      return;
    }
    const img = post.image;
    if (typeof img === 'string') {
      const signed = await this.signCommunityMediaReadUrl(img);
      if (signed) post.image = signed;
    }
    if (Array.isArray(post.images)) {
      post.images = await Promise.all(
        (post.images as unknown[]).map(async (u) => {
          if (typeof u !== 'string') return u;
          return (await this.signCommunityMediaReadUrl(u)) ?? u;
        }),
      );
    }
    if (Array.isArray(post.videos)) {
      post.videos = await Promise.all(
        (post.videos as unknown[]).map(async (u) => {
          if (typeof u !== 'string') return u;
          return (await this.signCommunityMediaReadUrl(u)) ?? u;
        }),
      );
    }
    const author = post.author;
    if (author && typeof author === 'object' && !Array.isArray(author)) {
      await this.hydrateUserPublicMedia(author as Record<string, unknown>);
    }
    const sp = post.sharedPost;
    if (sp && typeof sp === 'object' && !Array.isArray(sp)) {
      await this.hydrateOnePostMedia(sp as Record<string, unknown>);
    }
  }

  private async hydratePostsMedia(posts: unknown[]): Promise<void> {
    await Promise.all(
      posts.map((p) => {
        if (p && typeof p === 'object') {
          return this.hydrateOnePostMedia(p as Record<string, unknown>);
        }
        return Promise.resolve();
      }),
    );
  }

  private oid(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
    return new Types.ObjectId(id);
  }

  /** Course groups may store `courseId` as ObjectId or legacy string. */
  private courseGroupCourseIdFilter(courseIdStr: string) {
    if (!Types.ObjectId.isValid(courseIdStr)) {
      return { courseId: courseIdStr };
    }
    const oid = new Types.ObjectId(courseIdStr);
    return { $or: [{ courseId: oid }, { courseId: courseIdStr }] };
  }

  /** Non–soft-deleted community groups (lists, joins, course sync). */
  private activeCommunityGroupFilter(): Record<string, unknown> {
    return { isDeleted: { $ne: true } };
  }

  /** Normalize sender id whether stored as ObjectId or populated `{ _id }` user doc. */
  private normalizeMessageSenderId(raw: unknown): string {
    if (raw == null) return '';
    if (typeof raw === 'object' && '_id' in (raw as Record<string, unknown>)) {
      return String((raw as { _id: unknown })._id).toLowerCase();
    }
    return String(raw).toLowerCase();
  }

  // ─── Profile ─────────────────────────────────────────────────────────────

  async getProfileByUsername(username: string) {
    const raw = String(username).trim();
    let u: Record<string, unknown> | null = null;
    if (this.looksLikeMongoObjectId(raw)) {
      u = await this.userModel
        .findById(this.oid(raw))
        .select(USER_PUBLIC)
        .lean();
    } else {
      u = await this.userModel
        .findOne({ username: raw.toLowerCase() })
        .select(USER_PUBLIC)
        .lean();
    }
    if (!u) throw new NotFoundException('Profile not found');
    await this.hydrateUserPublicMedia(u);
    return u;
  }

  async getProfileById(userId: string) {
    const u = await this.userModel
      .findById(this.oid(userId))
      .select(USER_PUBLIC)
      .lean();
    if (!u) throw new NotFoundException('User not found');
    await this.hydrateUserPublicMedia(u as Record<string, unknown>);
    return u;
  }

  async updateMyProfile(
    userId: string,
    patch: Partial<{
      username: string | null;
      headline: string | null;
      bio: string | null;
      experience: string | null;
      skills: string[];
      website: string | null;
      github: string | null;
      linkedin: string | null;
      coverImageUrl: string | null;
      profilePictureUrl: string | null;
    }>,
  ) {
    if (patch.username != null && patch.username !== '') {
      patch.username = patch.username.toLowerCase().trim();
      const taken = await this.userModel.findOne({
        username: patch.username,
        _id: { $ne: this.oid(userId) },
      });
      if (taken) throw new ConflictException('Username is already taken');
    }
    // Sanitize free-text fields. URL fields are validated by class-validator
    // on the gateway side; we re-apply length caps here as a defence-in-depth
    // safeguard against internal callers.
    if (patch.headline != null) {
      patch.headline = sanitizeText(patch.headline, { maxLength: 200 }) || null;
    }
    if (patch.bio != null) {
      patch.bio = sanitizeText(patch.bio, { maxLength: 2000 }) || null;
    }
    if (patch.experience != null) {
      patch.experience =
        sanitizeText(patch.experience, { maxLength: 2000 }) || null;
    }
    if (patch.skills) {
      patch.skills = patch.skills
        .map((s) => sanitizeText(s, { maxLength: 40 }))
        .filter(Boolean)
        .slice(0, 30);
    }
    const updated = await this.userModel
      .findByIdAndUpdate(this.oid(userId), { $set: patch }, { new: true })
      .select(USER_PUBLIC)
      .lean();
    if (!updated) throw new NotFoundException('User not found');
    await this.hydrateUserPublicMedia(updated as Record<string, unknown>);
    return updated;
  }

  // ─── Follow ──────────────────────────────────────────────────────────────

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }
    const a = this.oid(followerId);
    const b = this.oid(followingId);
    const exists = await this.followModel.findOne({
      followerId: a,
      followingId: b,
    });
    if (exists) return { alreadyFollowing: true };

    await this.followModel.create({ followerId: a, followingId: b });
    await this.userModel.updateOne({ _id: a }, { $inc: { followingCount: 1 } });
    await this.userModel.updateOne({ _id: b }, { $inc: { followersCount: 1 } });

    await this.notificationModel.create({
      userId: b,
      type: 'FOLLOW',
      actorId: a,
      entityId: String(a),
      read: false,
    });

    return { following: true };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const a = this.oid(followerId);
    const b = this.oid(followingId);
    const res = await this.followModel.deleteOne({ followerId: a, followingId: b });
    if (res.deletedCount) {
      await this.userModel.updateOne(
        { _id: a, followingCount: { $gt: 0 } },
        { $inc: { followingCount: -1 } },
      );
      await this.userModel.updateOne(
        { _id: b, followersCount: { $gt: 0 } },
        { $inc: { followersCount: -1 } },
      );
    }
    return { following: false };
  }

  async listFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const uid = this.oid(userId);
    const [rows, total] = await Promise.all([
      this.followModel
        .find({ followingId: uid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('followerId', USER_PUBLIC)
        .lean(),
      this.followModel.countDocuments({ followingId: uid }),
    ]);
    const items = rows.map((r: any) => r.followerId).filter(Boolean);
    await Promise.all(
      items.map((it: unknown) =>
        this.hydrateUserPublicMedia(it as Record<string, unknown>),
      ),
    );
    return { items, total, page, limit };
  }

  async listFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const uid = this.oid(userId);
    const [rows, total] = await Promise.all([
      this.followModel
        .find({ followerId: uid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('followingId', USER_PUBLIC)
        .lean(),
      this.followModel.countDocuments({ followerId: uid }),
    ]);
    const items = rows.map((r: any) => r.followingId).filter(Boolean);
    await Promise.all(
      items.map((it: unknown) =>
        this.hydrateUserPublicMedia(it as Record<string, unknown>),
      ),
    );
    return { items, total, page, limit };
  }

  async isFollowing(followerId: string, followingId: string) {
    const doc = await this.followModel.findOne({
      followerId: this.oid(followerId),
      followingId: this.oid(followingId),
    });
    return { following: !!doc };
  }

  // ─── Messaging (REST-backed; realtime via separate gateway later) ─────────

  async findOrCreateConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot message yourself');
    }
    const a = this.oid(userId);
    const b = this.oid(otherUserId);
    const [x, y] = [a.toHexString(), b.toHexString()].sort();
    const pairKey = `${x}_${y}`;
    let conv = await this.conversationModel.findOne({ pairKey });
    if (!conv) {
      conv = await this.conversationModel.create({
        pairKey,
        participants: [a, b],
        lastMessage: '',
        lastMessageAt: new Date(),
      });
    }
    return conv.toObject();
  }

  async listConversations(userId: string) {
    const uid = this.oid(userId);
    const rows = await this.conversationModel
      .find({ participants: uid })
      .sort({ lastMessageAt: -1 })
      .populate('participants', USER_PUBLIC)
      .lean();
    for (const row of rows as Array<{ participants?: unknown[] }>) {
      const parts = row.participants;
      if (!Array.isArray(parts)) continue;
      await Promise.all(
        parts.map((p) =>
          p && typeof p === 'object'
            ? this.hydrateUserPublicMedia(p as Record<string, unknown>)
            : Promise.resolve(),
        ),
      );
    }
    return rows;
  }

  async listMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.map(String).includes(userId)) {
      throw new BadRequestException('Not a participant');
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.messageModel
        .find({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'name profilePictureUrl username')
        .lean(),
      this.messageModel.countDocuments({ conversationId: conv._id }),
    ]);
    const rows = items.reverse() as Record<string, unknown>[];
    await Promise.all(
      rows.map((m) =>
        this.hydrateDirectMessageMedia(m, String(conv._id)),
      ),
    );
    return { items: rows, total, page, limit };
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: string[],
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
    }>,
  ) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.map(String).includes(senderId)) {
      throw new BadRequestException('Not a participant');
    }
    const trimmed = sanitizeText(content, { maxLength: 8000 });
    const meta = attachmentsMeta ?? [];
    if (!trimmed && !meta.length && !(attachments?.length)) {
      throw new BadRequestException('Empty message');
    }
    const msg = await this.messageModel.create({
      conversationId: conv._id,
      senderId: this.oid(senderId),
      content: trimmed,
      attachments: attachments || [],
      attachmentsMeta: meta,
      seenBy: [this.oid(senderId)],
    });
    const previewBase = trimmed || (meta[0]
      ? meta[0].type === 'VOICE'
        ? '🎤 Voice message'
        : meta[0].type === 'IMAGE'
          ? '🖼️ Image'
          : meta[0].type === 'PDF'
            ? '📄 PDF'
            : '📎 Attachment'
      : '');
    await this.conversationModel.updateOne(
      { _id: conv._id },
      {
        $set: {
          lastMessage: previewBase.slice(0, 200),
          lastMessageAt: new Date(),
          [`lastSeenMessage.${senderId}`]: String(msg._id),
          [`lastSeenAt.${senderId}`]: new Date(),
        },
      },
    );
    const other = conv.participants.find((p: Types.ObjectId) => String(p) !== senderId);
    let notification: unknown = null;
    if (other) {
      const created = await this.createNotification({
        recipientId: String(other),
        actorId: senderId,
        type: 'MESSAGE',
        entityType: 'MESSAGE',
        entityId: String(conv._id),
        title: 'New message',
        message: previewBase.slice(0, 120) || 'Sent you a message',
        meta: { preview: previewBase.slice(0, 120), conversationId: String(conv._id) },
      });
      notification = created.notification;
    }

    if (trimmed) {
      this.aiModeration.enqueue({
        targetType: 'MESSAGE',
        targetId: String(msg._id),
        userId: senderId,
        text: trimmed,
      });
    }
    const out = msg.toObject() as Record<string, unknown>;
    await this.hydrateDirectMessageMedia(out, conversationId);
    return { message: out, notification };
  }

  private directMessagePreviewFromRecord(m: Record<string, unknown>): string {
    const trimmed = String(m.content ?? '').trim();
    const meta = (m.attachmentsMeta as Array<{ type?: string }>) ?? [];
    const legacy = (m.attachments as string[]) ?? [];
    if (trimmed) return trimmed;
    const first = meta[0];
    if (first?.type === 'VOICE') return '🎤 Voice message';
    if (first?.type === 'IMAGE') return '🖼️ Image';
    if (first?.type === 'PDF') return '📄 PDF';
    if (first?.type === 'VIDEO') return '🎬 Video';
    if (first || legacy.length) return '📎 Attachment';
    return '';
  }

  private async refreshConversationPreviewAfterMessagesChange(
    convId: Types.ObjectId,
  ): Promise<void> {
    const last = (await this.messageModel
      .findOne({ conversationId: convId })
      .sort({ createdAt: -1 })
      .lean()) as Record<string, unknown> | null;
    if (!last) {
      await this.conversationModel.updateOne(
        { _id: convId },
        { $set: { lastMessage: '', lastMessageAt: new Date() } },
      );
      return;
    }
    const preview = this.directMessagePreviewFromRecord(last);
    await this.conversationModel.updateOne(
      { _id: convId },
      {
        $set: {
          lastMessage: preview.slice(0, 200),
          lastMessageAt: (last.createdAt as Date) ?? new Date(),
        },
      },
    );
  }

  async updateDirectMessage(
    conversationId: string,
    messageId: string,
    userId: string,
    content: string,
  ) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.map(String).includes(userId)) {
      throw new BadRequestException('Not a participant');
    }
    const msg = await this.messageModel.findOne({
      _id: this.oid(messageId),
      conversationId: conv._id,
    });
    if (!msg) throw new NotFoundException('Message not found');
    if (
      this.normalizeMessageSenderId(msg.senderId) !==
      String(userId).toLowerCase()
    ) {
      throw new ForbiddenException('You can only edit your own messages');
    }
    const trimmed = sanitizeText(content, { maxLength: 8000 });
    const meta = (msg.attachmentsMeta as unknown[]) ?? [];
    const attachments = (msg.attachments as string[]) ?? [];
    if (!trimmed && !meta.length && !attachments.length) {
      throw new BadRequestException('Empty message');
    }
    msg.content = trimmed;
    msg.set('editedAt', new Date());
    await msg.save();
    await this.refreshConversationPreviewAfterMessagesChange(conv._id);
    if (trimmed) {
      this.aiModeration.enqueue({
        targetType: 'MESSAGE',
        targetId: String(messageId),
        userId,
        text: trimmed,
      });
    }
    const updated = await this.messageModel
      .findById(msg._id)
      .populate('senderId', 'name profilePictureUrl username')
      .lean();
    const out = (updated ?? msg.toObject()) as Record<string, unknown>;
    await this.hydrateDirectMessageMedia(out, conversationId);
    return out;
  }

  async deleteDirectMessage(
    conversationId: string,
    messageId: string,
    userId: string,
  ) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.map(String).includes(userId)) {
      throw new BadRequestException('Not a participant');
    }
    const msg = await this.messageModel.findOne({
      _id: this.oid(messageId),
      conversationId: conv._id,
    });
    if (!msg) throw new NotFoundException('Message not found');
    if (
      this.normalizeMessageSenderId(msg.senderId) !==
      String(userId).toLowerCase()
    ) {
      throw new ForbiddenException('You can only delete your own messages');
    }
    await this.messageModel.deleteOne({ _id: msg._id });
    await this.refreshConversationPreviewAfterMessagesChange(conv._id);
    return { ok: true as const, messageId: String(msg._id) };
  }

  // ─── Group chat (members-only; isolated from global feed) ─────────────────

  private async hydrateGroupMessageMedia(
    msg: Record<string, unknown>,
  ): Promise<void> {
    const groupId = msg.groupId != null ? String(msg.groupId) : '';
    if (stableMediaGetEnabled() && groupId) {
      applyStableGroupMessageMedia(groupId, msg);
      return;
    }
    await this.hydrateDirectMessageMedia(msg);
    const url = msg.attachmentUrl;
    if (typeof url === 'string') {
      const signed = await this.signCommunityMediaReadUrl(url);
      if (signed) msg.attachmentUrl = signed;
    }
  }

  private groupChatReadAt(
    group: { chatReadAtByUser?: Map<string, Date> | Record<string, Date> },
    userId: string,
  ): Date | null {
    const map = group.chatReadAtByUser;
    if (!map) return null;
    if (map instanceof Map) {
      const v = map.get(userId);
      return v ? new Date(v) : null;
    }
    const raw = (map as Record<string, Date>)[userId];
    return raw ? new Date(raw) : null;
  }

  async getGroupChatUnreadCount(groupId: string, userId: string) {
    const { role } = await this.getGroupById(groupId, userId);
    this.assertGroupPostAccess(role, false);
    const group = await this.groupModel.findById(groupId).lean();
    if (!group) throw new NotFoundException('Group not found');
    const readAt = this.groupChatReadAt(
      group as { chatReadAtByUser?: Map<string, Date> },
      userId,
    );
    const filter: Record<string, unknown> = {
      groupId: this.oid(groupId),
      deletedAt: null,
    };
    if (readAt) filter.createdAt = { $gt: readAt };
    const unreadCount = await this.groupMessageModel.countDocuments(filter);
    return { unreadCount };
  }

  private isGroupChatModerator(
    role: ReturnType<SocialHubService['computeGroupRole']>,
  ): boolean {
    return (
      role === 'OWNER' ||
      role === 'ADMIN' ||
      role === 'MODERATOR' ||
      role === 'INSTRUCTOR'
    );
  }

  private groupMessagePopulate() {
    return [
      { path: 'senderId', select: 'name profilePictureUrl username' },
      {
        path: 'replyTo',
        select: 'text senderId type deletedAt attachmentsMeta',
        populate: { path: 'senderId', select: 'name profilePictureUrl username' },
      },
    ];
  }

  private async loadGroupMessageById(messageId: string) {
    const lean = await this.groupMessageModel
      .findById(this.oid(messageId))
      .populate(this.groupMessagePopulate())
      .lean();
    if (!lean || (lean as { deletedAt?: Date }).deletedAt) return null;
    const row = lean as Record<string, unknown>;
    await this.hydrateGroupMessageMedia(row);
    return row;
  }

  async listGroupMessages(
    groupId: string,
    userId: string,
    opts?: { page?: number; limit?: number; cursor?: string },
  ) {
    const { role } = await this.getGroupById(groupId, userId);
    this.assertGroupPostAccess(role, false);
    const gid = this.oid(groupId);
    const limit = Math.min(Math.max(opts?.limit ?? 40, 1), 80);

    if (opts?.cursor) {
      const [ts, id] = String(opts.cursor).split('|');
      const cursorDate = ts ? new Date(ts) : null;
      const cursorId =
        id && Types.ObjectId.isValid(id) ? this.oid(id) : null;
      const filter: Record<string, unknown> = {
        groupId: gid,
        deletedAt: null,
      };
      if (cursorDate && !Number.isNaN(cursorDate.getTime()) && cursorId) {
        filter.$or = [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ];
      }
      const raw = await this.groupMessageModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
        .populate(this.groupMessagePopulate())
        .lean();
      const hasMore = raw.length > limit;
      const pageRows = hasMore ? raw.slice(0, limit) : raw;
      const rows = (pageRows as Record<string, unknown>[]).reverse();
      await Promise.all(rows.map((m) => this.hydrateGroupMessageMedia(m)));
      const oldest = rows[0] as { createdAt?: Date; _id?: Types.ObjectId };
      const nextCursor =
        hasMore && oldest?.createdAt && oldest?._id
          ? `${new Date(oldest.createdAt).toISOString()}|${String(oldest._id)}`
          : null;
      const { unreadCount } = await this.getGroupChatUnreadCount(
        groupId,
        userId,
      );
      const group = await this.groupModel
        .findById(gid)
        .select('pinnedChatMessages')
        .lean();
      const pinned = await this.hydratePinnedChatMessages(
        group as { pinnedChatMessages?: Array<{ messageId: Types.ObjectId }> },
      );
      return {
        items: rows,
        total: undefined,
        page: undefined,
        limit,
        unreadCount,
        hasMore,
        nextCursor,
        pinnedMessages: pinned,
      };
    }

    const page = Math.max(opts?.page ?? 1, 1);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.groupMessageModel
        .find({ groupId: gid, deletedAt: null })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate(this.groupMessagePopulate())
        .lean(),
      this.groupMessageModel.countDocuments({ groupId: gid, deletedAt: null }),
    ]);
    const rows = (items as Record<string, unknown>[]).reverse();
    await Promise.all(rows.map((m) => this.hydrateGroupMessageMedia(m)));
    const { unreadCount } = await this.getGroupChatUnreadCount(groupId, userId);
    const group = await this.groupModel
      .findById(gid)
      .select('pinnedChatMessages')
      .lean();
    const pinned = await this.hydratePinnedChatMessages(
      group as { pinnedChatMessages?: Array<{ messageId: Types.ObjectId }> },
    );
    const oldest = rows[0] as { createdAt?: Date; _id?: Types.ObjectId };
    const nextCursor =
      rows.length >= limit && oldest?.createdAt && oldest?._id
        ? `${new Date(oldest.createdAt).toISOString()}|${String(oldest._id)}`
        : null;
    return {
      items: rows,
      total,
      page,
      limit,
      unreadCount,
      hasMore: page * limit < total,
      nextCursor,
      pinnedMessages: pinned,
    };
  }

  private async hydratePinnedChatMessages(group: {
    pinnedChatMessages?: Array<{ messageId: Types.ObjectId }>;
  }) {
    const ids = (group.pinnedChatMessages ?? []).map((p) => p.messageId);
    if (!ids.length) return [];
    const msgs = await this.groupMessageModel
      .find({ _id: { $in: ids }, deletedAt: null })
      .populate(this.groupMessagePopulate())
      .lean();
    const byId = new Map(
      (msgs as Array<Record<string, unknown>>).map((m) => [
        String((m._id as Types.ObjectId).toString()),
        m,
      ]),
    );
    const out: Record<string, unknown>[] = [];
    for (const id of ids) {
      const m = byId.get(String(id));
      if (m) {
        await this.hydrateGroupMessageMedia(m);
        out.push(m);
      }
    }
    return out;
  }

  async sendGroupMessage(
    groupId: string,
    senderId: string,
    input: {
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
    await this.assertUserPlatformAccess(senderId);
    const { role, group } = await this.getGroupById(groupId, senderId);
    this.assertGroupPostAccess(role, false);
    if (this.isUserMutedInGroup(group as { mutedMembers?: Array<{ userId: Types.ObjectId; until?: Date | null }> }, senderId)) {
      throw new ForbiddenException('USER_MUTED');
    }
    if (
      this.isGroupChatLocked(group as { chatLockedUntil?: Date | null }) &&
      !this.isGroupChatModerator(role)
    ) {
      throw new BadRequestException('CHAT_LOCKED');
    }
    const trimmed = sanitizeText(input.text ?? '', { maxLength: 8000 });
    const meta = input.attachmentsMeta ?? [];
    if (!trimmed && !meta.length && !input.attachmentUrl) {
      throw new BadRequestException('Empty message');
    }
    if (trimmed) {
      const auto = this.autoMod.evaluateText(trimmed, {
        userId: senderId,
        surface: 'chat',
      });
      if (auto.shouldBlock) {
        throw new BadRequestException(
          'Message could not be sent. Please revise and try again.',
        );
      }
    }
    let msgType: 'text' | 'image' | 'file' | 'audio' =
      input.type ?? 'text';
    if (meta[0]?.type === 'VOICE' || input.mimeType?.startsWith('audio/')) {
      msgType = 'audio';
    } else if (
      meta[0]?.type === 'IMAGE' ||
      input.mimeType?.startsWith('image/')
    ) {
      msgType = 'image';
    } else if (meta.length || input.attachmentUrl) {
      msgType = 'file';
    }
    const msg = await this.groupMessageModel.create({
      groupId: this.oid(groupId),
      senderId: this.oid(senderId),
      type: msgType,
      text: trimmed,
      attachmentUrl: input.attachmentUrl ?? meta[0]?.url ?? null,
      mimeType: input.mimeType ?? meta[0]?.mimeType ?? null,
      attachmentsMeta: meta,
      replyTo: input.replyTo ? this.oid(input.replyTo) : null,
    });
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      {
        $set: {
          [`chatReadAtByUser.${senderId}`]: new Date(),
        },
      },
    );
    if (trimmed) {
      this.aiModeration.enqueue({
        targetType: 'MESSAGE',
        targetId: String(msg._id),
        userId: senderId,
        text: trimmed,
      });
    }
    const populated = await this.groupMessageModel
      .findById(msg._id)
      .populate(this.groupMessagePopulate())
      .lean();
    const out = (populated ?? msg.toObject()) as Record<string, unknown>;
    await this.hydrateGroupMessageMedia(out);
    const groupDoc = await this.groupModel
      .findById(this.oid(groupId))
      .select('members name courseId isCourseGroup chatNotificationMutedByUser')
      .lean();
    const g = groupDoc as {
      members?: Types.ObjectId[];
      name?: string;
      courseId?: Types.ObjectId | null;
      isCourseGroup?: boolean;
      chatNotificationMutedByUser?: Map<string, boolean> | Record<string, boolean>;
    };
    const mentionedUserIds = trimmed
      ? await this.notificationAudience.resolveMentionedUserIds(
          groupId,
          trimmed,
          senderId,
        )
      : [];
    const mentionedSet = new Set(mentionedUserIds.map(String));
    const muteMap = g?.chatNotificationMutedByUser;
    const isMuted = (uid: string) => {
      if (mentionedSet.has(uid)) return false;
      if (!muteMap) return false;
      if (muteMap instanceof Map) return muteMap.get(uid) === true;
      return (muteMap as Record<string, boolean>)[uid] === true;
    };
    const notifyUserIds = (g?.members ?? [])
      .map((m) => String(m))
      .filter((id) => id && id !== senderId && !isMuted(id));
    return {
      message: out,
      notifyUserIds,
      mentionedUserIds,
      groupName: g?.name ?? 'Group',
      groupCourseId:
        g?.isCourseGroup && g?.courseId ? String(g.courseId) : null,
    };
  }

  async markGroupChatSeen(
    groupId: string,
    userId: string,
    messageId?: string,
  ) {
    const { role } = await this.getGroupById(groupId, userId);
    this.assertGroupPostAccess(role, false);
    let at = new Date();
    if (messageId) {
      const msg = (await this.groupMessageModel
        .findOne({
          _id: this.oid(messageId),
          groupId: this.oid(groupId),
          deletedAt: null,
        })
        .lean()) as { createdAt?: Date } | null;
      if (msg?.createdAt) at = new Date(msg.createdAt);
    }
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      { $set: { [`chatReadAtByUser.${userId}`]: at } },
    );
    const { unreadCount } = await this.getGroupChatUnreadCount(groupId, userId);
    return { ok: true as const, unreadCount };
  }

  async updateGroupMessage(
    groupId: string,
    messageId: string,
    userId: string,
    text: string,
  ) {
    const { role } = await this.getGroupById(groupId, userId);
    this.assertGroupPostAccess(role, false);
    const msg = await this.groupMessageModel.findOne({
      _id: this.oid(messageId),
      groupId: this.oid(groupId),
      deletedAt: null,
    });
    if (!msg) throw new NotFoundException('Message not found');
    if (String(msg.senderId) !== String(userId)) {
      throw new ForbiddenException('You can only edit your own messages');
    }
    const trimmed = sanitizeText(text, { maxLength: 8000 });
    if (!trimmed && !(msg.attachmentsMeta as unknown[])?.length) {
      throw new BadRequestException('Empty message');
    }
    msg.text = trimmed;
    msg.set('editedAt', new Date());
    await msg.save();
    if (trimmed) {
      this.aiModeration.enqueue({
        targetType: 'MESSAGE',
        targetId: messageId,
        userId,
        text: trimmed,
      });
    }
    const out = await this.loadGroupMessageById(messageId);
    if (!out) throw new NotFoundException('Message not found');
    return out;
  }

  async deleteGroupMessage(
    groupId: string,
    messageId: string,
    userId: string,
  ) {
    const { role } = await this.getGroupById(groupId, userId);
    this.assertGroupPostAccess(role, false);
    const msg = await this.groupMessageModel.findOne({
      _id: this.oid(messageId),
      groupId: this.oid(groupId),
      deletedAt: null,
    });
    if (!msg) throw new NotFoundException('Message not found');
    const isOwner = String(msg.senderId) === String(userId);
    if (!isOwner && !this.isGroupChatModerator(role)) {
      throw new ForbiddenException('Cannot delete this message');
    }
    msg.set('deletedAt', new Date());
    msg.set('text', '');
    await msg.save();
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      { $pull: { pinnedChatMessages: { messageId: msg._id } } },
    );
    return { ok: true as const, messageId: String(msg._id) };
  }

  async toggleGroupMessageReaction(
    groupId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ) {
    const { role } = await this.getGroupById(groupId, userId);
    this.assertGroupPostAccess(role, false);
    const safeEmoji = String(emoji).trim().slice(0, 16);
    if (!safeEmoji) throw new BadRequestException('Invalid emoji');
    const msg = await this.groupMessageModel.findOne({
      _id: this.oid(messageId),
      groupId: this.oid(groupId),
      deletedAt: null,
    });
    if (!msg) throw new NotFoundException('Message not found');
    const uid = this.oid(userId);
    const reactions =
      (msg.reactions as Array<{ emoji: string; userId: Types.ObjectId }>) ??
      [];
    const idx = reactions.findIndex(
      (r) => String(r.userId) === String(uid) && r.emoji === safeEmoji,
    );
    if (idx >= 0) {
      reactions.splice(idx, 1);
    } else {
      reactions.push({ emoji: safeEmoji, userId: uid });
    }
    msg.set('reactions', reactions);
    await msg.save();
    const out = await this.loadGroupMessageById(messageId);
    if (!out) throw new NotFoundException('Message not found');
    return { message: out, added: idx < 0 };
  }

  async pinGroupChatMessage(
    groupId: string,
    messageId: string,
    userId: string,
  ) {
    const { role } = await this.getGroupById(groupId, userId);
    this.assertGroupPostAccess(role, true);
    const msg = await this.groupMessageModel.findOne({
      _id: this.oid(messageId),
      groupId: this.oid(groupId),
      deletedAt: null,
    });
    if (!msg) throw new NotFoundException('Message not found');
    const gid = this.oid(groupId);
    const group = await this.groupModel.findById(gid);
    if (!group) throw new NotFoundException('Group not found');
    const pins =
      (group as { pinnedChatMessages?: Array<Record<string, unknown>> })
        .pinnedChatMessages ?? [];
    if (
      !pins.some((p) => String(p.messageId) === String(messageId))
    ) {
      if (pins.length >= 5) {
        throw new BadRequestException('Maximum 5 pinned messages');
      }
      pins.push({
        messageId: msg._id,
        pinnedBy: this.oid(userId),
        pinnedAt: new Date(),
      });
      group.set('pinnedChatMessages', pins);
      await group.save();
    }
    const pinned = await this.hydratePinnedChatMessages(
      group as { pinnedChatMessages?: Array<{ messageId: Types.ObjectId }> },
    );
    return { ok: true, pinnedMessages: pinned };
  }

  async unpinGroupChatMessage(
    groupId: string,
    messageId: string,
    userId: string,
  ) {
    const { role } = await this.getGroupById(groupId, userId);
    this.assertGroupPostAccess(role, true);
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      { $pull: { pinnedChatMessages: { messageId: this.oid(messageId) } } },
    );
    const group = await this.groupModel
      .findById(groupId)
      .select('pinnedChatMessages')
      .lean();
    const pinned = await this.hydratePinnedChatMessages(
      group as { pinnedChatMessages?: Array<{ messageId: Types.ObjectId }> },
    );
    return { ok: true, pinnedMessages: pinned };
  }

  async searchGroupMessages(
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
    const { role } = await this.getGroupById(groupId, userId);
    this.assertGroupPostAccess(role, false);
    const gid = this.oid(groupId);
    const limit = Math.min(Math.max(opts.limit ?? 25, 1), 50);
    const filter: Record<string, unknown> = {
      groupId: gid,
      deletedAt: null,
    };
    if (opts.senderId && Types.ObjectId.isValid(opts.senderId)) {
      filter.senderId = this.oid(opts.senderId);
    }
    if (opts.hasAttachment) {
      filter.$or = [
        { attachmentUrl: { $ne: null } },
        { 'attachmentsMeta.0': { $exists: true } },
      ];
    }
    const q = opts.q?.trim();
    if (q) {
      filter.text = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    if (opts.cursor) {
      const [ts, id] = String(opts.cursor).split('|');
      const cursorDate = ts ? new Date(ts) : null;
      const cursorId =
        id && Types.ObjectId.isValid(id) ? this.oid(id) : null;
      if (cursorDate && cursorId) {
        filter.$and = [
          ...(filter.$and as unknown[] ?? []),
          {
            $or: [
              { createdAt: { $lt: cursorDate } },
              { createdAt: cursorDate, _id: { $lt: cursorId } },
            ],
          },
        ];
      }
    }
    const raw = await this.groupMessageModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate(this.groupMessagePopulate())
      .lean();
    const hasMore = raw.length > limit;
    const pageRows = hasMore ? raw.slice(0, limit) : raw;
    const items = pageRows as Record<string, unknown>[];
    await Promise.all(items.map((m) => this.hydrateGroupMessageMedia(m)));
    const last = items[items.length - 1] as {
      createdAt?: Date;
      _id?: Types.ObjectId;
    };
    const nextCursor =
      hasMore && last?.createdAt && last?._id
        ? `${new Date(last.createdAt).toISOString()}|${String(last._id)}`
        : null;
    return { items, hasMore, nextCursor };
  }

  /**
   * Mark up to `messageId` as seen for `userId`. If `messageId` is omitted,
   * the latest message in the conversation is used. Idempotent.
   */
  async markConversationSeen(
    conversationId: string,
    userId: string,
    messageId?: string,
  ) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.map(String).includes(userId)) {
      throw new BadRequestException('Not a participant');
    }
    const uid = this.oid(userId);
    let targetMessageId: string | null = messageId ?? null;
    if (!targetMessageId) {
      const latest = (await this.messageModel
        .findOne({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .select('_id')
        .lean()) as { _id: Types.ObjectId } | null;
      targetMessageId = latest ? String(latest._id) : null;
    }

    if (targetMessageId) {
      await this.messageModel.updateMany(
        {
          conversationId: conv._id,
          _id: { $lte: this.oid(targetMessageId) },
          seenBy: { $ne: uid },
        },
        { $addToSet: { seenBy: uid } },
      );
    }
    const seenAt = new Date();
    await this.conversationModel.updateOne(
      { _id: conv._id },
      {
        $set: {
          [`lastSeenAt.${userId}`]: seenAt,
          ...(targetMessageId
            ? { [`lastSeenMessage.${userId}`]: targetMessageId }
            : {}),
        },
      },
    );
    return {
      ok: true,
      conversationId: String(conv._id),
      userId,
      lastSeenMessage: targetMessageId,
      lastSeenAt: seenAt,
    };
  }

  // ─── Notifications ───────────────────────────────────────────────────────

  async listNotifications(
    userId: string,
    opts: {
      page?: number;
      limit?: number;
      cursor?: string;
      unreadOnly?: boolean;
    } = {},
  ) {
    const limit = Math.min(50, Math.max(5, opts.limit ?? 30));
    const uid = this.oid(userId);
    const filter: Record<string, unknown> = { userId: uid };
    if (opts.unreadOnly) filter.read = false;

    if (opts.cursor) {
      const [ts, id] = String(opts.cursor).split('|');
      if (ts && id && Types.ObjectId.isValid(id)) {
        const createdAt = new Date(ts);
        filter.$or = [
          { createdAt: { $lt: createdAt } },
          { createdAt, _id: { $lt: this.oid(id) } },
        ];
      }
    }

    const skip = opts.cursor ? 0 : Math.max(0, ((opts.page ?? 1) - 1) * limit);

    const [rawItems, total, unread] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit + 1)
        .populate('actorId', 'name profilePictureUrl username')
        .lean(),
      this.notificationModel.countDocuments({ userId: uid }),
      this.notificationUnread.getUnread(userId),
    ]);

    const hasMore = rawItems.length > limit;
    const items = hasMore ? rawItems.slice(0, limit) : rawItems;
    const last = items[items.length - 1] as
      | { _id?: Types.ObjectId; createdAt?: Date }
      | undefined;
    const nextCursor =
      hasMore && last?._id && last.createdAt
        ? `${new Date(last.createdAt).toISOString()}|${String(last._id)}`
        : null;

    for (const it of items as Array<{ actorId?: unknown }>) {
      const a = it.actorId;
      if (a && typeof a === 'object') {
        await this.hydrateUserPublicMedia(a as Record<string, unknown>);
      }
    }

    return {
      items,
      total,
      unread,
      page: opts.page ?? 1,
      limit,
      hasMore,
      nextCursor,
    };
  }

  async markNotificationsRead(userId: string, ids?: string[]) {
    const uid = this.oid(userId);
    const filter: Record<string, unknown> = { userId: uid, read: false };
    if (ids?.length) {
      filter._id = { $in: ids.map((i) => this.oid(i)) };
    }
    const toMark = ids?.length
      ? ids.length
      : await this.notificationModel.countDocuments(filter);
    await this.notificationModel.updateMany(filter, { $set: { read: true } });
    const unread = ids?.length
      ? await this.notificationUnread.decrement(userId, toMark)
      : await this.notificationUnread.setCount(userId, 0);
    return { ok: true, unread };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const uid = this.oid(userId);
    const nid = this.oid(notificationId);
    const existing = await this.notificationModel
      .findOne({ _id: nid, userId: uid })
      .lean();
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }
    await this.notificationModel.deleteOne({ _id: nid, userId: uid });
    const unread =
      (existing as { read?: boolean }).read === false
        ? await this.notificationUnread.decrement(userId, 1)
        : await this.notificationUnread.getUnread(userId);
    return { ok: true, unread };
  }

  async clearReadNotifications(userId: string) {
    const uid = this.oid(userId);
    const res = await this.notificationModel.deleteMany({
      userId: uid,
      read: true,
    });
    return { ok: true, deleted: res.deletedCount ?? 0 };
  }

  /**
   * Persist a notification and return the hydrated document for socket delivery.
   * Skips self-notifications by default.
   */
  async createNotification(input: {
    recipientId: string;
    actorId: string;
    type: string;
    entityType?: string;
    entityId?: string;
    title?: string;
    message?: string;
    meta?: Record<string, unknown>;
    skipSelf?: boolean;
    force?: boolean;
  }) {
    const result = await this.notificationDispatch.dispatchOne({
      ...input,
      type: String(input.type).toUpperCase(),
    });
    const n = result.notification;
    if (n?.actorId && typeof n.actorId === 'object') {
      await this.hydrateUserPublicMedia(n.actorId as Record<string, unknown>);
    }
    return {
      notification: n,
      skipped: result.skipped,
      duplicate: result.duplicate,
      unread: result.unread,
    };
  }

  async dispatchNotificationFanOut(
    input: import('./notifications/notification-dispatch.service').DispatchFanOutInput,
  ) {
    return this.notificationDispatch.dispatchFanOut(input);
  }

  async getNotificationPreferences(userId: string) {
    return this.notificationPreferences.getPreferences(userId);
  }

  async updateNotificationPreferences(
    userId: string,
    patch: Record<string, boolean>,
  ) {
    return this.notificationPreferences.updatePreferences(userId, patch);
  }

  async setGroupChatNotificationsMuted(
    groupId: string,
    userId: string,
    muted: boolean,
  ) {
    await this.getGroupById(groupId, userId);
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      {
        $set: {
          [`chatNotificationMutedByUser.${userId}`]: muted,
        },
      },
    );
    return { ok: true, muted };
  }

  // ─── Groups ────────────────────────────────────────────────────────────────

  async createGroup(
    ownerId: string,
    dto: {
      name: string;
      description?: string;
      visibility?: string;
      avatarUrl?: string | null;
    },
  ) {
    const name = sanitizeText(dto.name, { maxLength: 120 });
    if (!name) {
      throw new BadRequestException('Group name cannot be empty');
    }
    const g = await this.groupModel.create({
      name,
      description: sanitizeText(dto.description, { maxLength: 2000 }),
      avatarUrl: dto.avatarUrl ?? null,
      ownerId: this.oid(ownerId),
      members: [this.oid(ownerId)],
      membersCount: 1,
      visibility: dto.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
    });
    await this.ensureDefaultChannels(String(g._id), ownerId);
    return g.toObject();
  }

  async listGroups(page = 1, limit = 20, memberUserId?: string) {
    const skip = (page - 1) * limit;
    /** Public directory groups (non–course-interest groups). */
    const publicNonCourse = {
      visibility: 'PUBLIC' as const,
      isCourseGroup: { $ne: true },
      ...this.activeCommunityGroupFilter(),
    };
    /**
     * Course communities are usually PRIVATE. List them when the viewer is
     * owner, instructor, admin, or member — not only `members[]` (repairs
     * legacy rows and matches how roles are computed elsewhere).
     */
    const filter =
      memberUserId && Types.ObjectId.isValid(memberUserId)
        ? (() => {
            const uid = this.oid(memberUserId);
            const courseGroupLeg = {
              isCourseGroup: true,
              ...this.activeCommunityGroupFilter(),
              $or: [
                { members: uid },
                { ownerId: uid },
                { instructorId: uid },
                { admins: uid },
              ],
            };
            return { $or: [publicNonCourse, courseGroupLeg] };
          })()
        : publicNonCourse;

    const [items, total] = await Promise.all([
      this.groupModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('ownerId', USER_PUBLIC)
        .lean(),
      this.groupModel.countDocuments(filter),
    ]);

    /** Same course can appear twice if legacy races created duplicate rows; list one. */
    const deduped: typeof items = [];
    const seenCourseIds = new Set<string>();
    for (const row of items) {
      const g = row as {
        isCourseGroup?: boolean;
        courseId?: unknown;
      };
      if (g.isCourseGroup && g.courseId != null) {
        const cid = String(g.courseId);
        if (seenCourseIds.has(cid)) continue;
        seenCourseIds.add(cid);
      }
      deduped.push(row);
    }

    this.logger.log(
      `[COURSE_GROUP_QUERY] listGroups memberUserId=${memberUserId ?? 'none'} total=${total} page=${page} returned=${deduped.length}`,
    );

    return { items: deduped, total, page, limit };
  }

  async joinGroup(groupId: string, userId: string) {
    const g = await this.groupModel.findOne({
      _id: this.oid(groupId),
      ...this.activeCommunityGroupFilter(),
    });
    if (!g) throw new NotFoundException('Group not found');
    const uid = this.oid(userId);
    if (g.visibility === 'PRIVATE') {
      throw new BadRequestException(
        'Private group — invite required',
      );
    }
    const res = await this.groupModel.updateOne(
      { _id: g._id, members: { $ne: uid } },
      { $addToSet: { members: uid }, $inc: { membersCount: 1 } },
    );
    return { joined: true, added: !!res.modifiedCount };
  }

  async leaveGroup(groupId: string, userId: string) {
    const uid = this.oid(userId);
    const res = await this.groupModel.updateOne(
      {
        _id: this.oid(groupId),
        ownerId: { $ne: uid },
        members: uid,
        ...this.activeCommunityGroupFilter(),
      },
      { $pull: { members: uid }, $inc: { membersCount: -1 } },
    );
    return { left: true, removed: !!res.modifiedCount };
  }

  // ─── Course Communities ────────────────────────────────────────────────────

  /**
   * Idempotently ensures a course community exists. Called from a NATS event
   * `app.events.course.created` emitted by the LMS service.
   *
   * If the course group already exists it is returned untouched (so re-emits
   * are safe). Otherwise a PRIVATE group with the instructor as OWNER is
   * created, and the default `#general` / `#questions` / `#resources` /
   * `#announcements` channels are seeded.
   */
  async ensureCourseGroup(input: {
    courseId: string;
    instructorId: string;
    name: string;
    description?: string;
    /** Who invoked ensure (gateway, NATS, repair, …) — duplicate diagnostics. */
    triggerSource?: string;
  }) {
    const trigger = (input.triggerSource ?? 'unspecified').trim() || 'unspecified';
    this.logger.log(
      `[COURSE_GROUP_CREATE_TRIGGER] source=${trigger} courseId=${input.courseId} requesterId=${input.instructorId} ts=${new Date().toISOString()}`,
    );

    if (!Types.ObjectId.isValid(input.courseId)) {
      throw new BadRequestException('Invalid courseId');
    }
    if (!Types.ObjectId.isValid(input.instructorId)) {
      throw new BadRequestException('Invalid instructorId');
    }
    const courseOid = new Types.ObjectId(input.courseId);
    const instructorOid = new Types.ObjectId(input.instructorId);

    const existing = await this.groupModel.findOne({
      isCourseGroup: true,
      ...this.activeCommunityGroupFilter(),
      ...this.courseGroupCourseIdFilter(input.courseId),
    });
    if (existing) {
      await this.groupModel.updateOne(
        { _id: existing._id },
        {
          $addToSet: {
            members: instructorOid,
            admins: instructorOid,
          },
        },
      );
      const refreshed = await this.groupModel
        .findById(existing._id)
        .lean()
        .exec();
      const m = (refreshed as { members?: unknown[] })?.members ?? [];
      this.logger.log(
        `[COURSE_GROUP_MEMBERSHIP] ensureCourseGroup existing courseId=${input.courseId} groupId=${String(existing._id)} membersCount=${m.length}`,
      );
      return refreshed ?? existing.toObject();
    }

    const racedCheck = await this.groupModel.findOne({
      isCourseGroup: true,
      ...this.activeCommunityGroupFilter(),
      ...this.courseGroupCourseIdFilter(input.courseId),
    });
    if (racedCheck) {
      await this.groupModel.updateOne(
        { _id: racedCheck._id },
        {
          $addToSet: {
            members: instructorOid,
            admins: instructorOid,
          },
        },
      );
      const r2 = await this.groupModel.findById(racedCheck._id).lean().exec();
      this.logger.log(
        `[COURSE_GROUP_CREATE_TRIGGER] source=${trigger} action=late-existing courseId=${input.courseId} groupId=${String(racedCheck._id)}`,
      );
      return r2 ?? (racedCheck as Record<string, unknown>);
    }

    try {
      const g = await this.groupModel.create({
        name: input.name?.slice(0, 120) || 'Course Community',
        description: (input.description || '').slice(0, 2000),
        ownerId: instructorOid,
        instructorId: instructorOid,
        members: [instructorOid],
        admins: [instructorOid],
        membersCount: 1,
        isCourseGroup: true,
        courseId: courseOid,
        visibility: 'PRIVATE',
        coursePrivacyMode: 'COURSE_PRIVATE',
      });
      await this.ensureDefaultChannels(String(g._id), input.instructorId);
      this.logger.log(
        `[COURSE_GROUP_MEMBERSHIP] ensureCourseGroup created courseId=${input.courseId} groupId=${String(g._id)} instructorId=${input.instructorId} membersCount=${g.members?.length ?? 0}`,
      );
      return g.toObject();
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        const raced = await this.groupModel
          .findOne({
            isCourseGroup: true,
            ...this.activeCommunityGroupFilter(),
            ...this.courseGroupCourseIdFilter(input.courseId),
          })
          .lean()
          .exec();
        if (raced && !Array.isArray(raced)) {
          const rid = (raced as { _id: unknown })._id;
          await this.groupModel.updateOne(
            { _id: rid },
            {
              $addToSet: {
                members: instructorOid,
                admins: instructorOid,
              },
            },
          );
          const refreshed = await this.groupModel
            .findById(rid)
            .lean()
            .exec();
          this.logger.log(
            `[COURSE_GROUP_MEMBERSHIP] ensureCourseGroup duplicateKey→existing courseId=${input.courseId} groupId=${String(rid)}`,
          );
          return refreshed ?? raced;
        }
      }
      throw err;
    }
  }

  /** Idempotent: add a student to the course group when they enroll. */
  async joinCourseGroup(courseId: string, userId: string) {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Invalid courseId');
    }
    const group = await this.groupModel.findOne({
      isCourseGroup: true,
      ...this.activeCommunityGroupFilter(),
      ...this.courseGroupCourseIdFilter(courseId),
    });
    if (!group) {
      this.logger.warn(
        `[COURSE_GROUP_MEMBERSHIP] joinCourseGroup NO_GROUP courseId=${courseId} userId=${userId}`,
      );
      return { joined: false, reason: 'NO_GROUP' };
    }
    const uid = this.oid(userId);
    const res = await this.groupModel.updateOne(
      { _id: group._id, members: { $ne: uid } },
      { $addToSet: { members: uid }, $inc: { membersCount: 1 } },
    );
    this.logger.log(
      `[COURSE_GROUP_MEMBERSHIP] joinCourseGroup courseId=${courseId} userId=${userId} groupId=${String(group._id)} added=${!!res.modifiedCount}`,
    );
    return { joined: true, added: !!res.modifiedCount, groupId: String(group._id) };
  }

  /** Idempotent: remove a student from the course group on unenroll. */
  async leaveCourseGroup(courseId: string, userId: string) {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Invalid courseId');
    }
    const group = await this.groupModel.findOne({
      isCourseGroup: true,
      ...this.activeCommunityGroupFilter(),
      ...this.courseGroupCourseIdFilter(courseId),
    });
    if (!group) return { left: false, reason: 'NO_GROUP' };
    const uid = this.oid(userId);
    // Never remove the instructor / owner
    if (String(group.ownerId) === String(uid)) {
      return { left: false, reason: 'OWNER' };
    }
    const res = await this.groupModel.updateOne(
      { _id: group._id, members: uid },
      { $pull: { members: uid }, $inc: { membersCount: -1 } },
    );
    return { left: true, removed: !!res.modifiedCount, groupId: String(group._id) };
  }

  /**
   * Soft-delete the course-linked community group when the LMS course is removed.
   * Idempotent. Verifies owner + courseId (or optional known group id).
   */
  async softDeleteCourseGroupForDeletedCourse(input: {
    courseId: string;
    ownerId: string;
    communityGroupId?: string;
  }) {
    const courseId = String(input.courseId).trim();
    const ownerId = String(input.ownerId).trim();
    const hint = input.communityGroupId?.trim();
    this.logger.log(
      `[COURSE_DELETE_SYNC] courseId=${courseId} ownerId=${ownerId} communityGroupId=${hint ?? 'none'}`,
    );

    let group: Record<string, unknown> | null = null;
    if (hint && Types.ObjectId.isValid(hint)) {
      group = (await this.groupModel
        .findOne({
          _id: this.oid(hint),
          ...this.activeCommunityGroupFilter(),
        })
        .lean()) as Record<string, unknown> | null;
    }
    if (!group) {
      group = (await this.groupModel
        .findOne({
          isCourseGroup: true,
          ...this.activeCommunityGroupFilter(),
          ...this.courseGroupCourseIdFilter(courseId),
        })
        .lean()) as Record<string, unknown> | null;
    }
    if (!group) {
      this.logger.log(
        `[COURSE_GROUP_DELETE] noop courseId=${courseId} (no active group)`,
      );
      return { ok: true, noop: true as const };
    }

    const gid = String(group._id);
    const rawCid = group.courseId;
    const gCourseHex =
      rawCid &&
      typeof rawCid === 'object' &&
      '$oid' in (rawCid as Record<string, unknown>)
        ? String((rawCid as { $oid: string }).$oid)
        : rawCid != null
          ? String(rawCid)
          : '';
    const ownerOk = String(group.ownerId ?? '') === ownerId;
    const courseOk =
      group.isCourseGroup === true && gCourseHex === courseId;

    if (!ownerOk || !courseOk) {
      this.logger.warn(
        `[COURSE_GROUP_DELETE_FAILED] courseId=${courseId} groupId=${gid} ownerId=${ownerId} reason=OWNER_OR_COURSE_MISMATCH`,
      );
      return { ok: false, reason: 'FORBIDDEN' as const };
    }

    const now = new Date();
    const ownerOid = this.oid(ownerId);
    const gOid = this.oid(gid);

    await this.postModel.updateMany(
      { groupId: gOid, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: now, deletedBy: ownerOid } },
    );

    await this.groupModel.updateOne(
      { _id: gOid },
      {
        $set: {
          isDeleted: true,
          deletedAt: now,
          deletedBy: ownerOid,
        },
      },
    );

    this.logger.log(
      `[COURSE_GROUP_DELETE] soft groupId=${gid} courseId=${courseId} ownerId=${ownerId}`,
    );
    return { ok: true, groupId: gid };
  }

  /**
   * Repair script helper: soft-delete active course-linked groups when the LMS
   * `courses` document no longer exists (stale community row after partial failures).
   */
  async repairSoftDeleteOrphanCourseGroupsByLms(
    lmsConn: Connection,
    options?: { dryRun?: boolean },
  ): Promise<{ scanned: number; softDeleted: number; errors: number }> {
    const coursesCol = lmsConn.db?.collection('courses');
    if (!coursesCol) {
      throw new BadRequestException('LMS connection has no database');
    }
    let scanned = 0;
    let softDeleted = 0;
    let errors = 0;
    const cursor = this.groupModel
      .find({
        isCourseGroup: true,
        courseId: { $exists: true, $ne: null },
        ...this.activeCommunityGroupFilter(),
      })
      .select({ _id: 1, courseId: 1, ownerId: 1 })
      .cursor();
    for await (const g of cursor) {
      scanned += 1;
      const cid = g.courseId != null ? String(g.courseId) : '';
      if (!Types.ObjectId.isValid(cid)) continue;
      const exists = await coursesCol.findOne(
        { _id: new Types.ObjectId(cid) },
        { projection: { _id: 1 } },
      );
      if (exists) continue;
      if (options?.dryRun) {
        softDeleted += 1;
        continue;
      }
      try {
        const r = await this.softDeleteCourseGroupForDeletedCourse({
          courseId: cid,
          ownerId: String(g.ownerId),
          communityGroupId: String(g._id),
        });
        if (r.ok) softDeleted += 1;
        else errors += 1;
      } catch {
        errors += 1;
      }
    }
    this.logger.log(
      `[COURSE_GROUP_DELETE] repairOrphanLmsMissing scanned=${scanned} softDeleted=${softDeleted} dryRun=${!!options?.dryRun} errors=${errors}`,
    );
    return { scanned, softDeleted, errors };
  }

  async getGroupByCourseId(courseId: string, viewerId?: string) {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Invalid courseId');
    }
    const group = await this.groupModel
      .findOne({
        isCourseGroup: true,
        ...this.activeCommunityGroupFilter(),
        ...this.courseGroupCourseIdFilter(courseId),
      })
      .populate('ownerId', USER_PUBLIC)
      .populate('instructorId', USER_PUBLIC)
      .lean();
    if (!group) throw new NotFoundException('Course community not found');
    const role = this.computeGroupRole(
      group as Parameters<SocialHubService['computeGroupRole']>[0],
      viewerId,
    );
    this.logger.log(
      `[COURSE_GROUP_QUERY] getGroupByCourseId courseId=${courseId} viewerId=${viewerId ?? 'none'} groupId=${String((group as { _id?: unknown })._id ?? '')} role=${role ?? 'null'}`,
    );
    return { group, role };
  }

  async getGroupById(groupId: string, viewerId?: string) {
    const group = await this.groupModel
      .findOne({
        _id: this.oid(groupId),
        ...this.activeCommunityGroupFilter(),
      })
      .populate('ownerId', USER_PUBLIC)
      .populate('instructorId', USER_PUBLIC)
      .lean();
    if (!group) throw new NotFoundException('Group not found');
    const role = this.computeGroupRole(
      group as Parameters<SocialHubService['computeGroupRole']>[0],
      viewerId,
    );
    return { group, role };
  }

  /**
   * Compute a viewer's effective role in a group. Returns `null` for
   * non-members of PRIVATE groups (callers translate that into 403).
   */
  private isUserBannedFromGroup(
    group: { bannedMembers?: Array<Types.ObjectId | string> },
    userId: string,
  ): boolean {
    return (group.bannedMembers ?? []).some((id) => String(id) === String(userId));
  }

  private isUserMutedInGroup(
    group: {
      mutedMembers?: Array<{ userId: Types.ObjectId | string; until?: Date | null }>;
    },
    userId: string,
  ): boolean {
    const now = Date.now();
    const entry = (group.mutedMembers ?? []).find(
      (m) => String(m.userId) === String(userId),
    );
    if (!entry) return false;
    if (!entry.until) return true;
    return new Date(entry.until).getTime() > now;
  }

  private isGroupChatLocked(group: {
    chatLockedUntil?: Date | null;
  }): boolean {
    if (!group.chatLockedUntil) return false;
    return new Date(group.chatLockedUntil).getTime() > Date.now();
  }

  async assertUserPlatformAccess(userId: string) {
    const now = new Date();
    const ban = await this.sanctionModel
      .findOne({
        userId: this.oid(userId),
        active: true,
        type: { $in: ['BAN', 'SUSPEND'] },
        $or: [{ until: null }, { until: { $gt: now } }],
      })
      .lean();
    if (ban) {
      throw new ForbiddenException('ACCOUNT_SUSPENDED');
    }
  }

  computeGroupRole(
    group: {
      ownerId?: Types.ObjectId | string;
      instructorId?: Types.ObjectId | string | null;
      admins?: Array<Types.ObjectId | string>;
      moderators?: Array<Types.ObjectId | string>;
      members?: Array<Types.ObjectId | string>;
      bannedMembers?: Array<Types.ObjectId | string>;
      visibility?: string;
    },
    viewerId: string | undefined,
  ): 'OWNER' | 'ADMIN' | 'MODERATOR' | 'INSTRUCTOR' | 'MEMBER' | 'GUEST' | null {
    if (!viewerId) return group.visibility === 'PUBLIC' ? 'GUEST' : null;
    const vid = String(viewerId);
    if (this.isUserBannedFromGroup(group, vid)) return null;
    if (String(group.ownerId) === vid) return 'OWNER';
    if (group.instructorId && String(group.instructorId) === vid) {
      return 'INSTRUCTOR';
    }
    if ((group.admins ?? []).some((id) => String(id) === vid)) return 'ADMIN';
    if ((group.moderators ?? []).some((id) => String(id) === vid)) {
      return 'MODERATOR';
    }
    if ((group.members ?? []).some((id) => String(id) === vid)) return 'MEMBER';
    return group.visibility === 'PUBLIC' ? 'GUEST' : null;
  }

  private assertGroupReadAccess(
    role: ReturnType<SocialHubService['computeGroupRole']>,
  ) {
    if (!role) {
      throw new BadRequestException('FORBIDDEN_GROUP');
    }
  }

  private assertGroupPostAccess(
    role: ReturnType<SocialHubService['computeGroupRole']>,
    requireInstructor = false,
  ) {
    if (!role || role === 'GUEST') {
      throw new BadRequestException('FORBIDDEN_GROUP');
    }
    if (
      requireInstructor &&
      role !== 'OWNER' &&
      role !== 'ADMIN' &&
      role !== 'INSTRUCTOR'
    ) {
      throw new BadRequestException('INSTRUCTOR_ONLY');
    }
  }

  // ─── Channels ──────────────────────────────────────────────────────────────

  private static readonly DEFAULT_CHANNELS: Array<{
    name: string;
    type: 'GENERAL' | 'QUESTIONS' | 'RESOURCES' | 'ANNOUNCEMENTS';
    isDefault?: boolean;
    isReadOnlyForMembers?: boolean;
  }> = [
    { name: 'general', type: 'GENERAL', isDefault: true },
    { name: 'questions', type: 'QUESTIONS' },
    { name: 'resources', type: 'RESOURCES' },
    {
      name: 'announcements',
      type: 'ANNOUNCEMENTS',
      isReadOnlyForMembers: true,
    },
  ];

  async ensureDefaultChannels(groupId: string, createdBy: string) {
    const gOid = this.oid(groupId);
    const uOid = this.oid(createdBy);
    const ops = SocialHubService.DEFAULT_CHANNELS.map((ch) =>
      this.channelModel.updateOne(
        { groupId: gOid, name: ch.name },
        {
          $setOnInsert: {
            groupId: gOid,
            name: ch.name,
            type: ch.type,
            isDefault: !!ch.isDefault,
            isReadOnlyForMembers: !!ch.isReadOnlyForMembers,
            createdBy: uOid,
          },
        },
        { upsert: true },
      ),
    );
    await Promise.all(ops);
  }

  async listGroupChannels(groupId: string, viewerId?: string) {
    const { role } = await this.getGroupById(groupId, viewerId);
    this.assertGroupReadAccess(role);
    return this.channelModel
      .find({ groupId: this.oid(groupId) })
      .sort({ isDefault: -1, createdAt: 1 })
      .lean();
  }

  async createGroupChannel(
    groupId: string,
    viewerId: string,
    dto: {
      name: string;
      type?: 'GENERAL' | 'QUESTIONS' | 'RESOURCES' | 'ANNOUNCEMENTS' | 'CUSTOM';
      isReadOnlyForMembers?: boolean;
    },
  ) {
    const { role } = await this.getGroupById(groupId, viewerId);
    this.assertGroupPostAccess(role, true);
    const normalized = dto.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 40);
    if (!normalized) throw new BadRequestException('Invalid channel name');
    const exists = await this.channelModel.findOne({
      groupId: this.oid(groupId),
      name: normalized,
    });
    if (exists) throw new ConflictException('Channel name already in use');
    const channel = await this.channelModel.create({
      groupId: this.oid(groupId),
      name: normalized,
      type: dto.type ?? 'CUSTOM',
      isReadOnlyForMembers: !!dto.isReadOnlyForMembers,
      createdBy: this.oid(viewerId),
    });
    return channel.toObject();
  }

  // ─── Group Posts ───────────────────────────────────────────────────────────

  async listGroupPosts(
    groupId: string,
    viewerId: string | undefined,
    options: {
      page?: number;
      limit?: number;
      channelId?: string;
      postType?:
        | 'DISCUSSION'
        | 'ANNOUNCEMENT'
        | 'QUESTION'
        | 'RESOURCE';
    } = {},
  ) {
    const { role, group } = await this.getGroupById(groupId, viewerId);
    this.assertGroupReadAccess(role);

    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {
      groupId: this.oid(groupId),
      isDeleted: { $ne: true },
    };
    if (options.channelId && Types.ObjectId.isValid(options.channelId)) {
      filter.channelId = new Types.ObjectId(options.channelId);
    }
    if (options.postType) filter.postType = options.postType;

    const [posts, total, pinned] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', USER_PUBLIC)
        .lean(),
      this.postModel.countDocuments(filter),
      this.postModel
        .find({ ...filter, isPinned: true })
        .limit(5)
        .populate('author', USER_PUBLIC)
        .lean(),
    ]);

    await this.hydratePostsMedia([...(posts as unknown[]), ...(pinned as unknown[])]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      pinned,
      group,
      role,
    };
  }

  async createGroupPost(
    groupId: string,
    authorId: string,
    dto: {
      content: string;
      channelId?: string | null;
      postType?:
        | 'DISCUSSION'
        | 'ANNOUNCEMENT'
        | 'QUESTION'
        | 'RESOURCE';
      images?: string[];
      hashtags?: string[];
      isPinned?: boolean;
    },
  ) {
    await this.assertUserPlatformAccess(authorId);
    const { role, group } = await this.getGroupById(groupId, authorId);
    this.assertGroupPostAccess(role, false);
    if (
      (group as { postingDisabled?: boolean }).postingDisabled &&
      !this.isGroupChatModerator(role)
    ) {
      throw new BadRequestException('POSTING_DISABLED');
    }
    if (this.isUserMutedInGroup(group as { mutedMembers?: Array<{ userId: Types.ObjectId; until?: Date | null }> }, authorId)) {
      throw new ForbiddenException('USER_MUTED');
    }

    const isAnnouncement = dto.postType === 'ANNOUNCEMENT';
    if (isAnnouncement) {
      this.assertGroupPostAccess(role, true);
    }

    let channelOid: Types.ObjectId | null = null;
    if (dto.channelId && Types.ObjectId.isValid(dto.channelId)) {
      const channel = await this.channelModel.findOne({
        _id: new Types.ObjectId(dto.channelId),
        groupId: this.oid(groupId),
      });
      if (!channel) throw new NotFoundException('Channel not found');
      if (
        channel.isReadOnlyForMembers &&
        role !== 'OWNER' &&
        role !== 'ADMIN' &&
        role !== 'INSTRUCTOR'
      ) {
        throw new BadRequestException('READ_ONLY_CHANNEL');
      }
      channelOid = channel._id as Types.ObjectId;
    }

    const safeContent = sanitizeText(dto.content, { maxLength: 5000 });
    if (!safeContent) {
      throw new BadRequestException('Post content cannot be empty');
    }

    await assertNotRapidPostDuplicate(this.postModel as Model<PostDocument>, {
      authorId,
      content: safeContent,
      incomingMediaFingerprint: fingerprintIncomingMedia({
        fileUrls: dto.images ?? [],
      }),
      contextKey: `${groupId}:${dto.channelId ?? ''}`,
    });

    const post = await this.postModel.create({
      author: this.oid(authorId),
      content: safeContent,
      hashtags: (dto.hashtags ?? []).slice(0, 40),
      visibility: 'PUBLIC',
      groupId: this.oid(groupId),
      channelId: channelOid,
      courseId: (group as { courseId?: Types.ObjectId }).courseId ?? null,
      postType: dto.postType ?? 'DISCUSSION',
      isPinned: isAnnouncement || !!dto.isPinned,
      images: dto.images?.length ? dto.images : null,
    });

    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      { $inc: { postsCount: 1 } },
    );

    let announcementDispatch: Awaited<
      ReturnType<NotificationDispatchService['dispatchFanOut']>
    > | null = null;
    if (isAnnouncement) {
      const courseId = (group as { courseId?: Types.ObjectId; isCourseGroup?: boolean })
        .courseId;
      const isCourseGroup = !!(group as { isCourseGroup?: boolean }).isCourseGroup;
      announcementDispatch = await this.notificationDispatch.dispatchFanOut({
        audience: isCourseGroup && courseId
          ? {
              kind: 'courseEnrolled',
              courseId: String(courseId),
              excludeUserIds: [authorId],
            }
          : {
              kind: 'groupMembers',
              groupId,
              excludeUserIds: [authorId],
            },
        template: {
          actorId: authorId,
          type: 'COURSE_ANNOUNCEMENT',
          entityType: 'POST',
          entityId: String(post._id),
          message: 'New course announcement',
          meta: {
            groupId,
            postId: String(post._id),
            courseId: courseId ? String(courseId) : null,
          },
        },
        dedupeEntityId: String(post._id),
      });
    }

    this.aiModeration.enqueue({
      targetType: 'POST',
      targetId: String(post._id),
      userId: authorId,
      text: safeContent,
    });

    return {
      post: post.toObject(),
      group,
      role,
      announcementDeliveries: announcementDispatch?.deliveries ?? [],
    };
  }

  /**
   * Group analytics for the instructor (active members, post counts,
   * questions count, engagement). Cheap aggregates over the existing data.
   */
  async getGroupAnalytics(groupId: string, viewerId: string) {
    const { role } = await this.getGroupById(groupId, viewerId);
    this.assertGroupPostAccess(role, true);

    const gOid = this.oid(groupId);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [postsTotal, postsByType, activeAuthors] = await Promise.all([
      this.postModel.countDocuments({ groupId: gOid }),
      this.postModel.aggregate([
        { $match: { groupId: gOid } },
        { $group: { _id: '$postType', count: { $sum: 1 } } },
      ]),
      this.postModel.aggregate([
        { $match: { groupId: gOid, createdAt: { $gte: since } } },
        {
          $group: {
            _id: '$author',
            count: { $sum: 1 },
            likes: { $sum: '$likesCount' },
            comments: { $sum: '$commentsCount' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      postsTotal,
      postsByType,
      topActiveMembers: activeAuthors,
      since,
    };
  }

  /** Course-scoped community analytics for instructors (group posts + chat). */
  async getCourseCommunityAnalytics(courseId: string, viewerId: string) {
    const courseOid = this.oid(courseId);
    const group = await this.groupModel
      .findOne({
        courseId: courseOid,
        isCourseGroup: true,
        isDeleted: { $ne: true },
      })
      .lean();
    if (!group) {
      return {
        hasGroup: false,
        groupId: null,
        postsTotal: 0,
        messagesTotal: 0,
        messagesLast30d: 0,
        commentsTotal: 0,
        postsByType: [],
        topActiveMembers: [],
      };
    }

    const groupDoc = group as { _id: Types.ObjectId };
    const groupId = String(groupDoc._id);
    const { role } = await this.getGroupById(groupId, viewerId);
    this.assertGroupPostAccess(role, true);

    const gOid = groupDoc._id;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [groupStats, messagesTotal, messagesLast30d, commentsAgg] =
      await Promise.all([
        this.getGroupAnalytics(groupId, viewerId),
        this.groupMessageModel.countDocuments({
          groupId: gOid,
          deletedAt: null,
        }),
        this.groupMessageModel.countDocuments({
          groupId: gOid,
          deletedAt: null,
          createdAt: { $gte: since },
        }),
        this.postModel.aggregate([
          { $match: { groupId: gOid } },
          { $group: { _id: null, total: { $sum: '$commentsCount' } } },
        ]),
      ]);

    return {
      hasGroup: true,
      groupId,
      messagesTotal,
      messagesLast30d,
      commentsTotal: commentsAgg[0]?.total ?? 0,
      ...groupStats,
    };
  }

  // ─── AI usage / subscription ───────────────────────────────────────────────

  async getOrCreateAiSubscription(userId: string) {
    const uid = this.oid(userId);
    // Atomic upsert avoids E11000 when concurrent requests both pass findOne+create.
    const sub = await this.aiSubModel.findOneAndUpdate(
      { userId: uid },
      { $setOnInsert: { userId: uid, plan: 'FREE' } },
      { new: true, upsert: true },
    );
    if (!sub) {
      const fallback = await this.aiSubModel.findOne({ userId: uid }).lean();
      if (fallback) return fallback as Record<string, unknown>;
      throw new NotFoundException('AI subscription');
    }
    return sub.toObject();
  }

  /**
   * Monthly credit pool model.
   *
   * | Plan | Allowance / month |
   * |------|--------------------|
   * | FREE | 300 credits        |
   * | PRO  | 5,000 credits      |
   *
   * Per-feature cost lives in `AI_FEATURE_COST` and is the authoritative
   * value the client mirrors in `apps/client/src/lib/ai/credits.ts`.
   */
  private static readonly AI_FEATURE_COST: Record<string, number> = {
    PDF_SUMMARY: 5,
    PDF_CHAT: 2,
    QUIZ_GENERATION: 10,
    ARTICLE_GENERATION: 15,
    MINDMAP_GENERATION: 20,
  };

  private static readonly AI_MONTHLY_ALLOWANCE: Record<string, number> = {
    FREE: 300,
    PRO: 5000,
  };

  private getFeatureCost(feature: string): number {
    return SocialHubService.AI_FEATURE_COST[feature] ?? 1;
  }

  private getMonthlyAllowance(plan: string): number {
    return (
      SocialHubService.AI_MONTHLY_ALLOWANCE[plan] ??
      SocialHubService.AI_MONTHLY_ALLOWANCE.FREE
    );
  }

  private async sumMonthlyCredits(userId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await this.aiUsageModel.aggregate([
      {
        $match: {
          userId: this.oid(userId),
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$creditsUsed', 1] } },
        },
      },
    ]);
    return result[0]?.total ?? 0;
  }

  async canUseAiFeature(userId: string, feature: string) {
    const sub = await this.getOrCreateAiSubscription(userId);
    const cost = this.getFeatureCost(feature);
    const allowance = this.getMonthlyAllowance(sub.plan);
    const used = await this.sumMonthlyCredits(userId);
    const remaining = Math.max(0, allowance - used);

    if (sub.plan === 'PRO' && used + cost <= allowance) {
      return {
        allowed: true,
        plan: 'PRO',
        cost,
        used,
        remaining,
        limit: allowance,
      };
    }

    if (used + cost > allowance) {
      return {
        allowed: false,
        plan: sub.plan,
        reason: 'CREDITS_EXHAUSTED',
        cost,
        used,
        remaining,
        limit: allowance,
      };
    }

    return {
      allowed: true,
      plan: sub.plan,
      cost,
      used,
      remaining,
      limit: allowance,
    };
  }

  async consumeAiCredits(
    userId: string,
    feature: string,
    creditsUsed?: number,
    meta?: Record<string, unknown>,
  ) {
    const cost = creditsUsed ?? this.getFeatureCost(feature);
    const gate = await this.canUseAiFeature(userId, feature);
    if (!gate.allowed) {
      throw new ConflictException(gate.reason || 'USAGE_LIMIT');
    }
    const sub = await this.getOrCreateAiSubscription(userId);

    await this.aiUsageModel.create({
      userId: this.oid(userId),
      feature,
      creditsUsed: cost,
      meta: meta || {},
    });

    const used = await this.sumMonthlyCredits(userId);
    const allowance = this.getMonthlyAllowance(sub.plan);
    return {
      ok: true,
      plan: sub.plan,
      cost,
      used,
      remaining: Math.max(0, allowance - used),
      limit: allowance,
    };
  }

  async getAiUsageStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sub = await this.getOrCreateAiSubscription(userId);

    const [byFeature, totalAgg] = await Promise.all([
      this.aiUsageModel.aggregate([
        {
          $match: {
            userId: this.oid(userId),
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: '$feature',
            count: { $sum: 1 },
            credits: { $sum: { $ifNull: ['$creditsUsed', 1] } },
          },
        },
      ]),
      this.aiUsageModel.aggregate([
        {
          $match: {
            userId: this.oid(userId),
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$creditsUsed', 1] } },
          },
        },
      ]),
    ]);

    const used = totalAgg[0]?.total ?? 0;
    const allowance = this.getMonthlyAllowance(sub.plan);

    return {
      plan: sub.plan,
      used,
      remaining: Math.max(0, allowance - used),
      limit: allowance,
      today: byFeature,
    };
  }

  /** Prioritized feed: own posts, followed authors, then public/trending.
   *  Posts with `groupId` set (course communities & private groups) are never
   *  included — those timelines are scoped to `listGroupPosts` / group APIs.
   */
  async getCommunityFeed(viewerId: string | undefined, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    if (!viewerId || !Types.ObjectId.isValid(viewerId)) {
      const publicFilter = {
        $and: [
          {
            $or: [
              { visibility: { $exists: false } },
              { visibility: 'PUBLIC' },
            ],
          },
          {
            $or: [
              { groupId: { $exists: false } },
              { groupId: null },
            ],
          },
          {
            $or: [
              { isDeleted: { $exists: false } },
              { isDeleted: false },
            ],
          },
          {
            $or: [
              { isShadowBlocked: { $exists: false } },
              { isShadowBlocked: false },
            ],
          },
        ],
      };
      const [posts, total] = await Promise.all([
        this.postModel
          .find(publicFilter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('author', USER_PUBLIC)
          .populate('sharedPost', 'content author image images')
          .populate('sharedPost.author', USER_PUBLIC)
          .lean(),
        this.postModel.countDocuments(publicFilter),
      ]);
      await this.hydratePostsMedia(posts as unknown[]);
      return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const viewerOid = this.oid(viewerId);
    const follows = await this.followModel
      .find({ followerId: viewerOid })
      .select('followingId')
      .lean();
    const followingIds = follows
      .map((f) => (f as { followingId?: Types.ObjectId }).followingId)
      .filter(Boolean) as Types.ObjectId[];

    const filter = {
      $and: [
        {
          $or: [
            { author: viewerOid },
            { visibility: { $ne: 'FOLLOWERS' } },
            {
              $and: [
                { visibility: 'FOLLOWERS' },
                { author: { $in: followingIds } },
              ],
            },
          ],
        },
        {
          $or: [
            { groupId: { $exists: false } },
            { groupId: null },
          ],
        },
        {
          $or: [
            { isDeleted: { $exists: false } },
            { isDeleted: false },
          ],
        },
        {
          // Shadow-blocked posts stay visible only to their author.
          $or: [
            { isShadowBlocked: { $exists: false } },
            { isShadowBlocked: false },
            { author: viewerOid },
          ],
        },
      ],
    };

    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', USER_PUBLIC)
        .populate('sharedPost', 'content author image images')
        .populate('sharedPost.author', USER_PUBLIC)
        .lean(),
      this.postModel.countDocuments(filter),
    ]);
    await this.hydratePostsMedia(posts as unknown[]);
    return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Moderation ──────────────────────────────────────────────────────────

  private async assertCanModerate(groupId: string, actorId: string) {
    const { group, role } = await this.getGroupById(groupId, actorId);
    if (
      role !== 'OWNER' &&
      role !== 'ADMIN' &&
      role !== 'MODERATOR' &&
      role !== 'INSTRUCTOR'
    ) {
      throw new BadRequestException('FORBIDDEN_MODERATION');
    }
    return { group, role };
  }

  private async writeModerationLog(input: {
    groupId: string;
    actorId: string;
    action: string;
    targetUserId?: string;
    targetPostId?: string;
    targetChannelId?: string;
    reason?: string;
    meta?: Record<string, unknown>;
  }) {
    await this.modLogModel.create({
      groupId: this.oid(input.groupId),
      actorId: this.oid(input.actorId),
      action: input.action,
      targetUserId: input.targetUserId ? this.oid(input.targetUserId) : null,
      targetPostId: input.targetPostId ? this.oid(input.targetPostId) : null,
      targetChannelId: input.targetChannelId
        ? this.oid(input.targetChannelId)
        : null,
      reason: input.reason ?? null,
      meta: input.meta ?? null,
    });
  }

  async muteMember(
    groupId: string,
    actorId: string,
    targetUserId: string,
    minutes?: number,
    reason?: string,
  ) {
    const { group, role } = await this.assertCanModerate(groupId, actorId);
    if (String((group as { ownerId?: unknown }).ownerId) === String(targetUserId)) {
      throw new BadRequestException('CANNOT_MUTE_OWNER');
    }
    if (role !== 'OWNER' && role !== 'ADMIN' && role !== 'INSTRUCTOR') {
      // Moderators can mute members but not other moderators/admins.
      const targetRole = this.computeGroupRole(
        group as Parameters<SocialHubService['computeGroupRole']>[0],
        targetUserId,
      );
      if (
        targetRole === 'OWNER' ||
        targetRole === 'ADMIN' ||
        targetRole === 'MODERATOR' ||
        targetRole === 'INSTRUCTOR'
      ) {
        throw new BadRequestException('CANNOT_MUTE_PEER');
      }
    }
    const uid = this.oid(targetUserId);
    const until =
      typeof minutes === 'number' && minutes > 0
        ? new Date(Date.now() + minutes * 60 * 1000)
        : null;
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      {
        $pull: { mutedMembers: { userId: uid } },
      },
    );
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      { $push: { mutedMembers: { userId: uid, until } } },
    );
    await this.writeModerationLog({
      groupId,
      actorId,
      action: 'MUTE_MEMBER',
      targetUserId,
      reason,
      meta: { until },
    });
    return { ok: true, until };
  }

  async unmuteMember(groupId: string, actorId: string, targetUserId: string) {
    await this.assertCanModerate(groupId, actorId);
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      { $pull: { mutedMembers: { userId: this.oid(targetUserId) } } },
    );
    await this.writeModerationLog({
      groupId,
      actorId,
      action: 'UNMUTE_MEMBER',
      targetUserId,
    });
    return { ok: true };
  }

  async removeMember(
    groupId: string,
    actorId: string,
    targetUserId: string,
    reason?: string,
  ) {
    const { group } = await this.assertCanModerate(groupId, actorId);
    if (String((group as { ownerId?: unknown }).ownerId) === String(targetUserId)) {
      throw new BadRequestException('CANNOT_REMOVE_OWNER');
    }
    const uid = this.oid(targetUserId);
    const res = await this.groupModel.updateOne(
      { _id: this.oid(groupId), members: uid },
      {
        $pull: { members: uid, admins: uid, moderators: uid },
        $inc: { membersCount: -1 },
      },
    );
    await this.writeModerationLog({
      groupId,
      actorId,
      action: 'REMOVE_MEMBER',
      targetUserId,
      reason,
    });
    return { ok: true, removed: !!res.modifiedCount };
  }

  async banMember(
    groupId: string,
    actorId: string,
    targetUserId: string,
    reason?: string,
  ) {
    const { group } = await this.assertCanModerate(groupId, actorId);
    if (String((group as { ownerId?: unknown }).ownerId) === String(targetUserId)) {
      throw new BadRequestException('CANNOT_BAN_OWNER');
    }
    const uid = this.oid(targetUserId);
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      {
        $pull: { members: uid, admins: uid, moderators: uid },
        $addToSet: { bannedMembers: uid },
      },
    );
    await this.groupModel.updateOne(
      { _id: this.oid(groupId), bannedMembers: uid },
      { $inc: { membersCount: -1 } },
    );
    await this.writeModerationLog({
      groupId,
      actorId,
      action: 'BAN_MEMBER',
      targetUserId,
      reason,
    });
    return { ok: true };
  }

  async unbanMember(groupId: string, actorId: string, targetUserId: string) {
    await this.assertCanModerate(groupId, actorId);
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      { $pull: { bannedMembers: this.oid(targetUserId) } },
    );
    await this.writeModerationLog({
      groupId,
      actorId,
      action: 'UNBAN_MEMBER',
      targetUserId,
    });
    return { ok: true };
  }

  async setPostPinned(
    groupId: string,
    actorId: string,
    postId: string,
    pinned: boolean,
  ) {
    await this.assertCanModerate(groupId, actorId);
    const post = await this.postModel.findOneAndUpdate(
      { _id: this.oid(postId), groupId: this.oid(groupId) },
      { $set: { isPinned: pinned } },
      { new: true },
    );
    if (!post) throw new NotFoundException('Post not found');
    await this.writeModerationLog({
      groupId,
      actorId,
      action: pinned ? 'PIN_POST' : 'UNPIN_POST',
      targetPostId: postId,
    });
    return { ok: true, isPinned: pinned };
  }

  async deleteGroupPost(
    groupId: string,
    actorId: string,
    postId: string,
    reason?: string,
  ) {
    await this.assertCanModerate(groupId, actorId);
    const post = await this.postModel.findOneAndUpdate(
      { _id: this.oid(postId), groupId: this.oid(groupId) },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: this.oid(actorId),
          content: '[deleted]',
        },
      },
      { new: true },
    );
    if (!post) throw new NotFoundException('Post not found');
    await this.groupModel.updateOne(
      { _id: this.oid(groupId), postsCount: { $gt: 0 } },
      { $inc: { postsCount: -1 } },
    );
    await this.writeModerationLog({
      groupId,
      actorId,
      action: 'DELETE_POST',
      targetPostId: postId,
      reason,
    });
    return { ok: true };
  }

  async listModerationLogs(
    groupId: string,
    viewerId: string,
    page = 1,
    limit = 20,
  ) {
    await this.assertCanModerate(groupId, viewerId);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.modLogModel
        .find({ groupId: this.oid(groupId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name profilePictureUrl username')
        .populate('targetUserId', 'name profilePictureUrl username')
        .lean(),
      this.modLogModel.countDocuments({ groupId: this.oid(groupId) }),
    ]);
    return { items, total, page, limit };
  }

  async lockGroupChat(
    groupId: string,
    actorId: string,
    minutes?: number,
    reason?: string,
  ) {
    await this.assertCanModerate(groupId, actorId);
    const until =
      typeof minutes === 'number' && minutes > 0
        ? new Date(Date.now() + minutes * 60 * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      { $set: { chatLockedUntil: until } },
    );
    await this.writeModerationLog({
      groupId,
      actorId,
      action: 'LOCK_CHANNEL',
      reason,
      meta: { until },
    });
    return { ok: true, chatLockedUntil: until };
  }

  async unlockGroupChat(groupId: string, actorId: string) {
    await this.assertCanModerate(groupId, actorId);
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      { $set: { chatLockedUntil: null } },
    );
    await this.writeModerationLog({
      groupId,
      actorId,
      action: 'UNLOCK_CHANNEL',
    });
    return { ok: true };
  }

  async setGroupPostingDisabled(
    groupId: string,
    actorId: string,
    disabled: boolean,
    reason?: string,
  ) {
    await this.assertCanModerate(groupId, actorId);
    await this.groupModel.updateOne(
      { _id: this.oid(groupId) },
      { $set: { postingDisabled: disabled } },
    );
    await this.writeModerationLog({
      groupId,
      actorId,
      action: disabled ? 'SLOW_MODE' : 'UNLOCK_CHANNEL',
      reason,
      meta: { postingDisabled: disabled },
    });
    return { ok: true, postingDisabled: disabled };
  }

  // ─── Search ─────────────────────────────────────────────────────────────

  /**
   * Global community search. Honours visibility rules:
   *  - users: returns any active user (public)
   *  - posts: PUBLIC posts only, never group posts, never deleted
   *  - groups: PUBLIC non-course groups for guests; authenticated viewers also
   *    see PRIVATE course communities they belong to (same rules as listGroups)
   *  - hashtags: derived from PUBLIC posts
   */
  async search(
    viewerId: string | undefined,
    query: string,
    type: 'all' | 'users' | 'posts' | 'groups' | 'hashtags' = 'all',
    limit = 10,
  ) {
    const q = String(query ?? '').trim();
    if (!q) {
      return {
        users: [],
        posts: [],
        groups: [],
        hashtags: [],
        query: '',
      };
    }
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escaped, 'i');
    const hashtagToken = q.replace(/^#/, '').toLowerCase();
    const safeLimit = Math.min(Math.max(limit, 1), 25);

    const wantsAll = type === 'all';

    const userPromise =
      wantsAll || type === 'users'
        ? this.userModel
            .find({
              $or: [
                { username: rx },
                { name: rx },
                { headline: rx },
              ],
            })
            .select(USER_PUBLIC)
            .limit(safeLimit)
            .lean()
        : Promise.resolve([]);

    const postFilter = {
      $and: [
        { visibility: 'PUBLIC' },
        {
          $or: [
            { groupId: { $exists: false } },
            { groupId: null },
          ],
        },
        {
          $or: [
            { isDeleted: { $exists: false } },
            { isDeleted: false },
          ],
        },
        {
          $or: [
            { content: rx },
            { hashtags: hashtagToken },
            { tags: rx },
          ],
        },
      ],
    };

    const postPromise =
      wantsAll || type === 'posts'
        ? this.postModel
            .find(postFilter)
            .sort({ createdAt: -1 })
            .limit(safeLimit)
            .populate('author', USER_PUBLIC)
            .lean()
        : Promise.resolve([]);

    const uid =
      viewerId && Types.ObjectId.isValid(viewerId)
        ? this.oid(viewerId)
        : null;

    const groupPromise =
      wantsAll || type === 'groups'
        ? this.groupModel
            .find(
              uid
                ? {
                    $and: [
                      { ...this.activeCommunityGroupFilter() },
                      { $or: [{ name: rx }, { description: rx }] },
                      {
                        $or: [
                          { visibility: 'PUBLIC', isCourseGroup: { $ne: true } },
                          {
                            isCourseGroup: true,
                            $or: [
                              { members: uid },
                              { ownerId: uid },
                              { instructorId: uid },
                              { admins: uid },
                            ],
                          },
                        ],
                      },
                    ],
                  }
                : {
                    visibility: 'PUBLIC',
                    isCourseGroup: { $ne: true },
                    ...this.activeCommunityGroupFilter(),
                    $or: [{ name: rx }, { description: rx }],
                  },
            )
            .limit(safeLimit)
            .lean()
        : Promise.resolve([]);

    const hashtagPromise =
      wantsAll || type === 'hashtags'
        ? this.postModel
            .aggregate([
              {
                $match: {
                  visibility: 'PUBLIC',
                  groupId: { $in: [null, undefined] },
                  isDeleted: { $ne: true },
                  hashtags: { $regex: hashtagToken, $options: 'i' },
                },
              },
              { $unwind: '$hashtags' },
              {
                $match: {
                  hashtags: { $regex: hashtagToken, $options: 'i' },
                },
              },
              { $group: { _id: '$hashtags', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: safeLimit },
            ])
            .exec()
        : Promise.resolve([]);

    const [users, posts, groups, hashtagsRaw] = await Promise.all([
      userPromise,
      postPromise,
      groupPromise,
      hashtagPromise,
    ]);

    const hashtags = (hashtagsRaw as Array<{ _id: string; count: number }>).map(
      (r) => ({ tag: r._id, count: r.count }),
    );

    return {
      users,
      posts,
      groups,
      hashtags,
      query: q,
      viewerId: viewerId ?? null,
    };
  }

  // ─── Admin / Platform analytics ─────────────────────────────────────────

  /**
   * Aggregate counters + time-series for the platform admin dashboard. Uses
   * the existing Mongo collections (no precomputed buckets) so it's
   * relatively expensive — meant to be cached at the gateway when wired up
   * to Redis. Numbers are best-effort, not realtime.
   */
  async getPlatformAnalytics() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalPosts,
      totalGroups,
      totalMessages,
      totalFollows,
      dau,
      wau,
      mau,
      postsToday,
      postsLast7,
      messagesLast7,
      followsLast7,
      topGroups,
      topAuthors,
      modByAction,
    ] = await Promise.all([
      this.userModel.estimatedDocumentCount(),
      this.postModel.estimatedDocumentCount(),
      this.groupModel.estimatedDocumentCount(),
      this.messageModel.estimatedDocumentCount(),
      this.followModel.estimatedDocumentCount(),
      this.postModel.distinct('author', { createdAt: { $gte: dayAgo } }),
      this.postModel.distinct('author', { createdAt: { $gte: weekAgo } }),
      this.postModel.distinct('author', { createdAt: { $gte: monthAgo } }),
      this.postModel.countDocuments({ createdAt: { $gte: startOfDay } }),
      this.postModel.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.messageModel.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.followModel.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.groupModel
        .find({ ...this.activeCommunityGroupFilter() })
        .sort({ membersCount: -1 })
        .limit(8)
        .select('name visibility membersCount postsCount isCourseGroup')
        .lean(),
      this.postModel.aggregate([
        { $match: { createdAt: { $gte: monthAgo } } },
        { $group: { _id: '$author', posts: { $sum: 1 } } },
        { $sort: { posts: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            posts: 1,
            user: {
              _id: '$user._id',
              name: '$user.name',
              username: '$user.username',
              profilePictureUrl: '$user.profilePictureUrl',
            },
          },
        },
      ]),
      this.connection
        .model('CommunityModerationResult')
        .aggregate([
          { $group: { _id: '$action', count: { $sum: 1 } } },
        ]),
    ]);

    return {
      generatedAt: now.toISOString(),
      totals: {
        users: totalUsers,
        posts: totalPosts,
        groups: totalGroups,
        messages: totalMessages,
        follows: totalFollows,
      },
      activity: {
        dau: dau.length,
        wau: wau.length,
        mau: mau.length,
        postsToday,
      },
      series: {
        postsLast7,
        messagesLast7,
        followsLast7,
      },
      topGroups,
      topAuthors,
      moderation: { byAction: modByAction },
    };
  }

  /**
   * Merge duplicate course-linked groups (same courseId). Keeps oldest row,
   * moves posts/channels, unions membership, deletes extras.
   */
  async repairDuplicateCourseLinkedGroups(options?: {
    dryRun?: boolean;
  }): Promise<{ duplicateCourseIds: number; groupsRemoved: number }> {
    const dry = !!options?.dryRun;
    const dupBuckets = await this.groupModel.aggregate([
      {
        $match: {
          isCourseGroup: true,
          courseId: { $exists: true, $ne: null },
          ...this.activeCommunityGroupFilter(),
        },
      },
      {
        $group: {
          _id: '$courseId',
          n: { $sum: 1 },
        },
      },
      { $match: { n: { $gt: 1 } } },
    ]);
    let duplicateCourseIds = 0;
    let groupsRemoved = 0;
    for (const b of dupBuckets) {
      const cid = String(b._id);
      if (!Types.ObjectId.isValid(cid)) continue;
      const glist = await this.groupModel
        .find({
          isCourseGroup: true,
          ...this.activeCommunityGroupFilter(),
          ...this.courseGroupCourseIdFilter(cid),
        })
        .sort({ createdAt: 1 })
        .lean();
      if (glist.length < 2) continue;
      duplicateCourseIds += 1;
      const keeper = glist[0] as {
        _id: Types.ObjectId;
        members?: Types.ObjectId[];
        admins?: Types.ObjectId[];
        moderators?: Types.ObjectId[];
        bannedMembers?: Types.ObjectId[];
      };
      const losers = glist.slice(1) as typeof glist;
      this.logger.log(
        `[DUPLICATE_GROUP_REPAIR] courseId=${cid} keeper=${String(keeper._id)} duplicates=${losers.length} dryRun=${dry}`,
      );
      if (dry) continue;
      for (const L of losers) {
        const doc = L as {
          _id: Types.ObjectId;
          members?: Types.ObjectId[];
          admins?: Types.ObjectId[];
          moderators?: Types.ObjectId[];
          bannedMembers?: Types.ObjectId[];
        };
        const m = doc.members ?? [];
        const a = doc.admins ?? [];
        const mod = doc.moderators ?? [];
        const ban = doc.bannedMembers ?? [];
        if (m.length || a.length || mod.length || ban.length) {
          await this.groupModel.updateOne(
            { _id: keeper._id },
            {
              $addToSet: {
                members: { $each: m },
                admins: { $each: a },
                moderators: { $each: mod },
                bannedMembers: { $each: ban },
              },
            },
          );
        }
        await this.postModel.updateMany(
          { groupId: doc._id },
          { $set: { groupId: keeper._id } },
        );
        await this.channelModel.updateMany(
          { groupId: doc._id },
          { $set: { groupId: keeper._id } },
        );
        await this.groupModel.deleteOne({ _id: doc._id });
        groupsRemoved += 1;
      }
      const k = await this.groupModel.findById(keeper._id).lean();
      const members = (k as unknown as { members?: unknown[] })?.members;
      const mc = Array.isArray(members) ? members.length : 0;
      await this.groupModel.updateOne(
        { _id: keeper._id },
        { $set: { membersCount: mc } },
      );
    }
    return { duplicateCourseIds, groupsRemoved };
  }
}
