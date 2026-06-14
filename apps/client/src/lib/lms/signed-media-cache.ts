import { S3_GET_PRESIGN_TTL_SECONDS } from "@/lib/lms/presigned-url";

/** In-flight dedupe: same refresh key → single network call. */
const inflight = new Map<string, Promise<unknown>>();

export type MediaObservabilityPayload = {
  entityType: string;
  /** Short reason, no PII */
  reason?: string;
  refreshSuccess?: boolean;
  courseId?: string;
  lessonId?: string;
  materialId?: string;
  dedupeKey?: string;
};

/** Safe hostname for logs (no path/query). */
export function hostnameOnlyFromUrl(url: string): string | null {
  const t = url.trim();
  if (!t || !/^https?:\/\//i.test(t)) return null;
  try {
    return new URL(t).hostname;
  } catch {
    return null;
  }
}

export function logMediaRefresh(payload: MediaObservabilityPayload): void {
  console.warn(
    `[MEDIA_REFRESH] ${JSON.stringify({
      ...payload,
      presignTtlSecondsHint: S3_GET_PRESIGN_TTL_SECONDS,
    })}`,
  );
}

export function logMediaCacheExpired(payload: MediaObservabilityPayload): void {
  console.warn(`[MEDIA_CACHE_EXPIRED] ${JSON.stringify(payload)}`);
}

export function logLessonVideoRefresh(payload: {
  courseId: string;
  lessonId: string;
  trigger: "stale_stream_url" | "html_video_error" | "manual_retry";
  refreshSuccess?: boolean;
}): void {
  console.warn(`[LESSON_VIDEO_REFRESH] ${JSON.stringify(payload)}`);
}

/**
 * Deduplicate concurrent refresh calls (e.g. focus + mount race).
 * Clears entry when the promise settles.
 */
export function refreshSignedMediaUrlDeduped<T>(
  dedupeKey: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(dedupeKey) as Promise<T> | undefined;
  if (existing) return existing;
  const p = fetcher().finally(() => {
    inflight.delete(dedupeKey);
  });
  inflight.set(dedupeKey, p);
  return p;
}

/** Alias: single in-flight refresh per dedupe key (no duplicate presign storms). */
export function refreshSignedMediaUrl<T>(
  dedupeKey: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  return refreshSignedMediaUrlDeduped(dedupeKey, fetcher);
}

/** Dev-safe media signing breadcrumb — never pass full signed URLs. */
export function logMediaSignDebug(payload: {
  entityType: string;
  keySample?: string;
  bucketHint?: string;
  regionHint?: string;
  stage?: string;
}): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`[MEDIA_SIGN_DEBUG] ${JSON.stringify(payload)}`);
}

/** Dev-only: bare S3/object keys were resolved to a displayable URL (no raw key in `src`). */
export function logRawMediaKeyHydrated(payload: {
  entityType: string;
  keySample?: string;
  courseId?: string;
  materialId?: string;
}): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`[RAW_MEDIA_KEY_HYDRATED] ${JSON.stringify(payload)}`);
}
