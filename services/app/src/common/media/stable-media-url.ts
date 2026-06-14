export function stableMediaGetEnabled(): boolean {
  const v = process.env.STABLE_MEDIA_GET_URLS?.trim().toLowerCase();
  if (!v) return true;
  if (v === '0' || v === 'false' || v === 'no') return false;
  return v === '1' || v === 'true' || v === 'yes';
}

function prefix(): string {
  const p =
    process.env.STABLE_MEDIA_PATH_PREFIX?.trim() || '/api/v1/media';
  return p.endsWith('/') ? p.slice(0, -1) : p;
}

export function buildStableCommunityUserAvatarUrl(userId: string): string {
  return `${prefix()}/community/users/${encodeURIComponent(userId)}/avatar`;
}

export function buildStableCommunityUserCoverUrl(userId: string): string {
  return `${prefix()}/community/users/${encodeURIComponent(userId)}/cover`;
}

export function buildStableCommunityPostImageUrl(
  postId: string,
  index: number,
): string {
  return `${prefix()}/community/posts/${encodeURIComponent(postId)}/images/${index}`;
}

export function buildStableCommunityArticleCoverUrl(articleId: string): string {
  return `${prefix()}/community/articles/${encodeURIComponent(articleId)}/cover`;
}

export function buildStableCommunityArticleBlockImageUrl(
  articleId: string,
  blockIndex: number,
): string {
  return `${prefix()}/community/articles/${encodeURIComponent(articleId)}/images/${blockIndex}`;
}

export function buildStableCommunityDmAttachmentUrl(
  conversationId: string,
  messageId: string,
  index: number,
): string {
  return `${prefix()}/community/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/attachments/${index}`;
}

export function buildStableCommunityGroupAttachmentUrl(
  groupId: string,
  messageId: string,
  index: number,
): string {
  return `${prefix()}/community/groups/${encodeURIComponent(groupId)}/messages/${encodeURIComponent(messageId)}/attachments/${index}`;
}
