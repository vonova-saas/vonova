"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { PresignedMediaImage } from "@/components/shared/presigned-media-image";
import { cn } from "@/lib/utils";

type CommunityMediaLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  initialIndex: number;
  /** Refetch a fresh URL for the image at `index` (e.g. expired SigV4 on feed/profile/article). */
  onRefreshAtIndex?: (index: number) => Promise<string | null | undefined>;
};

export function CommunityMediaLightbox({
  open,
  onOpenChange,
  urls,
  initialIndex,
  onRefreshAtIndex,
}: CommunityMediaLightboxProps) {
  const safe = urls.filter(Boolean);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!open) setIdx(0);
  }, [open]);

  useEffect(() => {
    if (!open || safe.length === 0) return;
    const clamped = Math.max(0, Math.min(initialIndex, safe.length - 1));
    setIdx(clamped);
  }, [open, initialIndex, safe.length]);

  const go = useCallback(
    (delta: number) => {
      if (safe.length === 0) return;
      setIdx((i) => (i + delta + safe.length) % safe.length);
    },
    [safe.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, onOpenChange]);

  const src = safe[idx];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-h-[96vh] w-[min(96vw,1100px)] max-w-[96vw] border-0 bg-black/95 p-0 text-white shadow-2xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
        )}
      >
        <DialogTitle className="sr-only">
          Image {idx + 1} of {safe.length}
        </DialogTitle>
        {safe.length === 0 ? null : (
          <div className="relative flex min-h-[50vh] flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
              <span className="text-sm text-white/80">
                {safe.length > 1 ? `${idx + 1} / ${safe.length}` : "Image"}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-white hover:bg-white/10"
                aria-label="Close"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="relative flex flex-1 items-center justify-center px-2 py-4 md:px-8">
              {safe.length > 1 ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute left-1 top-1/2 z-10 h-11 w-11 -translate-y-1/2 text-white hover:bg-white/10 md:left-3"
                  aria-label="Previous image"
                  onClick={() => go(-1)}
                >
                  <ChevronLeft className="h-7 w-7" />
                </Button>
              ) : null}

              <div className="relative aspect-auto max-h-[min(72vh,820px)] w-full max-w-full">
                {src ? (
                  <PresignedMediaImage
                    key={`lb-${idx}`}
                    src={src}
                    alt=""
                    width={1600}
                    height={1200}
                    className="mx-auto h-auto max-h-[min(72vh,820px)] w-auto max-w-full object-contain"
                    priority
                    onRefreshSrc={
                      onRefreshAtIndex
                        ? () => onRefreshAtIndex(idx)
                        : undefined
                    }
                  />
                ) : null}
              </div>

              {safe.length > 1 ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 z-10 h-11 w-11 -translate-y-1/2 text-white hover:bg-white/10 md:right-3"
                  aria-label="Next image"
                  onClick={() => go(1)}
                >
                  <ChevronRight className="h-7 w-7" />
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
