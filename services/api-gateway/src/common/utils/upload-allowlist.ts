/**
 * Server-side allowlist of accepted upload kinds.
 *
 * The presigned PUT endpoint accepts a `contentType` from the client; that
 * value is also baked into the signed URL so S3 enforces it on receipt.
 * This module is the gateway's belt-and-suspenders check: reject anything
 * outside the allowlist before issuing a presign.
 */

export type UploadKind = 'IMAGE' | 'VIDEO' | 'PDF' | 'VOICE' | 'FILE';

interface UploadRule {
  /** Allowed MIME types. */
  mime: RegExp;
  /** Allowed lower-case file extensions (without dot). */
  ext: Set<string>;
  /** Maximum upload size in bytes — informational; clients enforce it too. */
  maxBytes: number;
}

const RULES: Record<UploadKind, UploadRule> = {
  IMAGE: {
    mime: /^image\/(png|jpe?g|gif|webp|avif|heic|heif)$/i,
    ext: new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'heic', 'heif']),
    maxBytes: 15 * 1024 * 1024, // 15 MB
  },
  VIDEO: {
    mime: /^video\/(mp4|quicktime|webm|x-matroska)$/i,
    ext: new Set(['mp4', 'mov', 'webm', 'mkv']),
    maxBytes: 200 * 1024 * 1024, // 200 MB
  },
  PDF: {
    mime: /^application\/pdf$/i,
    ext: new Set(['pdf']),
    maxBytes: 30 * 1024 * 1024,
  },
  VOICE: {
    mime: /^audio\/(webm|mp4|ogg|mpeg|wav|x-m4a)$/i,
    ext: new Set(['webm', 'm4a', 'mp4', 'ogg', 'mp3', 'wav']),
    maxBytes: 25 * 1024 * 1024,
  },
  FILE: {
    // Generic "FILE" still requires an explicit content-type; raw executables
    // are blocked below via `BLOCKED_EXTENSIONS`.
    mime: /^(application|text)\//i,
    ext: new Set([
      'pdf',
      'doc',
      'docx',
      'ppt',
      'pptx',
      'xls',
      'xlsx',
      'csv',
      'txt',
      'md',
      'zip',
    ]),
    maxBytes: 50 * 1024 * 1024,
  },
};

/** Always rejected regardless of declared kind. */
const BLOCKED_EXTENSIONS = new Set([
  'exe',
  'msi',
  'bat',
  'cmd',
  'com',
  'scr',
  'pif',
  'jar',
  'js',
  'jse',
  'vbs',
  'vbe',
  'wsf',
  'wsh',
  'ps1',
  'ps2',
  'app',
  'dmg',
  'bin',
  'iso',
  'sh',
  'csh',
  'php',
  'pl',
  'cgi',
]);

const SAFE_FILENAME = /^[A-Za-z0-9._-]+$/;

export interface UploadValidationInput {
  kind?: UploadKind;
  originalName: string;
  contentType: string;
  size?: number;
}

export interface UploadValidationResult {
  ok: boolean;
  reason?: string;
  /** Sanitized filename safe to embed in an S3 key. */
  safeName: string;
  kind: UploadKind;
  maxBytes: number;
}

export function validateUpload(
  input: UploadValidationInput,
): UploadValidationResult {
  const kind: UploadKind = input.kind ?? 'FILE';
  const rule = RULES[kind];
  /** Match MIME on primary type only (browsers send `audio/webm;codecs=opus`, etc.). */
  const contentTypePrimary = String(input.contentType ?? '')
    .split(';')[0]
    .trim();
  const original = String(input.originalName ?? '').trim();
  const safeName = original
    .replace(/\.\.+/g, '.')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .slice(0, 120);
  if (!safeName) {
    return {
      ok: false,
      reason: 'EMPTY_FILENAME',
      safeName: 'file',
      kind,
      maxBytes: rule.maxBytes,
    };
  }
  if (!SAFE_FILENAME.test(safeName)) {
    return {
      ok: false,
      reason: 'UNSAFE_FILENAME',
      safeName,
      kind,
      maxBytes: rule.maxBytes,
    };
  }
  const ext = safeName.includes('.')
    ? safeName.split('.').pop()!.toLowerCase()
    : '';
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      reason: 'BLOCKED_EXTENSION',
      safeName,
      kind,
      maxBytes: rule.maxBytes,
    };
  }
  if (!rule.mime.test(contentTypePrimary)) {
    return {
      ok: false,
      reason: 'UNSUPPORTED_MIME',
      safeName,
      kind,
      maxBytes: rule.maxBytes,
    };
  }
  if (ext && !rule.ext.has(ext)) {
    return {
      ok: false,
      reason: 'EXTENSION_KIND_MISMATCH',
      safeName,
      kind,
      maxBytes: rule.maxBytes,
    };
  }
  if (typeof input.size === 'number' && input.size > rule.maxBytes) {
    return {
      ok: false,
      reason: 'FILE_TOO_LARGE',
      safeName,
      kind,
      maxBytes: rule.maxBytes,
    };
  }
  return { ok: true, safeName, kind, maxBytes: rule.maxBytes };
}

/**
 * Make sure a constructed S3 key stays inside the intended folder — e.g.
 * `community/groups/<groupId>/` — even if the caller managed to coax a
 * malicious name past the upstream checks.
 */
export function assertKeyPrefix(key: string, expectedPrefix: string): void {
  if (typeof key !== 'string' || !key.startsWith(expectedPrefix)) {
    throw new Error('UNSAFE_S3_KEY');
  }
  if (key.includes('..')) {
    throw new Error('UNSAFE_S3_KEY');
  }
}
