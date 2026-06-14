"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";
import { PresignedMediaImage } from "@/components/shared/presigned-media-image";
import { cn } from "@/lib/utils";

function isRenderableCoverSrc(url?: string | null): url is string {
  if (!url || !url.trim()) return false;
  return (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("/api/v1/media/") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  );
}

type Props = {
  coverUrl?: string | null;
  previewUrl?: string | null;
  name?: string;
  className?: string;
  /** Refetch profile and return a fresh cover URL (presign recovery). */
  onRefreshCover?: () => Promise<string | null | undefined>;
};

export function ProfileCoverBanner({
  coverUrl,
  previewUrl,
  name,
  className,
  onRefreshCover,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const src = useMemo(() => {
    if (previewUrl && isRenderableCoverSrc(previewUrl)) return previewUrl;
    if (isRenderableCoverSrc(coverUrl) && !failed) return coverUrl;
    return null;
  }, [coverUrl, previewUrl, failed]);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const isBlobPreview = Boolean(previewUrl?.startsWith("blob:"));

  return (
    <div
      className={cn(
        "relative h-52 w-full overflow-hidden bg-linear-to-br from-violet-600 via-indigo-600 to-fuchsia-500 md:h-64",
        className,
      )}
    >
      {src && !failed ? (
        <>
          {!loaded && !isBlobPreview ? (
            <div
              className="absolute inset-0 animate-pulse bg-black/20"
              aria-hidden
            />
          ) : null}
          {isBlobPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`${name ?? "Profile"} cover`}
              className="absolute inset-0 h-full w-full object-cover"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
          ) : (
            <PresignedMediaImage
              src={src}
              alt={`${name ?? "Profile"} cover`}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
              priority
              onLoad={() => setLoaded(true)}
              onRefreshSrc={
                onRefreshCover
                  ? async () => {
                      const next = await onRefreshCover();
                      return (next ?? "").trim() || null;
                    }
                  : undefined
              }
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <ImageIcon className="h-10 w-10 text-white/50" aria-hidden />
        </div>
      )}
    </div>
  );
}
