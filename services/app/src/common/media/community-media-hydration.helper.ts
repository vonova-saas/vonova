import { assertNoPresignedGet } from './legacy-media-guard';
import {
  buildStableCommunityArticleBlockImageUrl,
  buildStableCommunityArticleCoverUrl,
  buildStableCommunityDmAttachmentUrl,
  buildStableCommunityGroupAttachmentUrl,
  buildStableCommunityPostImageUrl,
  buildStableCommunityUserAvatarUrl,
  buildStableCommunityUserCoverUrl,
  stableMediaGetEnabled,
} from './stable-media-url';

function entityId(record: Record<string, unknown>): string | null {
  const raw = record._id ?? record.id;
  if (raw == null) return null;
  return String(raw);
}

function isAuthServiceAvatarUrl(ref: string): boolean {
  const s = ref.trim();
  if (!s.startsWith('http')) return false;
  try {
    const h = new URL(s).hostname.toLowerCase();
    return h.includes('vonova-auth') || h.includes('auth.');
  } catch {
    return false;
  }
}

function isCommunityHostedMediaRef(ref: string): boolean {
  const s = ref.trim();
  if (!s) return false;
  if (s.startsWith('/api/v1/media/')) return true;
  if (isAuthServiceAvatarUrl(s)) return false;
  // Bare `avatars/...` keys may live in auth bucket (signup) or community bucket (profile upload).
  if (s.startsWith('avatars/') && !s.startsWith('http')) return false;
  if (
    s.startsWith('posts/') ||
    s.startsWith('articles/') ||
    s.startsWith('community/') ||
    s.startsWith('covers/')
  ) {
    return true;
  }
  if (s.startsWith('http')) {
    try {
      const h = new URL(s).hostname.toLowerCase();
      return h.includes('amazonaws.com') && !isAuthServiceAvatarUrl(s);
    } catch {
      return false;
    }
  }
  return false;
}

/** Replace user avatar/cover with stable gateway paths (no presign). */
export function applyStableUserPublicMedia(
  user: Record<string, unknown> | null | undefined,
): void {
  if (!stableMediaGetEnabled() || !user || typeof user !== 'object') return;
  const userId = entityId(user);
  if (!userId) return;
  const pic = user.profilePictureUrl;
  if (typeof pic === 'string' && pic.trim()) {
    if (isAuthServiceAvatarUrl(pic)) {
      return;
    }
    if (isCommunityHostedMediaRef(pic)) {
      const avatar = buildStableCommunityUserAvatarUrl(userId);
      assertNoPresignedGet(avatar);
      user.profilePictureUrl = avatar;
    }
  }
  const cover = user.coverImageUrl;
  if (typeof cover === 'string' && cover.trim() && isCommunityHostedMediaRef(cover)) {
    const coverUrl = buildStableCommunityUserCoverUrl(userId);
    assertNoPresignedGet(coverUrl);
    user.coverImageUrl = coverUrl;
  }
}

function collectPostMediaUrls(post: Record<string, unknown>): string[] {
  const urls: string[] = [];
  if (typeof post.image === 'string' && post.image) urls.push(post.image);
  const imgs = post.images;
  if (Array.isArray(imgs)) {
    for (const u of imgs) {
      if (typeof u === 'string' && u) urls.push(u);
    }
  }
  return Array.from(new Set(urls));
}

/** Replace post images/videos with stable gateway paths. */
export function applyStablePostMedia(
  post: Record<string, unknown> | null | undefined,
): void {
  if (!stableMediaGetEnabled() || !post || typeof post !== 'object') return;
  const postId = entityId(post);
  if (!postId) return;

  const unique = collectPostMediaUrls(post);
  if (typeof post.image === 'string' && post.image) {
    const idx = unique.indexOf(post.image);
    if (idx >= 0) post.image = buildStableCommunityPostImageUrl(postId, idx);
  }
  if (Array.isArray(post.images)) {
    post.images = (post.images as unknown[]).map((u) => {
      if (typeof u !== 'string') return u;
      const idx = unique.indexOf(u);
      return idx >= 0 ? buildStableCommunityPostImageUrl(postId, idx) : u;
    });
  }
  if (Array.isArray(post.videos)) {
    post.videos = (post.videos as unknown[]).map((u) => {
      if (typeof u !== 'string') return u;
      const idx = unique.indexOf(u);
      return idx >= 0 ? buildStableCommunityPostImageUrl(postId, idx) : u;
    });
  }

  applyStableUserPublicMedia(post.author as Record<string, unknown>);
  const sharedBy = post.sharedBy;
  if (sharedBy && typeof sharedBy === 'object' && !Array.isArray(sharedBy)) {
    applyStableUserPublicMedia(sharedBy as Record<string, unknown>);
  }
  const sp = post.sharedPost;
  if (sp && typeof sp === 'object' && !Array.isArray(sp)) {
    applyStablePostMedia(sp as Record<string, unknown>);
  }
}

export function applyStableDmMessageMedia(
  conversationId: string,
  msg: Record<string, unknown>,
): void {
  if (!stableMediaGetEnabled() || !msg || typeof msg !== 'object') return;
  const messageId = entityId(msg);
  if (!messageId) return;

  const att = msg.attachmentsMeta;
  if (Array.isArray(att)) {
    msg.attachmentsMeta = att.map((a, index) => {
      if (!a || typeof a !== 'object') return a;
      const o = { ...(a as Record<string, unknown>) };
      if (o.url || o.key) {
        o.url = buildStableCommunityDmAttachmentUrl(
          conversationId,
          messageId,
          index,
        );
      }
      return o;
    });
  }
  if (Array.isArray(msg.attachments)) {
    msg.attachments = (msg.attachments as unknown[]).map((_, index) =>
      buildStableCommunityDmAttachmentUrl(conversationId, messageId, index),
    );
  }
}

export function applyStableGroupMessageMedia(
  groupId: string,
  msg: Record<string, unknown>,
): void {
  if (!stableMediaGetEnabled() || !msg || typeof msg !== 'object') return;
  const messageId = entityId(msg);
  if (!messageId) return;

  const att = msg.attachmentsMeta;
  if (Array.isArray(att)) {
    msg.attachmentsMeta = att.map((a, index) => {
      if (!a || typeof a !== 'object') return a;
      const o = { ...(a as Record<string, unknown>) };
      if (o.url || o.key) {
        o.url = buildStableCommunityGroupAttachmentUrl(
          groupId,
          messageId,
          index,
        );
      }
      return o;
    });
  }
}

export function applyStableArticleMedia(
  article: Record<string, unknown>,
): void {
  if (!stableMediaGetEnabled() || !article || typeof article !== 'object') return;
  const articleId = entityId(article);
  if (!articleId) return;

  applyStableUserPublicMedia(article.author as Record<string, unknown>);

  if (article.coverImageKey || article.coverImage) {
    article.coverImage = buildStableCommunityArticleCoverUrl(articleId);
  }

  const blocks = article.contentBlocks;
  if (Array.isArray(blocks)) {
    blocks.forEach((block, blockIndex) => {
      if (!block || typeof block !== 'object') return;
      const b = block as Record<string, unknown>;
      if (b.type !== 'image' && b.type !== 'IMAGE') return;
      if (b.imageKey || b.url) {
        b.url = buildStableCommunityArticleBlockImageUrl(articleId, blockIndex);
      }
    });
  }
}
