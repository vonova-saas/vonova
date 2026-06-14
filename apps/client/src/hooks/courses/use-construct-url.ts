import { useEffect, useState } from "react";
import { getMockVideoUrl } from "@/lib/mock-data/courses/storage";
import { isUsableDirectThumbnailRef } from "@/lib/lms/course-thumbnail";
import { isLikelyS3ObjectKey } from "@/lib/lms/presigned-url";

/**
 * Resolves a thumbnail / media reference for display.
 * - Presigned HTTPS URLs and public paths are used as-is (no IndexedDB mock).
 * - Legacy opaque keys still resolve via mock storage when present.
 */
export default function useConstructUrl(key: string): string {
  const trimmed = (key ?? "").trim();
  const [url, setUrl] = useState<string>(() =>
    !trimmed
      ? "/images/placeholder.svg"
      : isUsableDirectThumbnailRef(trimmed)
        ? trimmed
        : "/images/placeholder.svg",
  );

  useEffect(() => {
    const k = (key ?? "").trim();
    if (!k) {
      setUrl("/images/placeholder.svg");
      return;
    }
    if (isUsableDirectThumbnailRef(k)) {
      setUrl(k);
      return;
    }
    // Bare S3 keys are not valid browser URLs — do not probe mock IndexedDB.
    if (isLikelyS3ObjectKey(k)) {
      setUrl("/images/placeholder.svg");
      return;
    }

    let cancelled = false;
    async function fetchUrl() {
      if (typeof window === "undefined") return;
      console.log("[useConstructUrl] mock lookup key (prefix):", k.slice(0, 160));
      const mockUrl = await getMockVideoUrl(k);
      console.log("[useConstructUrl] mock hit:", mockUrl ? "yes" : "no");
      if (cancelled) return;
      if (mockUrl) setUrl(mockUrl);
      else setUrl("/images/placeholder.svg");
    }

    void fetchUrl();
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (trimmed && isUsableDirectThumbnailRef(trimmed)) return trimmed;
  return url;
}
