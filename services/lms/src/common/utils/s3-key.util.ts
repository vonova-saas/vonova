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
