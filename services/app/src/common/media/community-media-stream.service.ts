import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommunityS3Service } from '../aws/community-s3.service';
import { User } from '../../auth/schema/user.schema';
import { PostDocument } from '../../Community/posts/schemas/posts/post.schema';

export type CommunityStreamMetaResult =
  | {
      error: null;
      objectKey: string;
      contentType: string;
      bucket: 'community' | 'app-auth';
    }
  | { error: 'not_found' | 'forbidden' | 'no_media'; message?: string };

@Injectable()
export class CommunityMediaStreamService {
  constructor(
    private readonly communityS3: CommunityS3Service,
    @InjectModel('Post') private readonly postModel: Model<PostDocument>,
    @InjectModel(User.name) private readonly userModel: Model<Record<string, unknown>>,
    @InjectModel('Article') private readonly articleModel: Model<Record<string, unknown>>,
    @InjectModel('DirectMessage') private readonly messageModel: Model<Record<string, unknown>>,
    @InjectModel('DirectConversation')
    private readonly conversationModel: Model<Record<string, unknown>>,
    @InjectModel('GroupMessage')
    private readonly groupMessageModel: Model<Record<string, unknown>>,
    @InjectModel('CommunityGroup')
    private readonly groupModel: Model<Record<string, unknown>>,
  ) {}

  private resolveKey(urlOrKey: string): string | null {
    const key = urlOrKey.startsWith('http')
      ? this.communityS3.extractKeyFromUrl(urlOrKey)
      : urlOrKey.trim();
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

  private guessContentType(key: string, fallback: string): string {
    const lower = key.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.m4a')) return 'audio/mp4';
    if (lower.endsWith('.ogg')) return 'audio/ogg';
    return fallback;
  }

  async getUserAvatarStreamMeta(
    userId: string,
    requesterId: string,
  ): Promise<CommunityStreamMetaResult> {
    if (!Types.ObjectId.isValid(userId)) {
      return { error: 'not_found', message: 'User not found' };
    }
    const user = await this.userModel.findById(userId).lean();
    if (!user) return { error: 'not_found', message: 'User not found' };
    const pic = (user as { profilePictureUrl?: string }).profilePictureUrl;
    if (!pic || typeof pic !== 'string') {
      return { error: 'no_media', message: 'No avatar' };
    }

    const trimmed = pic.trim();

    if (/^https?:\/\//i.test(trimmed) && this.isAuthBucketAvatarUrl(trimmed)) {
      const key = this.extractAuthAvatarKey(trimmed);
      if (!key?.startsWith('avatars/')) {
        return { error: 'no_media', message: 'Invalid auth avatar key' };
      }
      return {
        error: null,
        objectKey: key,
        contentType: this.guessContentType(key, 'image/jpeg'),
        bucket: 'app-auth',
      };
    }

    // Signup / auth-service uploads use the same key prefix but live in the auth bucket.
    if (trimmed.startsWith('avatars/') && !trimmed.startsWith('http')) {
      return {
        error: null,
        objectKey: trimmed,
        contentType: this.guessContentType(trimmed, 'image/jpeg'),
        bucket: 'app-auth',
      };
    }

    const key = this.resolveKey(trimmed);
    if (!key) return { error: 'no_media', message: 'Invalid avatar key' };
    return {
      error: null,
      objectKey: key,
      contentType: this.guessContentType(key, 'image/jpeg'),
      bucket: 'community',
    };
  }

  private isAuthBucketAvatarUrl(ref: string): boolean {
    const s = ref.trim();
    if (!s.startsWith('http')) return false;
    try {
      const h = new URL(s).hostname.toLowerCase();
      return h.includes('vonova-auth') || h.includes('auth.');
    } catch {
      return false;
    }
  }

  private extractAuthAvatarKey(url: string): string | null {
    try {
      const u = new URL(url);
      let key = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
      return key || null;
    } catch {
      return null;
    }
  }

  async getUserCoverStreamMeta(
    userId: string,
  ): Promise<CommunityStreamMetaResult> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) return { error: 'not_found', message: 'User not found' };
    const cover = (user as { coverImageUrl?: string }).coverImageUrl;
    if (!cover || typeof cover !== 'string') {
      return { error: 'no_media', message: 'No cover' };
    }
    const key = this.resolveKey(cover);
    if (!key) return { error: 'no_media', message: 'Invalid cover key' };
    return {
      error: null,
      objectKey: key,
      contentType: this.guessContentType(key, 'image/jpeg'),
      bucket: 'community',
    };
  }

  async getPostImageStreamMeta(
    postId: string,
    index: number,
    requesterId: string,
  ): Promise<CommunityStreamMetaResult> {
    const post = await this.postModel.findById(postId).lean();
    if (!post) return { error: 'not_found', message: 'Post not found' };

    const imageKeys = (post as { imageKeys?: string[] | null }).imageKeys;
    if (Array.isArray(imageKeys) && imageKeys[index]) {
      const keyFromKeys = this.resolveKey(imageKeys[index]);
      if (keyFromKeys) {
        return {
          error: null,
          objectKey: keyFromKeys,
          contentType: this.guessContentType(keyFromKeys, 'image/jpeg'),
          bucket: 'community',
        };
      }
    }

    const urls: string[] = [];
    if (typeof (post as { image?: string }).image === 'string') {
      urls.push((post as { image: string }).image);
    }
    const imgs = (post as { images?: string[] }).images;
    if (Array.isArray(imgs)) {
      for (const u of imgs) {
        if (typeof u === 'string' && u && !u.startsWith('/api/v1/media/')) {
          urls.push(u);
        }
      }
    }
    const unique = Array.from(new Set(urls));
    const raw = unique[index];
    if (!raw) return { error: 'not_found', message: 'Image index out of range' };
    const key = this.resolveKey(raw);
    if (!key) return { error: 'no_media', message: 'Invalid media key' };
    return {
      error: null,
      objectKey: key,
      contentType: this.guessContentType(key, 'image/jpeg'),
      bucket: 'community',
    };
  }

  async getArticleBlockImageStreamMeta(
    articleId: string,
    blockIndex: number,
  ): Promise<CommunityStreamMetaResult> {
    const article = await this.articleModel.findById(articleId).lean();
    if (!article) return { error: 'not_found', message: 'Article not found' };
    const blocks = (article as { contentBlocks?: unknown[] }).contentBlocks;
    if (!Array.isArray(blocks) || blockIndex < 0 || blockIndex >= blocks.length) {
      return { error: 'not_found', message: 'Block index out of range' };
    }
    const block = blocks[blockIndex] as Record<string, unknown>;
    const raw =
      (typeof block.imageKey === 'string' && block.imageKey.trim()) ||
      (typeof block.url === 'string' && block.url) ||
      null;
    if (!raw) return { error: 'no_media', message: 'No block image' };
    const key = this.resolveKey(raw);
    if (!key) return { error: 'no_media', message: 'Invalid block image key' };
    return {
      error: null,
      objectKey: key,
      contentType: this.guessContentType(key, 'image/jpeg'),
      bucket: 'community',
    };
  }

  async getArticleCoverStreamMeta(
    articleId: string,
  ): Promise<CommunityStreamMetaResult> {
    const article = await this.articleModel.findById(articleId).lean();
    if (!article) return { error: 'not_found', message: 'Article not found' };
    const coverKey = (article as { coverImageKey?: string }).coverImageKey;
    const cover = (article as { coverImage?: string }).coverImage;
    const raw =
      typeof coverKey === 'string' && coverKey.trim()
        ? coverKey.trim()
        : typeof cover === 'string'
          ? cover
          : null;
    if (!raw) return { error: 'no_media', message: 'No cover' };
    const key = this.resolveKey(raw);
    if (!key) return { error: 'no_media', message: 'Invalid cover key' };
    return {
      error: null,
      objectKey: key,
      contentType: this.guessContentType(key, 'image/jpeg'),
      bucket: 'community',
    };
  }

  async getDmAttachmentStreamMeta(
    conversationId: string,
    messageId: string,
    index: number,
    requesterId: string,
  ): Promise<CommunityStreamMetaResult> {
    const conv = await this.conversationModel
      .findById(conversationId)
      .lean();
    if (!conv) return { error: 'not_found', message: 'Conversation not found' };
    const msg = await this.messageModel
      .findOne({ _id: messageId, conversationId })
      .lean();
    if (!msg) return { error: 'not_found', message: 'Message not found' };
    const parts = (conv as { participants?: unknown[] }).participants ?? [];
    const allowed = parts.some((p) => String(p) === String(requesterId));
    if (!allowed) {
      return { error: 'forbidden', message: 'Not a participant' };
    }
    const meta = (msg as { attachmentsMeta?: Array<{ url?: string; key?: string; mimeType?: string }> })
      .attachmentsMeta;
    const row = meta?.[index];
    if (!row) return { error: 'not_found', message: 'Attachment not found' };
    const raw =
      (typeof row.url === 'string' && row.url) ||
      (typeof row.key === 'string' && row.key) ||
      '';
    const key = this.resolveKey(raw);
    if (!key) return { error: 'no_media', message: 'Invalid attachment' };
    return {
      error: null,
      objectKey: key,
      contentType:
        row.mimeType?.trim() ||
        this.guessContentType(key, 'application/octet-stream'),
      bucket: 'community',
    };
  }

  async getGroupAttachmentStreamMeta(
    groupId: string,
    messageId: string,
    index: number,
    requesterId: string,
  ): Promise<CommunityStreamMetaResult> {
    const group = await this.groupModel.findById(groupId).lean();
    if (!group) return { error: 'not_found', message: 'Group not found' };
    const members = (group as { members?: unknown[] }).members ?? [];
    const isMember = members.some((m) => String(m) === String(requesterId));
    if (!isMember) {
      return { error: 'forbidden', message: 'Not a group member' };
    }
    const msg = await this.groupMessageModel
      .findOne({ _id: messageId, groupId })
      .lean();
    if (!msg) return { error: 'not_found', message: 'Message not found' };
    const meta = (msg as {
      attachmentsMeta?: Array<{ url?: string; key?: string; mimeType?: string }>;
    }).attachmentsMeta;
    const row = meta?.[index];
    if (!row) return { error: 'not_found', message: 'Attachment not found' };
    const raw =
      (typeof row.url === 'string' && row.url) ||
      (typeof row.key === 'string' && row.key) ||
      '';
    const key = this.resolveKey(raw);
    if (!key) return { error: 'no_media', message: 'Invalid attachment' };
    return {
      error: null,
      objectKey: key,
      contentType:
        row.mimeType?.trim() ||
        this.guessContentType(key, 'application/octet-stream'),
      bucket: 'community',
    };
  }
}
