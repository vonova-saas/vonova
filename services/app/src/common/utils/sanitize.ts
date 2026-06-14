/**
 * Persistence-layer sanitization. Mirrors the api-gateway helper. We apply
 * the same strip/decode pass here so any internal NATS caller (e.g. another
 * microservice posting on behalf of a user) can't bypass XSS protections.
 */

const TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
const EVENT_HANDLER_RE = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]+)/gi;
const JS_URL_RE = /javascript\s*:/gi;
const NULL_BYTE_RE = /\u0000/g;
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;

export function stripTags(input: unknown): string {
  if (input == null) return '';
  let s = String(input);
  s = s.replace(NULL_BYTE_RE, '');
  s = s.replace(EVENT_HANDLER_RE, '');
  s = s.replace(TAG_RE, '');
  s = s.replace(JS_URL_RE, '');
  s = s.replace(ZERO_WIDTH_RE, '');
  return s;
}

export interface SanitizeOptions {
  maxLength?: number;
}

export function sanitizeText(input: unknown, opts: SanitizeOptions = {}): string {
  const cleaned = stripTags(input).trim();
  if (opts.maxLength && cleaned.length > opts.maxLength) {
    return cleaned.slice(0, opts.maxLength);
  }
  return cleaned;
}

export function isSafeUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^mailto:/i.test(trimmed)) return true;
  if (/^\//.test(trimmed)) return true;
  return false;
}
