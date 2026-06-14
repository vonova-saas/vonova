"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useConstructUrl from "@/hooks/courses/use-construct-url";
import {
  COURSE_THUMBNAIL_PLACEHOLDER,
  isUsableDirectThumbnailRef,
} from "@/lib/lms/course-thumbnail";
import { isLikelyS3ObjectKey, isPresignedUrlExpired } from "@/lib/lms/presigned-url";
import {
  logRawMediaKeyHydrated,
  refreshSignedMediaUrl,
} from "@/lib/lms/signed-media-cache";

type FreshThumbnailFetcher = (
  courseId: string,
) => Promise<{ thumbnailUrl?: string | null }>;

function resolveInitialThumb(
  rawThumb: string,
  constructed: string,
): string {
  if (constructed !== COURSE_THUMBNAIL_PLACEHOLDER) return constructed;
  if (isUsableDirectThumbnailRef(rawThumb) && !isPresignedUrlExpired(rawThumb)) {
    return rawThumb;
  }
  return COURSE_THUMBNAIL_PLACEHOLDER;
}

/**
 * Resolves course thumbnail for cards/forms with one automatic refresh on load error
 * (expired presigned URL or stale React Query cache).
 */
export function useCourseThumbnailDisplay(
  courseId: string,
  rawThumb: string,
  fetchFresh: FreshThumbnailFetcher,
) {
  const trimmed = (rawThumb ?? "").trim();
  const constructed = useConstructUrl(trimmed);
  const [src, setSrc] = useState(() =>
    resolveInitialThumb(trimmed, constructed),
  );
  const refreshed = useRef(false);

  useEffect(() => {
    setSrc(resolveInitialThumb(trimmed, constructed));
    refreshed.current = false;
  }, [trimmed, constructed, courseId]);

  /** Bare object keys are invalid in `<img src>` — hydrate once via course GET (deduped). */
  useEffect(() => {
    if (!courseId || !trimmed || !isLikelyS3ObjectKey(trimmed)) return;
    let cancelled = false;
    void refreshSignedMediaUrl(`course-thumb-key:${courseId}`, () =>
      fetchFresh(courseId),
    )
      .then((course) => {
        if (cancelled) return;
        const next = (course.thumbnailUrl ?? "").trim();
        if (next) {
          setSrc(next);
          logRawMediaKeyHydrated({
            entityType: "course_thumbnail",
            courseId,
            keySample: trimmed.slice(0, 96),
          });
        }
      })
      .catch(() => {
        /* keep placeholder — image onError may still refresh */
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, trimmed, fetchFresh]);

  const onError = useCallback(() => {
    if (refreshed.current || !courseId) return;
    refreshed.current = true;
    void fetchFresh(courseId)
      .then((course) => {
        const next = (course.thumbnailUrl ?? "").trim();
        if (next) setSrc(next);
      })
      .catch(() => {
        /* keep placeholder */
      });
  }, [courseId, fetchFresh]);

  return { src, onError };
}
