/**
 * Builds the axios `url` for gateway routes under Nest's global prefix `/api/v1`.
 * - If `NEXT_PUBLIC_API_BASE_URL` already ends with `/api/v1`, returns `relativePath` only
 *   (e.g. `admin/auth/reset-password`) so the final URL is `{base}/admin/auth/...`.
 * - Otherwise returns `api/v1/{relativePath}` so the final URL is `{origin}/api/v1/...`
 *   when base is empty, or `{base}/api/v1/...` when base has no version segment.
 */
export function apiV1Path(relativePath: string): string {
  const rel = relativePath.replace(/^\//, '');
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '')
    .trim()
    .replace(/\/+$/, '');
  const baseEndsWithV1 = /\/api\/v1$/i.test(base);
  if (baseEndsWithV1) {
    return rel;
  }
  return `api/v1/${rel}`;
}
