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

/** Block any S3 GET presign call site (PUT upload presigns are separate). */
export function blockLegacyGetPresign(operation: string): void {
  console.error(`[LEGACY_MEDIA_BLOCKED] operation=${operation}`);
  throw new Error(
    `[BLOCKED_PRESIGNED_GET] Legacy S3 GET presign blocked (${operation}). Use /api/v1/media/... stream routes.`,
  );
}

/** Reject presigned GET URLs in API payloads — call before returning media fields. */
export function assertNoPresignedGet(url?: string | null): void {
  if (!url) return;
  const s = url.trim();
  if (!s) return;
  if (
    s.includes('X-Amz-Algorithm') ||
    s.includes('X-Amz-Expires') ||
    s.includes('X-Amz-Signature') ||
    s.includes('AWSAccessKeyId') ||
    isSigV4PresignedGetUrl(s)
  ) {
    throw new Error(
      '[BLOCKED_PRESIGNED_GET] Presigned GET detected in stable media mode',
    );
  }
}

export function guardOutboundMediaUrl(
  url: string | null | undefined,
  ctx: {
    entityType: string;
    source: string;
    field: string;
  },
): string | undefined {
  const s = (url ?? '').trim();
  if (!s) return undefined;
  if (isSigV4PresignedGetUrl(s)) {
    let urlHost = '';
    try {
      urlHost = new URL(s).hostname;
    } catch {
      urlHost = 'invalid';
    }
    console.error(
      `[LEGACY_MEDIA_BLOCKED] entityType=${ctx.entityType} source=${ctx.source} field=${ctx.field} urlHost=${urlHost}`,
    );
    throw new Error(
      `Legacy presigned GET URL blocked for ${ctx.entityType}.${ctx.field}`,
    );
  }
  return s;
}
