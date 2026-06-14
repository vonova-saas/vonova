import {
  isStableMediaGatewayUrl,
  preferFresherPresignedUrl,
} from "@/lib/lms/presigned-url";
import type {
  CommunityAttachmentLite,
  CommunityFeedItem,
  CommunityProfileSummary,
  CommunityNotification,
  DirectMessage,
  GroupChatMessage,
} from "@/types/api/app/community/social.types";

function preferStableMediaUrl(
  existing: string | undefined | null,
  incoming: string | undefined | null,
): string | undefined {
  const a = (existing ?? "").trim();
  const b = (incoming ?? "").trim();
  if (isStableMediaGatewayUrl(b)) return b;
  if (isStableMediaGatewayUrl(a)) return a;
  return preferFresherPresignedUrl(a, b);
}

function mergeUrlArrays(
  a: string[] | null | undefined,
  b: string[] | null | undefined,
): string[] | null | undefined {
  if (!a?.length && !b?.length) return a ?? b ?? undefined;
  if (!a?.length) return b ?? undefined;
  if (!b?.length) return a ?? undefined;
  const n = Math.max(a.length, b.length);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const merged = preferStableMediaUrl(a[i], b[i]);
    const fallback = a[i] ?? b[i];
    const val = merged ?? fallback;
    if (val) out.push(val);
  }
  return out.length ? out : undefined;
}

function mergeAttachmentMeta(
  a: CommunityAttachmentLite[] | undefined,
  b: CommunityAttachmentLite[] | undefined,
): CommunityAttachmentLite[] | undefined {
  if (!a?.length) return b;
  if (!b?.length) return a;
  const n = Math.max(a.length, b.length);
  const out: CommunityAttachmentLite[] = [];
  for (let i = 0; i < n; i++) {
    const ea = a[i];
    const ib = b[i];
    if (!ea) {
      if (ib) out.push(ib);
      continue;
    }
    if (!ib) {
      out.push(ea);
      continue;
    }
    out.push({
      ...ea,
      ...ib,
      url: preferStableMediaUrl(ea.url, ib.url) ?? ib.url ?? ea.url,
    });
  }
  return out.length ? out : undefined;
}

function mergeFeedAuthor(
  existing: CommunityFeedItem["author"],
  incoming: CommunityFeedItem["author"],
): CommunityFeedItem["author"] {
  if (typeof existing === "string" || typeof incoming === "string") {
    return incoming ?? existing;
  }
  if (
    existing &&
    typeof existing === "object" &&
    incoming &&
    typeof incoming === "object"
  ) {
    const E = existing as CommunityProfileSummary;
    const I = incoming as CommunityProfileSummary;
    return {
      ...I,
      profilePictureUrl:
        preferStableMediaUrl(E.profilePictureUrl, I.profilePictureUrl) ??
        I.profilePictureUrl,
    };
  }
  return incoming ?? existing;
}

function mergeFeedSharedBy(
  existing: CommunityFeedItem["sharedBy"],
  incoming: CommunityFeedItem["sharedBy"],
): CommunityFeedItem["sharedBy"] {
  const merged = mergeFeedAuthor(
    existing as CommunityFeedItem["author"],
    incoming as CommunityFeedItem["author"],
  );
  return merged as CommunityFeedItem["sharedBy"];
}

/**
 * When merging websocket / API payloads into feed rows, keep whichever presigned
 * URL expires later so an older event cannot replace a fresher SigV4 string.
 */
export function mergeCommunityFeedItemMedia(
  existing: CommunityFeedItem,
  incoming: CommunityFeedItem,
): CommunityFeedItem {
  const es = existing.sharedPost
    ? (existing.sharedPost as CommunityFeedItem)
    : null;
  const ins = incoming.sharedPost
    ? (incoming.sharedPost as CommunityFeedItem)
    : null;
  const sharedPost =
    es && ins
      ? mergeCommunityFeedItemMedia(es, ins)
      : (incoming.sharedPost ?? existing.sharedPost);

  return {
    ...existing,
    ...incoming,
    author: mergeFeedAuthor(existing.author, incoming.author),
    sharedBy: mergeFeedSharedBy(existing.sharedBy, incoming.sharedBy),
    image:
      preferStableMediaUrl(existing.image, incoming.image) ??
      incoming.image ??
      existing.image,
    images: mergeUrlArrays(existing.images, incoming.images) as
      | string[]
      | null
      | undefined,
    video:
      preferStableMediaUrl(existing.video, incoming.video) ??
      incoming.video ??
      existing.video,
    videos: mergeUrlArrays(existing.videos, incoming.videos) as
      | string[]
      | null
      | undefined,
    sharedPost,
  };
}

function mergeDmSender(
  existing: DirectMessage["senderId"],
  incoming: DirectMessage["senderId"],
): DirectMessage["senderId"] {
  if (
    existing &&
    typeof existing === "object" &&
    incoming &&
    typeof incoming === "object" &&
    "_id" in existing &&
    "_id" in incoming
  ) {
    const E = existing as CommunityProfileSummary;
    const I = incoming as CommunityProfileSummary;
    return {
      ...I,
      profilePictureUrl:
        preferStableMediaUrl(E.profilePictureUrl, I.profilePictureUrl) ??
        I.profilePictureUrl,
    };
  }
  return incoming ?? existing;
}

/** Merge REST + socket patch for DM rows without letting stale attachment URLs win. */
export function mergeDirectMessageMedia(
  existing: DirectMessage,
  incoming: Partial<DirectMessage>,
): DirectMessage {
  return {
    ...existing,
    ...incoming,
    attachments: mergeUrlArrays(existing.attachments, incoming.attachments) as
      | string[]
      | undefined,
    attachmentsMeta: mergeAttachmentMeta(
      existing.attachmentsMeta,
      incoming.attachmentsMeta,
    ),
    senderId: mergeDmSender(
      existing.senderId,
      incoming.senderId ?? existing.senderId,
    ),
  };
}

function mergeGroupSender(
  existing: GroupChatMessage["senderId"],
  incoming: GroupChatMessage["senderId"],
): GroupChatMessage["senderId"] {
  return mergeDmSender(
    existing as DirectMessage["senderId"],
    incoming as DirectMessage["senderId"],
  ) as GroupChatMessage["senderId"];
}

/** When the same notification id is sent twice, prefer fresher actor avatar URLs. */
export function mergeCommunityNotificationMedia(
  existing: CommunityNotification,
  incoming: CommunityNotification,
): CommunityNotification {
  const e = existing.actorId;
  const i = incoming.actorId;
  let actorId = incoming.actorId ?? existing.actorId;
  if (
    e &&
    typeof e === "object" &&
    i &&
    typeof i === "object" &&
    "_id" in e &&
    "_id" in i
  ) {
    const E = e as CommunityProfileSummary;
    const I = i as CommunityProfileSummary;
    actorId = {
      ...I,
      profilePictureUrl:
        preferStableMediaUrl(E.profilePictureUrl, I.profilePictureUrl) ??
        I.profilePictureUrl,
    };
  }
  return {
    ...existing,
    ...incoming,
    actorId,
  };
}

/** Merge REST + socket patch for group chat rows. */
export function mergeGroupChatMessageMedia(
  existing: GroupChatMessage,
  incoming: GroupChatMessage,
): GroupChatMessage {
  return {
    ...existing,
    ...incoming,
    senderId: mergeGroupSender(existing.senderId, incoming.senderId),
    attachmentUrl:
      preferStableMediaUrl(
        existing.attachmentUrl,
        incoming.attachmentUrl,
      ) ??
      incoming.attachmentUrl ??
      existing.attachmentUrl,
    attachmentsMeta: mergeAttachmentMeta(
      existing.attachmentsMeta,
      incoming.attachmentsMeta,
    ),
  };
}
