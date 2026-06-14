import { resolveStableMediaPlaybackUrl } from "@/lib/lms/stable-media-url";
import {
  isLikelyS3ObjectKey,
  isStableMediaGatewayUrl,
} from "@/lib/lms/presigned-url";

export type EnsureFreshSignedMediaMeta = {
  dedupeKey: string;
  entityType?: string;
  materialId?: string;
  courseId?: string;
  lessonId?: string;
};

/**
 * Stable media: return path/URL as-is (no expiry refresh).
 * Legacy bare S3 keys still refetch via `fetchFresh` when not in stable mode.
 */
export async function ensureFreshSignedMediaUrl(
  url: string | null | undefined,
  fetchFresh: () => Promise<string | null | undefined>,
  _meta: EnsureFreshSignedMediaMeta,
): Promise<string | null> {
  const trimmed = (url ?? "").trim();
  if (!trimmed) {
    const next = await fetchFresh();
    return (next ?? "").trim() || null;
  }

  if (isStableMediaGatewayUrl(trimmed)) {
    return resolveStableMediaPlaybackUrl(trimmed) || trimmed;
  }

  if (isLikelyS3ObjectKey(trimmed)) {
    const next = await fetchFresh();
    return (next ?? "").trim() || null;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return resolveStableMediaPlaybackUrl(trimmed) || trimmed;
  }

  return trimmed;
}

export function logMaterialRenderRecovery(payload: {
  reason: "open" | "refresh";
  materialId?: string;
}): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[MATERIAL_RENDER_RECOVERY] ${JSON.stringify(payload)}`);
  }
}

export function logLessonStreamRefresh(payload: {
  success?: boolean;
  reason: string;
  courseId?: string;
  lessonId?: string;
}): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[LESSON_STREAM_REFRESH] ${JSON.stringify(payload)}`);
  }
}
