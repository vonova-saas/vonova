import { createHash } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import type { FilterQuery, Model } from 'mongoose';
import { Types } from 'mongoose';
import type { PostDocument } from './schemas/posts/post.schema';

/** Strip zero-width and BOM; collapse whitespace; lowercase (spam-dedupe only). */
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF\u00AD]/g;

export function normalizePostContentForDuplicateCheck(raw: string): string {
  return String(raw ?? '')
    .replace(/\uFEFF/g, '')
    .replace(ZERO_WIDTH_RE, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function hashNormalizedPostContent(normalized: string): string {
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

function sortedKeys(parts: Array<string | null | undefined>): string {
  return [...parts]
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter(Boolean)
    .sort()
    .join('|');
}

/** Fingerprint attachments for duplicate detection (not cryptographic security). */
export function fingerprintIncomingMedia(params: {
  imageKey?: string | null;
  imageKeys?: string[] | null;
  videoKeys?: string[] | null;
  fileUrls?: string[] | null;
  uploadParts?: string[];
}): string {
  const keySide = sortedKeys([
    params.imageKey,
    ...(params.imageKeys ?? []),
    ...(params.videoKeys ?? []),
    ...(params.fileUrls ?? []),
  ]);
  const uploadSide = (params.uploadParts ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .sort()
    .join('||');
  return `${keySide}#${uploadSide}`;
}

export function fingerprintFromPostDoc(doc: {
  image?: string | null;
  imageKey?: string | null;
  images?: string[] | null | undefined;
  imageKeys?: string[] | null | undefined;
  videoKeys?: string[] | null | undefined;
  videos?: string[] | null | undefined;
  attachmentsMeta?: Array<{ key?: string | null }> | null | undefined;
}): string {
  const att = (doc.attachmentsMeta ?? [])
    .map((a) => (a?.key ? String(a.key) : ''))
    .filter(Boolean);
  return sortedKeys([
    doc.imageKey,
    doc.image,
    ...(doc.imageKeys ?? []),
    ...(doc.images ?? []),
    ...(doc.videoKeys ?? []),
    ...(doc.videos ?? []),
    ...att,
  ]);
}

const DEFAULT_WINDOW_MS = 30_000;

export type RapidDuplicateCheckInput = {
  authorId: string | Types.ObjectId;
  content: string;
  incomingMediaFingerprint: string;
  /** `""` for feed; `${groupId}:${channelId ?? ""}` for group posts */
  contextKey: string;
  skip?: boolean;
};

function toAuthorOid(id: string | Types.ObjectId): Types.ObjectId {
  if (id instanceof Types.ObjectId) return id;
  if (!Types.ObjectId.isValid(String(id))) {
    throw new BadRequestException('Invalid author id');
  }
  return new Types.ObjectId(String(id));
}

/**
 * Blocks only rapid repeats: same author, same normalized text, same media
 * fingerprint, same context (feed vs group+channel), within [timeWindow].
 */
export async function assertNotRapidPostDuplicate(
  postModel: Model<PostDocument>,
  input: RapidDuplicateCheckInput,
  timeWindowMs = DEFAULT_WINDOW_MS,
): Promise<void> {
  if (input.skip) return;
  const author = toAuthorOid(input.authorId);

  const normalized = normalizePostContentForDuplicateCheck(input.content);
  if (!normalized) return;

  const since = new Date(Date.now() - timeWindowMs);
  const normalizedHash = hashNormalizedPostContent(normalized);

  const filter: FilterQuery<PostDocument> = {
    author,
    createdAt: { $gte: since },
    sharedPost: null,
    isDeleted: { $ne: true },
  };

  const candidates = await postModel
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(48)
    .select(
      'content image imageKey images imageKeys videos videoKeys attachmentsMeta groupId channelId createdAt',
    )
    .lean();

  for (const row of candidates) {
    if (normalizePostContentForDuplicateCheck(String(row.content ?? '')) !== normalized) {
      continue;
    }
    const ctx =
      row.groupId == null
        ? ''
        : `${String(row.groupId)}:${row.channelId ? String(row.channelId) : ''}`;
    if (ctx !== input.contextKey) continue;

    if (fingerprintFromPostDoc(row) !== input.incomingMediaFingerprint) continue;

    console.log(
      JSON.stringify({
        event: '[POST DUPLICATE CHECK]',
        userId: String(author),
        normalizedHash,
        matched: true,
        timeWindowMs,
        blocked: true,
        contextKey: input.contextKey,
      }),
    );

    throw new BadRequestException(
      'Duplicate post detected. Please wait a moment before posting the same content again.',
    );
  }
}
