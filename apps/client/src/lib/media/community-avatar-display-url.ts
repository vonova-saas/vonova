import { avatarImgSrcForDisplay } from "@/lib/avatar-display-url";
import { isStableMediaGatewayUrl } from "@/lib/lms/presigned-url";

function isAuthBucketAvatarUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.includes("vonova-auth") || h.includes("auth.");
  } catch {
    return false;
  }
}

/** Avatar src for community UI (stable media, auth-bucket S3, or legacy URLs). */
export function communityAvatarDisplayUrl(
  url: string | null | undefined,
): string | undefined {
  const s = (url ?? "").trim();
  if (!s) return undefined;
  if (isAuthBucketAvatarUrl(s)) return avatarImgSrcForDisplay(s);
  if (isStableMediaGatewayUrl(s)) return s;
  if (/^https?:\/\//i.test(s)) return avatarImgSrcForDisplay(s);
  return s;
}
