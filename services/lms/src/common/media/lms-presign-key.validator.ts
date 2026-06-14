import {
  normalizeLmsS3ObjectKey,
  objectKeyFromStoredValue,
} from '../utils/s3-key.util';

function looksLikePresignedUrl(raw: string): boolean {
  return (
    raw.includes('X-Amz-Algorithm=') ||
    raw.includes('X-Amz-Signature=') ||
    /[?&]X-Amz-/.test(raw)
  );
}

export type LmsPresignKeyValidation =
  | { ok: true; key: string }
  | { ok: false; reason: string };

/**
 * Validates a value before using it as an S3 object Key for LMS presigned GET/PUT.
 * Does not perform network I/O.
 */
export function tryValidateLmsObjectKeyForPresign(
  rawKey: string,
): LmsPresignKeyValidation {
  const trimmed = (rawKey ?? '').trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty' };
  }

  if (looksLikePresignedUrl(trimmed)) {
    return { ok: false, reason: 'presigned_url_not_allowed_as_key' };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (u.search && u.search.length > 1) {
        return { ok: false, reason: 'url_with_query_not_allowed_as_object_key' };
      }
    } catch {
      return { ok: false, reason: 'invalid_url' };
    }
  }

  const key = normalizeLmsS3ObjectKey(objectKeyFromStoredValue(trimmed));
  if (!key) {
    return { ok: false, reason: 'empty_after_normalize' };
  }

  if (/[?&#]/.test(key)) {
    return { ok: false, reason: 'key_contains_query_or_fragment' };
  }

  if (/amazonaws\.com|:\/\/|\bs3:\/\//i.test(key)) {
    return { ok: false, reason: 'key_must_not_embed_url_or_host' };
  }

  const dupMarkers = [
    'courses/courses/',
    'course/course/',
    'library/library/',
    'videos/videos/',
  ];
  for (const m of dupMarkers) {
    if (key.includes(m)) {
      return { ok: false, reason: `duplicate_path_segment:${m.replace(/\//g, '_')}` };
    }
  }

  const stable = normalizeLmsS3ObjectKey(key);
  if (stable !== key) {
    return { ok: false, reason: 'normalize_unstable' };
  }

  return { ok: true, key };
}
