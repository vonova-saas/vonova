/**
 * Client-side safety primitives. React already escapes children by default,
 * so the highest-risk surfaces are:
 *
 *   1. URLs forwarded to `<a href>` / `<img src>` / `<source src>`.
 *   2. Anything rendered via `dangerouslySetInnerHTML` (currently only the
 *      lesson viewer for instructor-authored Markdown / HTML).
 *
 * The helpers here are intentionally tiny and dependency-free.
 */

const TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
const SCRIPT_RE = /<script[\s\S]*?<\/script>/gi;
const STYLE_RE = /<style[\s\S]*?<\/style>/gi;
const IFRAME_RE = /<iframe[\s\S]*?<\/iframe>/gi;
const EVENT_HANDLER_RE = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]+)/gi;
const JS_URL_RE = /javascript\s*:/gi;
const DATA_TEXT_RE = /\bdata:text\/html/gi;

/**
 * Whether the given URL is safe to use in `href` / `src`. Allows
 * `http(s)://`, `mailto:`, `tel:`, root-relative, hash, and (for images)
 * `data:image/...` URIs. Everything else (incl. `javascript:`, `vbscript:`,
 * `file:`) returns false.
 */
export function isSafeUrl(url: unknown, opts: { allowDataImage?: boolean } = {}): url is string {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^mailto:/i.test(trimmed)) return true;
  if (/^tel:/i.test(trimmed)) return true;
  if (/^\//.test(trimmed)) return true;
  if (/^#/.test(trimmed)) return true;
  if (opts.allowDataImage && /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Return the URL if safe, otherwise undefined. Use inline:
 *   `<img src={safeUrl(post.image) ?? PLACEHOLDER} />`
 */
export function safeUrl(url: unknown, opts?: { allowDataImage?: boolean }): string | undefined {
  return isSafeUrl(url, opts) ? url : undefined;
}

/**
 * Same as `safeUrl` but defaulting to data-image support for `<img src>`.
 */
export function safeImageUrl(url: unknown): string | undefined {
  return safeUrl(url, { allowDataImage: true });
}

/**
 * Conservative HTML sanitizer for rich content (e.g. instructor lesson HTML)
 * before passing to `dangerouslySetInnerHTML`. Strips:
 *
 *   - `<script>` / `<style>` / `<iframe>` blocks (incl. their content).
 *   - Inline `on*` event handlers.
 *   - `javascript:` URLs anywhere.
 *
 * Tags themselves (e.g. `<p>`, `<a>`, `<img>`, `<h2>`) are preserved so
 * the existing prose rendering keeps working.
 */
export function sanitizeHtml(input: unknown): string {
  if (typeof input !== "string" || !input) return "";
  let out = input;
  out = out.replace(SCRIPT_RE, "");
  out = out.replace(STYLE_RE, "");
  out = out.replace(IFRAME_RE, "");
  out = out.replace(EVENT_HANDLER_RE, "");
  out = out.replace(JS_URL_RE, "blocked:");
  out = out.replace(DATA_TEXT_RE, "blocked:");
  return out;
}

/**
 * Plain-text variant: strips every tag. Use this for surfaces that should
 * never contain markup (post previews, profile bios, notification text).
 */
export function plainText(input: unknown): string {
  if (typeof input !== "string" || !input) return "";
  return input
    .replace(EVENT_HANDLER_RE, "")
    .replace(TAG_RE, "")
    .replace(JS_URL_RE, "")
    .trim();
}
