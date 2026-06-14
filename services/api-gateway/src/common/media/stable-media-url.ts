export function stableMediaGetEnabled(): boolean {
  const v = process.env.STABLE_MEDIA_GET_URLS?.trim().toLowerCase();
  if (!v) return true;
  if (v === '0' || v === 'false' || v === 'no') return false;
  return v === '1' || v === 'true' || v === 'yes';
}

export function stableMediaPathPrefix(): string {
  const prefix =
    process.env.STABLE_MEDIA_PATH_PREFIX?.trim() || '/api/v1/media';
  return prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
}

export function buildStableLmsCourseThumbnailUrl(courseId: string): string {
  const base = stableMediaPathPrefix();
  return `${base}/lms/courses/${encodeURIComponent(courseId)}/thumbnail`;
}
