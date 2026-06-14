/** Gateway origin without path suffix (NEXT_PUBLIC_API_BASE_URL often ends with /api/v1). */
export function resolveGatewayMediaBaseUrl(): string | null {
  let raw =
    process.env.API_GATEWAY_INTERNAL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) return null;

  raw = raw.replace(/\/+$/, "");
  if (raw.endsWith("/api/v1")) {
    raw = raw.slice(0, -"/api/v1".length);
  }
  return raw;
}
