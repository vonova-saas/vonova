import { isStableMediaGatewayUrl } from "@/lib/lms/presigned-url";

/** Safe fallback when no thumbnail exists or S3 load fails (must exist under `public/`). */
export const COURSE_THUMBNAIL_PLACEHOLDER = "/images/placeholder.svg";
export function isLikelyRemoteMediaUrl(src: string | undefined | null): boolean {
  const s = (src ?? "").trim();
  if (!s) return false;
  return /^https?:\/\//i.test(s);
}

/**
 * Thumbnail refs that must be rendered as-is (never replaced with a placeholder
 * by URL-resolution hooks). Includes direct HTTPS, blob/data URLs, and same-origin paths.
 */
export function isUsableDirectThumbnailRef(src: string | undefined | null): boolean {
  const s = (src ?? "").trim();
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return true;
  if (s.startsWith("blob:") || s.startsWith("data:")) return true;
  if (s.startsWith("/")) return true;
  return false;
}

/**
 * SigV4 presigned S3 URLs must not go through Next.js Image Optimization — the
 * optimizer fetches them server-side and S3 returns 403 ("upstream image failed").
 */
export function shouldBypassNextImageOptimization(
  src: string | undefined | null,
): boolean {
  const s = (src ?? "").trim();
  if (!s) return false;
  if (isStableMediaGatewayUrl(s)) return true;
  if (s.startsWith("blob:") || s.startsWith("data:")) return true;
  if (s.endsWith(".svg")) return true;
  if (!/^https?:\/\//i.test(s)) return false;
  try {
    const u = new URL(s);
    const h = u.hostname.toLowerCase();
    if (h.includes("amazonaws.com") || h.includes("cloudfront.net")) return true;
    const q = u.search;
    if (q.includes("X-Amz-") || q.includes("AWSAccessKeyId=")) return true;
  } catch {
    return true;
  }
  return false;
}