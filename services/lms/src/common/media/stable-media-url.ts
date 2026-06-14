/** When true, APIs return path-style `/api/v1/media/...` URLs instead of S3 presigned GET. */
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

export function buildStableMediaPath(suffix: string): string {
  const base = stableMediaPathPrefix();
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `${base}${path}`;
}

export function buildStableLmsMaterialViewUrl(
  materialId: string,
  materialType?: string,
): string {
  const q =
    materialType && materialType.trim()
      ? `?type=${encodeURIComponent(materialType.trim().toLowerCase())}`
      : '';
  return buildStableMediaPath(
    `/lms/materials/${encodeURIComponent(materialId)}/view${q}`,
  );
}

export function buildStableLmsMaterialDownloadUrl(
  materialId: string,
  materialType?: string,
): string {
  const q =
    materialType && materialType.trim()
      ? `?type=${encodeURIComponent(materialType.trim().toLowerCase())}`
      : '';
  return buildStableMediaPath(
    `/lms/materials/${encodeURIComponent(materialId)}/download${q}`,
  );
}

export function buildStableLmsCourseThumbnailUrl(courseId: string): string {
  return buildStableMediaPath(
    `/lms/courses/${encodeURIComponent(courseId)}/thumbnail`,
  );
}

export function buildStableLmsLessonPosterUrl(
  courseId: string,
  lessonId: string,
): string {
  return buildStableMediaPath(
    `/lms/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/poster`,
  );
}

export function buildStableLmsLessonVideoUrl(
  courseId: string,
  lessonId: string,
): string {
  return buildStableMediaPath(
    `/lms/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/video`,
  );
}
