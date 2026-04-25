/**
 * S3 objects often block hotlinked requests. Load app-bucket article images via same-origin proxy.
 */
export function articleImgSrcForDisplay(url: string): string {
  const s = url.trim();
  if (!s || s.startsWith("blob:") || s.startsWith("data:")) return s;
  try {
    const u = new URL(s);
    if (
      u.protocol === "https:" &&
      u.hostname.toLowerCase().endsWith(".amazonaws.com") &&
      u.hostname.toLowerCase().includes(".s3.")
    ) {
      return `/api/article-image?url=${encodeURIComponent(s)}`;
    }
  } catch {
    return s;
  }
  return s;
}
