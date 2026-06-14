/**
 * True if key matches lesson video layout from presign PUT:
 * `course/{courseId}/content/lesson/{lessonId}/{filename}`.
 */
export function isLessonVideoContentObjectKey(key: string): boolean {
  const k = key.trim();
  if (!k) return false;
  return /^course\/[^/]+\/content\/lesson\/[^/]+\/.+/.test(k);
}

/** Normalize stored value to an S3 object key (handles legacy full URLs). */
export function objectKeyFromStoredValue(raw: string): string {
  const v = raw.trim();
  if (!v) return v;
  if (!/^https?:\/\//i.test(v)) return v;
  try {
    const pathname = new URL(v).pathname.replace(/^\//, '');
    return pathname || v;
  } catch {
    return v;
  }
}

/**
 * Normalize any LMS object key before Put/Head/Get presign or DB persistence.
 * Strips leading slashes, unwraps legacy full URLs, and collapses duplicated
 * path prefixes (`library/library/…`, `course/course/…`, `courses/courses/…`).
 */
export function normalizeLmsS3ObjectKey(raw: string): string {
  let k = objectKeyFromStoredValue(raw).replace(/^\/+/, '');
  while (k.startsWith('library/library/')) {
    k = k.slice('library/'.length);
  }
  while (k.startsWith('course/course/')) {
    k = k.slice('course/'.length);
  }
  while (k.startsWith('courses/courses/')) {
    k = k.slice('courses/'.length);
  }
  return k;
}

/** @deprecated Prefer {@link normalizeLmsS3ObjectKey} — alias kept for library call sites. */
export function normalizeLibraryObjectKey(raw: string): string {
  return normalizeLmsS3ObjectKey(raw);
}

/**
 * Ordered candidates for S3 HEAD / repair (normalized, URL-decoded variants).
 * Used by migrations and library viewer recovery.
 */
export function lmsS3KeyRecoveryCandidates(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (k: string) => {
    const t = k.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };

  const n0 = normalizeLmsS3ObjectKey(raw);
  push(n0);

  try {
    const dec = decodeURIComponent(n0);
    if (dec !== n0) {
      push(normalizeLmsS3ObjectKey(dec));
      push(dec);
    }
  } catch {
    /* ignore malformed % sequences */
  }

  return out;
}
