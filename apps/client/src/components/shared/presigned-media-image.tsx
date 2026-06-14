"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { shouldBypassNextImageOptimization } from "@/lib/lms/course-thumbnail";
import {
  isPresignedUrlExpired,
  isStableMediaGatewayUrl,
} from "@/lib/lms/presigned-url";
import { resolveStableMediaPlaybackUrl } from "@/lib/lms/stable-media-url";
import { assertLegalMediaUrl } from "@/lib/media/assert-legal-media-url";

type PresignedMediaImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  /** Called once when the image fails (expired presign, etc.) to obtain a fresh URL. */
  onRefreshSrc?: () => Promise<string | null | undefined>;
};

/**
 * next/image wrapper for S3 presigned URLs: skips the optimizer and refreshes
 * the src once when load fails (typically expired SigV4).
 */
export function PresignedMediaImage({
  src,
  onRefreshSrc,
  unoptimized,
  ...rest
}: PresignedMediaImageProps) {
  assertLegalMediaUrl(src, "PresignedMediaImage");
  const resolvedSrc = resolveStableMediaPlaybackUrl(src);
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);
  const refreshed = useRef(false);

  useEffect(() => {
    const next = resolveStableMediaPlaybackUrl(src);
    setCurrentSrc(next);
    refreshed.current = false;
    if (
      !onRefreshSrc ||
      isStableMediaGatewayUrl(src) ||
      !isPresignedUrlExpired(src)
    ) {
      return;
    }
    refreshed.current = true;
    void onRefreshSrc()
      .then((next) => {
        const trimmed = (next ?? "").trim();
        if (trimmed) setCurrentSrc(trimmed);
      })
      .catch(() => {
        refreshed.current = false;
      });
  }, [src, onRefreshSrc]);

  const onError = useCallback(() => {
    if (refreshed.current || !onRefreshSrc || isStableMediaGatewayUrl(src)) {
      return;
    }
    refreshed.current = true;
    void onRefreshSrc()
      .then((next) => {
        const trimmed = (next ?? "").trim();
        if (trimmed) setCurrentSrc(trimmed);
      })
      .catch(() => {
        /* keep broken */
      });
  }, [onRefreshSrc]);

  const bypass =
    unoptimized ?? shouldBypassNextImageOptimization(currentSrc);

  return (
    <Image
      {...rest}
      src={currentSrc}
      unoptimized={bypass}
      onError={onError}
    />
  );
}
