export type MediaClientFailureContext = {
  courseId?: string;
  lessonId?: string;
  assetId?: string;
  mediaType?: string;
  /** Full URL is never logged; only hostname is emitted. */
  failedUrl?: string | null;
  reason?: string;
};

function safeHostname(urlStr: string | null | undefined): string | null {
  const s = (urlStr ?? "").trim();
  if (!s) return null;
  try {
    return new URL(s).hostname;
  } catch {
    return null;
  }
}

/**
 * Client-side observability for LMS media failures. Never logs query strings.
 */
export function logMediaClientFailure(ctx: MediaClientFailureContext): void {
  if (process.env.NODE_ENV === "test") return;
  // eslint-disable-next-line no-console
  console.warn(
    "[MEDIA_CLIENT_FAILURE]",
    JSON.stringify({
      courseId: ctx.courseId ?? null,
      lessonId: ctx.lessonId ?? null,
      assetId: ctx.assetId ?? null,
      mediaType: ctx.mediaType ?? null,
      failedUrlHost: safeHostname(ctx.failedUrl ?? null),
      reason: ctx.reason ?? null,
    }),
  );
}
