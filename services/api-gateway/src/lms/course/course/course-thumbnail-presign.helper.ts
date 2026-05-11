import { S3Service } from 'src/common/utils/storage/s3.service';

const THUMBNAIL_PRESIGN_TTL_SECONDS = 3600;

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
>(course: T | null | undefined, s3: S3Service): Promise<T | null | undefined> {
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
    console.log('[THUMBNAIL PRESIGN]', {
      courseId,
      thumbnailKey: (course as { thumbnailKey?: string }).thumbnailKey ?? null,
      signedUrlGenerated: false,
      reason: 'no_key',
    });
    return { ...rest } as unknown as T;
  }
  try {
    const thumbnailUrl = await s3.getPresignedGetUrl(
      key,
      THUMBNAIL_PRESIGN_TTL_SECONDS,
    );
    console.log('[THUMBNAIL PRESIGN]', {
      courseId,
      thumbnailKey: key,
      signedUrlGenerated: !!thumbnailUrl,
    });
    return { ...rest, thumbnailUrl } as unknown as T;
  } catch (err) {
    console.log('[THUMBNAIL PRESIGN]', {
      courseId,
      thumbnailKey: key,
      signedUrlGenerated: false,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ...rest } as unknown as T;
  }
}
