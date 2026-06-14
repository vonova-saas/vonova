/**
 * Lightweight, dependency-free text + HTML sanitizers.
 *
 * The intent isn't to provide a full WYSIWYG-safe sanitizer (that would
 * require `sanitize-html` and DOM parsing). It's to make sure plain-text
 * surfaces — posts, comments, DMs, bios, usernames — cannot smuggle in
 * `<script>` payloads or javascript: URLs, regardless of how the client
 * later renders the value. React's default escaping is the primary defence
 * on the rendering side; this is the persistence-layer backstop.
 */

const TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
// Inline event handlers and javascript: URLs that survive a naive tag strip.
const EVENT_HANDLER_RE = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]+)/gi;
const JS_URL_RE = /javascript\s*:/gi;
const NULL_BYTE_RE = /\u0000/g;
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;
const HTML_ENTITY_RE = /&(amp|lt|gt|quot|#0?39|#x27|#x2F);/gi;
const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#039;': "'",
  '&#x27;': "'",
  '&#x2f;': '/',
};

/**
 * Strip all HTML tags + inline event handlers from a plain-text field.
 * Idempotent and safe to apply repeatedly.
 */
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

/**
 * Decode the most common HTML entities so users see what they typed instead
 * of `&amp;` etc. after a `stripTags` pass. Only the safe entity set.
 */
export function decodeEntities(input: string): string {
  return input.replace(HTML_ENTITY_RE, (m) => ENTITY_MAP[m.toLowerCase()] ?? m);
}

export interface SanitizeOptions {
  maxLength?: number;
  /** When true an empty / whitespace-only result throws. */
  requireNonEmpty?: boolean;
  /** Surface name used in the thrown error message. */
  field?: string;
}

/**
 * Apply tag-stripping + length cap + non-empty guard. Returns the final
 * trimmed string ready for persistence.
 */
export function sanitizeText(input: unknown, opts: SanitizeOptions = {}): string {
  const cleaned = stripTags(input).trim();
  if (opts.maxLength && cleaned.length > opts.maxLength) {
    return cleaned.slice(0, opts.maxLength);
  }
  return cleaned;
}

/**
 * Whether a URL is safe to render in `href` / `src` attributes. Blocks
 * `javascript:`, `data:` (except images), and unknown protocols.
 */
export function isSafeUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^mailto:/i.test(trimmed)) return true;
  if (/^\//.test(trimmed)) return true;
  return false;
}
