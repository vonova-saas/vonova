"use client";

import { useEffect, useRef } from "react";
import { FileText, ImageIcon } from "lucide-react";
import { PresignedMediaImage } from "@/components/shared/presigned-media-image";
import type { CommunityAttachmentLite } from "@/types/api/app/community/social.types";

interface Props {
  attachments?: CommunityAttachmentLite[] | null;
  legacy?: string[] | null;
  mine?: boolean;
  /** At most one debounced refetch per parent policy — e.g. refresh message list after expired presigned GET. */
  onSignedMediaError?: () => void;
}

export function MessageAttachments({
  attachments,
  legacy,
  mine,
  onSignedMediaError,
}: Props) {
  const list = attachments ?? [];
  const emitted = useRef(false);

  useEffect(() => {
    emitted.current = false;
  }, [attachments, legacy]);

  const signalMediaError = () => {
    if (emitted.current) return;
    emitted.current = true;
    onSignedMediaError?.();
  };

  const refreshImage = async () => {
    signalMediaError();
    return null;
  };

  if (!list.length && !legacy?.length) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {list.map((a, i) => {
        if (a.type === "VOICE") {
          return (
            <div
              key={`${a.key}-${i}`}
              className="flex items-center gap-2 rounded-xl border bg-background/60 p-1.5 backdrop-blur"
            >
              <audio
                key={a.url}
                src={a.url}
                controls
                preload="metadata"
                className="h-8 w-full max-w-[260px]"
                onError={signalMediaError}
              />
              {typeof a.duration === "number" && a.duration > 0 ? (
                <span className="px-1 text-[10px] tabular-nums text-muted-foreground">
                  {formatDuration(a.duration)}
                </span>
              ) : null}
            </div>
          );
        }
        if (a.type === "IMAGE") {
          return (
            <div
              key={`${a.key}-${i}`}
              className="relative max-h-72 w-full max-w-full overflow-hidden rounded-xl border border-border/50 bg-muted/20"
            >
              <PresignedMediaImage
                key={`${a.key}-${a.url}`}
                src={a.url}
                alt={a.name ?? "Image"}
                width={800}
                height={450}
                className="max-h-72 w-full object-cover"
                loading="lazy"
                onRefreshSrc={refreshImage}
              />
            </div>
          );
        }
        if (a.type === "VIDEO") {
          return (
            <video
              key={`${a.key}-${a.url}`}
              src={a.url}
              controls
              className="max-h-72 w-full rounded-xl"
              onError={signalMediaError}
            />
          );
        }
        return (
          <a
            key={`${a.key}-${i}`}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-2 rounded-xl border p-2 text-xs hover:bg-muted/50 ${
              mine ? "border-white/40 text-white" : "border-border"
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{a.name ?? "Attachment"}</span>
          </a>
        );
      })}
      {legacy?.map((url, i) => (
        <a
          key={`legacy-${i}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border p-2 text-xs"
        >
          <ImageIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{url}</span>
        </a>
      ))}
    </div>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
