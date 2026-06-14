/**
 * Shared helpers for community S3 uploads.
 * Mirror: `services/api-gateway/src/common/utils/storage/community-s3-helpers.ts` (keep in sync).
 *
 * Presign note (AWS SDK JS v3): With default checksum behavior, `getSignedUrl(PutObjectCommand)`
 * adds `x-amz-checksum-crc32` / `x-amz-sdk-checksum-algorithm` to the query string using an
 * **empty-payload** CRC (`AAAAAA==`). Browser PUTs send real bytes → checksum/signature mismatch.
 * `S3Client` must use `requestChecksumCalculation: 'WHEN_REQUIRED'` for community presign + PUT.
 */

/** Primary type/subtype only, lowercase (no `;codecs=` etc.) for stable signing + PUT headers. */
function primaryMimeLower(mimetype: string | undefined): string | undefined {
  if (mimetype === undefined || mimetype === null) return undefined;
  const primary = String(mimetype).split(';')[0].trim();
  return primary ? primary.toLowerCase() : undefined;
}

export function resolveUploadContentType(
  mimetype: string | undefined,
  originalName: string,
): string {
  const primary = primaryMimeLower(mimetype);
  if (primary && primary !== 'application/octet-stream') {
    return primary;
  }
  const ext = (originalName.split('.').pop() ?? '').toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    heic: 'image/heic',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
  };
  return map[ext] || 'application/octet-stream';
}

export function buildDynamicFolderObjectKey(
  folder: string,
  originalName: string,
): { key: string; sanitized: string } {
  const sanitized = String(originalName ?? 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
  const timestamp = Date.now();
  const f = folder.replace(/^\/+|\/+$/g, '');
  const key = `${f}/${timestamp}_${sanitized}`;
  return { key, sanitized };
}

/** Log presigned URL host+path only (no query / secrets). */
export function safeUrlHostPath(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return '(invalid-url)';
  }
}

const FLEX_CHECKSUM_QUERY_KEYS = [
  'x-amz-checksum-crc32',
  'x-amz-checksum-crc32c',
  'x-amz-checksum-sha1',
  'x-amz-checksum-sha256',
  'x-amz-sdk-checksum-algorithm',
];

export type PresignUrlDiagnostics = {
  host: string;
  pathname: string;
  method: 'PUT';
  signedHeaders: string | null;
  hasFlexibleChecksumQuery: boolean;
  checksumQueryKeys: string[];
};

/** Safe parse of presigned URL — query values are never logged, only key names + flags. */
export function presignPutUrlDiagnostics(url: string): PresignUrlDiagnostics {
  try {
    const u = new URL(url);
    const signedHeaders = u.searchParams.get('X-Amz-SignedHeaders');
    const checksumQueryKeys = FLEX_CHECKSUM_QUERY_KEYS.filter((k) =>
      u.searchParams.has(k),
    );
    return {
      host: u.host,
      pathname: u.pathname,
      method: 'PUT',
      signedHeaders,
      hasFlexibleChecksumQuery: checksumQueryKeys.length > 0,
      checksumQueryKeys,
    };
  } catch {
    return {
      host: '(invalid)',
      pathname: '(invalid)',
      method: 'PUT',
      signedHeaders: null,
      hasFlexibleChecksumQuery: false,
      checksumQueryKeys: [],
    };
  }
}

export function logPresignGenerated(input: {
  bucket: string;
  region: string;
  key: string;
  contentType: string;
  presignedUrl: string;
}): void {
  const d = presignPutUrlDiagnostics(input.presignedUrl);
  const keyPreview =
    input.key.length > 120 ? `${input.key.slice(0, 120)}…` : input.key;
  console.log(
    JSON.stringify({
      event: '[PRESIGN GENERATED]',
      bucket: input.bucket,
      region: input.region,
      key: keyPreview,
      contentType: input.contentType,
      method: d.method,
      signedHeaders: d.signedHeaders,
      host: d.host,
      path: d.pathname,
      hasFlexibleChecksumQuery: d.hasFlexibleChecksumQuery,
      checksumQueryKeys: d.checksumQueryKeys,
    }),
  );
  if (d.hasFlexibleChecksumQuery) {
    console.error(
      '[CommunityS3] Presigned URL includes flexible checksum query params. Browser PUT body will not match the empty-payload CRC embedded at sign time. Ensure S3Client uses requestChecksumCalculation: "WHEN_REQUIRED" (and responseChecksumValidation: "WHEN_REQUIRED") for this service.',
    );
  }
}

export function logCommunityS3PutDiagnostics(input: {
  bucket: string;
  region: string;
  key: string;
  contentType: string;
}): void {
  const keyPreview =
    input.key.length > 120 ? `${input.key.slice(0, 120)}…` : input.key;
  console.log(
    `[CommunityS3] PutObject bucket=${input.bucket} region=${input.region} contentType=${input.contentType} key=${keyPreview}`,
  );
}

export function logCommunityS3PresignDiagnostics(input: {
  bucket: string;
  region: string;
  key: string;
  contentType: string;
  urlHostPath: string;
}): void {
  const keyPreview =
    input.key.length > 120 ? `${input.key.slice(0, 120)}…` : input.key;
  console.log(
    `[CommunityS3] PresignPut bucket=${input.bucket} region=${input.region} contentType=${input.contentType} key=${keyPreview} url=${input.urlHostPath}`,
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export async function withS3PutRetries<T>(
  op: () => Promise<T>,
  opts?: { attempts?: number; label?: string },
): Promise<T> {
  const attempts = opts?.attempts ?? 3;
  const label = opts?.label ?? 'S3Put';
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await op();
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const retryable =
        /timeout|timed out|ECONNRESET|EPIPE|503|500|Slow Down|Thrott/i.test(
          msg,
        );
      if (!retryable || i === attempts - 1) break;
      const backoff = 200 * (i + 1);
      console.warn(`[CommunityS3] ${label} retry ${i + 1}/${attempts - 1} after ${msg.slice(0, 160)}`);
      await sleep(backoff);
    }
  }
  throw lastErr;
}
