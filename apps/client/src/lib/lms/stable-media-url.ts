import { baseURL } from "@/services/base-url";
import { assertLegalMediaUrl } from "@/lib/media/assert-legal-media-url";
import { isStableMediaGatewayUrl } from "@/lib/lms/presigned-url";

/**
 * Resolve stable gateway media paths for native <img>/<video>/<iframe>.
 * Prefers same-origin `/api/v1/media/...` (Next proxy + httpOnly cookie).
 */
export function resolveStableMediaPlaybackUrl(
  raw: string | null | undefined,
): string {
  const s = (raw ?? "").trim();
  if (!s) return "";

  assertLegalMediaUrl(s, "resolveStableMediaPlaybackUrl");

  if (isStableMediaGatewayUrl(s)) {
    try {
      const u = new URL(s, "http://local.invalid");
      if (u.pathname.startsWith("/api/v1/media/")) {
        return `${u.pathname}${u.search}`;
      }
    } catch {
      /* path-only */
    }
    if (s.startsWith("/api/v1/media/")) return s;
  }

  if (/^https?:\/\//i.test(s)) return s;

  if (s.startsWith("/api/v1/media/")) return s;

  if (s.startsWith("/") && baseURL) {
    const b = baseURL.replace(/\/+$/, "");
    const full = `${b}${s}`;
    if (isStableMediaGatewayUrl(full)) {
      return s.startsWith("/api/v1/media/") ? s : full;
    }
    return full;
  }

  return s;
}
