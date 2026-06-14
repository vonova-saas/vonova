import {
  buildStableLmsCourseThumbnailUrl,
} from 'src/common/media/stable-media-url';
import { assertNoPresignedGet } from 'src/common/media/legacy-media-guard';

/** Align with LMS `normalizeLmsS3ObjectKey` (gateway cannot import LMS at build time). */
function normalizeLmsThumbnailObjectKey(raw: string): string {
  let k = raw.trim().replace(/^\/+/, '');
  if (/^https?:\/\//i.test(k)) {
    try {
      const pathname = new URL(k).pathname.replace(/^\/+/, '');
      k = pathname || k;
    } catch {
      /* keep k */
    }
  }
  while (k.startsWith('library/library/')) {
    k = k.slice('library/'.length);
  }
  while (k.startsWith('course/course/')) {
    k = k.slice('course/'.length);
  }
  while (k.startsWith('courses/courses/')) {
    k = k.slice('courses/'.length);
  }
  return k;
}

/**
 * Resolve S3 object key for a course thumbnail from explicit key or virtual-hosted S3 URL.
 */
export function extractCourseThumbnailS3Key(
  thumbnailUrl?: string,
  thumbnailKey?: string,
): string | null {
  if (thumbnailKey && typeof thumbnailKey === 'string' && thumbnailKey.trim()) {
    return thumbnailKey.trim();
  }
  if (!thumbnailUrl || typeof thumbnailUrl !== 'string') return null;
  const raw = thumbnailUrl.trim();
  // Mongo often stores a bare object key (no scheme) — presign it like a normal key.
  if (!/^https?:\/\//i.test(raw) && raw.includes('/') && !raw.startsWith('/')) {
    if (!raw.includes('..') && !raw.includes('\\') && raw.length <= 2048) {
      return raw;
    }
  }
  try {
    const u = new URL(thumbnailUrl);
    const host = u.hostname.toLowerCase();
    if (!host.includes('amazonaws.com')) return null;
    const vh = /^([^.]+)\.s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i;
    if (vh.test(host)) {
      const key = decodeURIComponent(u.pathname.replace(/^\/+/, ''));
      return key || null;
    }
    if (host === 's3.amazonaws.com' || /^s3\.[a-z0-9-]+\.amazonaws\.com$/i.test(host)) {
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return decodeURIComponent(parts.slice(1).join('/'));
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function presignCourseThumbnailFields<
  T extends Record<string, unknown>,
>(course: T | null | undefined, _s3?: unknown): Promise<T | null | undefined> {
  const bucket = process.env.AWS_S3_BUCKET_LMS?.trim() ?? null;
  const region = process.env.AWS_S3_REGION_LMS?.trim() ?? null;
  if (!course || typeof course !== 'object') return course;
  const { thumbnailKey: _omitKey, ...rest } = course as T & {
    thumbnailKey?: string;
  };
  const key = extractCourseThumbnailS3Key(
    rest.thumbnailUrl as string | undefined,
    (course as { thumbnailKey?: string }).thumbnailKey,
  );
  const rid = (rest as unknown as { _id?: unknown })._id;
  const courseId =
    rid != null
      ? typeof rid === 'object' && rid !== null && 'toString' in rid
        ? String((rid as { toString: () => string }).toString())
        : String(rid)
      : undefined;

  if (!key) {
    console.log('[THUMBNAIL_PRESIGN]', {
      bucket,
      region,
      courseId,
      thumbnailKey: (course as { thumbnailKey?: string }).thumbnailKey ?? null,
      signedUrlGenerated: false,
      reason: 'no_key',
    });
    return { ...rest } as unknown as T;
  }

  if (!courseId) {
    return { ...rest } as unknown as T;
  }

  const thumbnailUrl = buildStableLmsCourseThumbnailUrl(courseId);
  assertNoPresignedGet(thumbnailUrl);
  console.log('[THUMBNAIL_STABLE]', { courseId, thumbnailUrl });
  return { ...rest, thumbnailUrl } as unknown as T;
}
