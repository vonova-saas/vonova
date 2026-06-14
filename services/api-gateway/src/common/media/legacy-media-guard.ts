import { stableMediaGetEnabled } from './stable-media-url';

export function logMediaModeStartup(service: string): void {
  const raw = process.env.STABLE_MEDIA_GET_URLS;
  const enabled = stableMediaGetEnabled();
  console.log(
    `[MEDIA_MODE] stableMedia=${enabled} service=${service} env=${raw ?? '(unset, defaulting on)'}`,
  );
  if (!enabled) {
    console.error(
      `[MEDIA_MODE] STABLE_MEDIA_GET_URLS is disabled for ${service} — legacy presigned GET may be returned`,
    );
  }
}

export function isSigV4PresignedGetUrl(url: string): boolean {
  const s = url.trim();
  if (!s) return false;
  return /X-Amz-Algorithm|X-Amz-Signature|X-Amz-Credential|AWSAccessKeyId|Signature=/i.test(
    s,
  );
}

export function blockLegacyGetPresign(operation: string): void {
  console.error(`[LEGACY_MEDIA_BLOCKED] operation=${operation}`);
  throw new Error(
    `[BLOCKED_PRESIGNED_GET] Legacy S3 GET presign blocked (${operation}). Use /api/v1/media/... stream routes.`,
  );
}

export function assertNoPresignedGet(url?: string | null): void {
  if (!url) return;
  const s = url.trim();
  if (!s) return;
  if (
    s.includes('X-Amz-Algorithm') ||
    s.includes('X-Amz-Expires') ||
    s.includes('X-Amz-Signature') ||
    s.includes('AWSAccessKeyId')
  ) {
    throw new Error(
      '[BLOCKED_PRESIGNED_GET] Presigned GET detected in stable media mode',
    );
  }
}
