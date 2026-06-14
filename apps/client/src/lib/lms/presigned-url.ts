/** Default S3 GET presign TTL used by LMS / community backends (seconds). */
export const S3_GET_PRESIGN_TTL_SECONDS = 3600;

/** Default React Query stale window (stable media URLs do not expire). */
export const S3_PRESIGNED_QUERY_STALE_MS = 5 * 60 * 1000;

/** Never reuse cached presigned URLs in React Query (always refetch on use). */
export const S3_PRESIGNED_QUERY_STALE_NEVER = 0;

/**
 * True when `ref` looks like a bare S3 object key (not a browser-usable URL).
 */
export function isLikelyS3ObjectKey(ref: string | undefined | null): boolean {
  const s = (ref ?? "").trim();
  if (!s || /^https?:\/\//i.test(s) || s.startsWith("blob:") || s.startsWith("data:")) {
    return false;
  }
  if (s.startsWith("/")) return false;
  return s.includes("/") && !s.includes("..");
}

/** True when URL is an AWS SigV4 presigned GET (must never be rendered in stable mode). */
export function isSigV4PresignedGetUrl(url: string | undefined | null): boolean {
  const s = (url ?? "").trim();
  if (!s || !/^https?:\/\//i.test(s)) return false;
  return /X-Amz-Algorithm|X-Amz-Signature|X-Amz-Credential|AWSAccessKeyId|Signature=/i.test(
    s,
  );
}

/** True for same-origin `/api/v1/media/...` gateway paths (never expire). */
export function isStableMediaGatewayUrl(
  url: string | undefined | null,
): boolean {
  const s = (url ?? "").trim();
  if (!s) return false;
  if (s.startsWith("/api/v1/media/")) return true;
  try {
    const u = new URL(s);
    return u.pathname.startsWith("/api/v1/media/");
  } catch {
    return false;
  }
}

/**
 * Best-effort check whether an AWS SigV4 presigned GET URL is past its lifetime.
 * Uses X-Amz-Date + X-Amz-Expires (or legacy Expires= unix timestamp).
 */
export function isPresignedUrlExpired(
  url: string | undefined | null,
  skewSeconds = 90,
): boolean {
  const trimmed = (url ?? "").trim();
  if (!trimmed || isStableMediaGatewayUrl(trimmed)) return false;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const u = new URL(trimmed);
    const q = u.searchParams;
    const legacyExpires = q.get("Expires");
    if (legacyExpires) {
      const exp = Number.parseInt(legacyExpires, 10);
      if (Number.isFinite(exp)) {
        return Date.now() / 1000 >= exp - skewSeconds;
      }
    }
    const amzDate = q.get("X-Amz-Date");
    const amzExpires = q.get("X-Amz-Expires");
    if (!amzDate || !amzExpires) return false;
    const ttl = Number.parseInt(amzExpires, 10);
    if (!Number.isFinite(ttl) || ttl <= 0) return false;
    const issued = parseAmzDate(amzDate);
    if (!issued) return false;
    const expiresAtMs = issued.getTime() + ttl * 1000;
    return Date.now() >= expiresAtMs - skewSeconds * 1000;
  } catch {
    return false;
  }
}

function parseAmzDate(raw: string): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/i.exec(raw.trim());
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Best-effort SigV4 / legacy expiry instant (ms). Null if not parseable (treat as unknown freshness). */
export function getPresignedUrlExpiryEpochMs(
  url: string | undefined | null,
): number | null {
  const trimmed = (url ?? "").trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;
  try {
    const u = new URL(trimmed);
    const q = u.searchParams;
    const legacyExpires = q.get("Expires");
    if (legacyExpires) {
      const exp = Number.parseInt(legacyExpires, 10);
      if (Number.isFinite(exp)) return exp * 1000;
    }
    const amzDate = q.get("X-Amz-Date");
    const amzExpires = q.get("X-Amz-Expires");
    if (!amzDate || !amzExpires) return null;
    const ttl = Number.parseInt(amzExpires, 10);
    if (!Number.isFinite(ttl) || ttl <= 0) return null;
    const issued = parseAmzDate(amzDate);
    if (!issued) return null;
    return issued.getTime() + ttl * 1000;
  } catch {
    return null;
  }
}

/**
 * When merging socket/API payloads, keep the URL that expires later, or the one that is not expired.
 */
export function preferFresherPresignedUrl(
  existing: string | undefined | null,
  incoming: string | undefined | null,
): string | undefined {
  const a = (existing ?? "").trim();
  const b = (incoming ?? "").trim();
  if (!a) return b || undefined;
  if (!b) return a;
  const expA = getPresignedUrlExpiryEpochMs(a);
  const expB = getPresignedUrlExpiryEpochMs(b);
  const deadA = isPresignedUrlExpired(a);
  const deadB = isPresignedUrlExpired(b);
  if (deadA && !deadB) return b;
  if (!deadA && deadB) return a;
  if (expA != null && expB != null) {
    if (expB > expA) return b;
    return a;
  }
  if (!deadA && !deadB) return b;
  return deadA ? b : a;
}

/**
 * Resolve a stored media ref to an S3 object key for DELETE.
 * Returns null for stable gateway URLs, blobs, and other non-S3 refs.
 */
export function resolveS3ObjectKeyForDelete(
  ref: string | undefined | null,
): string | null {
  const s = (ref ?? "").trim();
  if (!s || isStableMediaGatewayUrl(s)) return null;
  if (s.startsWith("blob:") || s.startsWith("data:")) return null;
  if (isLikelyS3ObjectKey(s)) return s;
  if (/^https?:\/\//i.test(s)) return extractS3KeyFromHttpsUrl(s);
  return null;
}

/** Extract object key from virtual-hosted or path-style S3 HTTPS URL. */
export function extractS3KeyFromHttpsUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();
    if (!host.includes("amazonaws.com")) return null;
    const vh = /^([^.]+)\.s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i;
    if (vh.test(host)) {
      const key = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
      return key || null;
    }
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return decodeURIComponent(parts.slice(1).join("/"));
    }
    if (parts.length === 1) {
      return decodeURIComponent(parts[0]!);
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** True when the ref should be re-resolved from the API (bare key or expired presign). */
export function needsFreshPresignedMediaUrl(ref: string | undefined | null): boolean {
  const s = (ref ?? "").trim();
  if (!s || isStableMediaGatewayUrl(s)) return false;
  if (isLikelyS3ObjectKey(s)) return true;
  if (/^https?:\/\//i.test(s) && isPresignedUrlExpired(s)) return true;
  return false;
}
