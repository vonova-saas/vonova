/** Only pass URLs the browser can load; invalid strings avoid a broken <img> request. */
export function isDisplayableImageSrc(src: string): boolean {
  const s = src.trim();
  if (!s) return false;
  return (
    s.startsWith("https://") ||
    s.startsWith("http://") ||
    s.startsWith("blob:") ||
    s.startsWith("data:image/")
  );
}

/**
 * S3 objects often block hotlinked browser requests (Referer / ACL). Load via same-origin proxy.
 * Blob/data URLs and non-S3 https stay as-is.
 */
export function avatarImgSrcForDisplay(url: string): string {
  const s = url.trim();
  if (!s || s.startsWith("blob:") || s.startsWith("data:")) return s;
  try {
    const u = new URL(s);
    if (
      u.protocol === "https:" &&
      u.hostname.toLowerCase().endsWith(".amazonaws.com") &&
      u.hostname.toLowerCase().includes(".s3.")
    ) {
      return `/api/avatar?url=${encodeURIComponent(s)}`;
    }
  } catch {
    return s;
  }
  return s;
}
