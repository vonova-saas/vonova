"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  FileImage,
  FileText,
  Lock,
  Maximize2,
  Minimize2,
  PlayCircle,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

/**
 * Best-effort anti-piracy modal for in-app viewing of presigned S3 content.
 *
 * What it does:
 *  - Renders content inside a Radix `Dialog` (locked to the website; no new tab).
 *  - Blocks the obvious leaks: right-click, drag, text selection, common
 *    "save" keyboard shortcuts, printscreen hint, Picture-in-Picture / remote
 *    playback on videos, and adds `controlsList="nodownload"`.
 *  - Renders an identifying watermark overlay (name + id + timestamp) so a
 *    leaked screen recording is traceable.
 *
 * What it explicitly does NOT do:
 *  - It cannot fully prevent screen recording or HTTP-tier exfiltration. The
 *    presigned URL is still in memory; this is defense-in-depth, not DRM.
 *  - Anyone determined enough can open devtools. Make sure server-side ACLs
 *    (`canSeeLibraryItem`, enrollment checks, short presign TTLs) are correct;
 *    the modal is a UX guardrail, not a security boundary.
 */
export type ProtectedMediaKind = "pdf" | "video" | "image";

export interface ProtectedMediaModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Presigned URL (PDF / video / image). Reset to `null` when nothing to show. */
  url: string | null;
  /** Title shown in the modal header. */
  title: string;
  /** Subtitle shown under the title (e.g. "Book • Cyber Security"). */
  subtitle?: string;
  /** Defaults to `pdf`. */
  kind?: ProtectedMediaKind;
  /** Watermark identity (name + email/id). Used as a tracer for leaked recordings. */
  viewer?: {
    name?: string | null;
    email?: string | null;
    id?: string | null;
  };
  /** Custom busy state for the chrome (we still render the iframe optimistically). */
  loading?: boolean;
  /** When `url` is null AND not loading, show this CTA. */
  emptyAction?: { label: string; onClick: () => void };
}

const KIND_META: Record<
  ProtectedMediaKind,
  { label: string; icon: typeof FileText; accent: string }
> = {
  pdf: {
    label: "Document",
    icon: FileText,
    accent: "from-sky-500/40 via-violet-500/30 to-fuchsia-500/30",
  },
  video: {
    label: "Video",
    icon: PlayCircle,
    accent: "from-rose-500/40 via-orange-500/30 to-amber-500/30",
  },
  image: {
    label: "Image",
    icon: FileImage,
    accent: "from-emerald-500/40 via-teal-500/30 to-sky-500/30",
  },
};

/**
 * Block obvious "save" keyboard shortcuts while the modal is open. Returns a
 * cleanup function. Only attaches when `enabled`.
 */
function useBlockSaveShortcuts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const stop = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const blocked =
        (e.ctrlKey || e.metaKey) &&
        (key === "s" || key === "p" || (e.shiftKey && key === "s"));
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", stop, { capture: true });
    return () => window.removeEventListener("keydown", stop, { capture: true });
  }, [enabled]);
}

function WatermarkOverlay({
  viewer,
}: {
  viewer?: ProtectedMediaModalProps["viewer"];
}) {
  // Repeated diagonally-tiled watermark with viewer identity. The grid is
  // rendered via SVG so it scales with the modal and isn't easily removed
  // from a casual screenshot crop.
  const label = useMemo(() => {
    const parts = [
      viewer?.name?.trim(),
      viewer?.email?.trim(),
      viewer?.id ? `#${String(viewer.id).slice(-6)}` : null,
      new Date().toISOString().slice(0, 16).replace("T", " "),
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : "vonova viewer";
  }, [viewer?.email, viewer?.id, viewer?.name]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 select-none"
    >
      {/* Diagonal tiled identity text */}
      <svg
        className="absolute inset-0 h-full w-full mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="vonova-wm-tile"
            x="0"
            y="0"
            width="320"
            height="180"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-22)"
          >
            <g fill="currentColor" opacity="0.18">
              <text
                x="0"
                y="20"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontSize="13"
                fontWeight="600"
              >
                {label}
              </text>
              <text
                x="0"
                y="38"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontSize="10"
                fontWeight="500"
                opacity="0.7"
              >
                vonova • protected viewer
              </text>
            </g>
          </pattern>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#vonova-wm-tile)"
          className="text-foreground"
        />
      </svg>

      {/* Subtle corner shield crests for visual identity */}
      <div className="absolute right-3 top-3 hidden items-center gap-1 rounded-full bg-background/40 px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-foreground/40 backdrop-blur-sm sm:inline-flex">
        <Shield className="h-2.5 w-2.5" />
        watermarked
      </div>
    </div>
  );
}

function ProtectedPdfFrame({ url }: { url: string }) {
  // `#toolbar=0&navpanes=0&statusbar=0` is honored by Chromium/Firefox PDF
  // viewers and hides the built-in toolbar (which carries Download / Print
  // buttons). Determined users can still open devtools; that's covered in
  // the JSDoc above.
  const src = `${url}#toolbar=0&navpanes=0&statusbar=0&view=FitH`;
  return (
    <iframe
      title="Material viewer"
      src={src}
      className="block h-full w-full border-0 bg-white"
      // Do NOT set `sandbox` here. Chromium/Brave use an internal PDF viewer
      // that fails inside a restrictive sandbox and shows "This page has been
      // blocked by Chrome". Security still relies on short-lived presigned
      // URLs + access checks on the API, not iframe sandboxing.
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    />
  );
}

function ProtectedVideoFrame({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  return (
    <video
      ref={videoRef}
      src={url}
      controls
      playsInline
      preload="metadata"
      controlsList="nodownload noplaybackrate noremoteplayback"
      disablePictureInPicture
      disableRemotePlayback
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className="block h-full max-h-full w-full bg-black"
    />
  );
}

function ProtectedImageFrame({ url, title }: { url: string; title: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto bg-black">
      <img
        src={url}
        alt={title}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className="max-h-full max-w-full select-none object-contain"
      />
    </div>
  );
}

function LoadingPanel({ kind }: { kind: ProtectedMediaKind }) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="relative">
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 -m-3 rounded-2xl bg-linear-to-br blur-2xl",
            meta.accent,
          )}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-card/80 shadow-xl backdrop-blur">
          <Icon className="h-7 w-7 text-foreground/80" />
          <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-500">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/30" />
            <Sparkles className="relative h-3 w-3" />
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Preparing secure viewer…
        </p>
        <p className="text-xs text-muted-foreground">
          Fetching short-lived signed link and applying watermark.
        </p>
      </div>
      <div className="flex w-48 items-center gap-1">
        <span className="h-1 flex-1 animate-pulse rounded-full bg-foreground/15" />
        <span className="h-1 flex-1 animate-pulse rounded-full bg-foreground/25 [animation-delay:120ms]" />
        <span className="h-1 flex-1 animate-pulse rounded-full bg-foreground/35 [animation-delay:240ms]" />
      </div>
    </div>
  );
}

function EmptyPanel({
  emptyAction,
}: {
  emptyAction?: ProtectedMediaModalProps["emptyAction"];
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -m-3 rounded-2xl bg-amber-500/15 blur-2xl"
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-6 w-6" />
        </div>
      </div>
      <p className="text-base font-semibold text-foreground">
        No file available yet
      </p>
      <p className="max-w-md text-xs text-muted-foreground">
        The owner can upload one from the Material Library. The viewer will
        open here once the file is processed.
      </p>
      {emptyAction ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={emptyAction.onClick}
          className="mt-2"
        >
          {emptyAction.label}
        </Button>
      ) : null}
    </div>
  );
}

export function ProtectedMediaModal({
  open,
  onOpenChange,
  url,
  title,
  subtitle,
  kind = "pdf",
  viewer,
  loading,
  emptyAction,
}: ProtectedMediaModalProps) {
  const [fullscreen, setFullscreen] = useState(false);
  useBlockSaveShortcuts(open);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setFullscreen(false);
  }, [onOpenChange]);

  const showContent = Boolean(url) && !loading;
  const showLoading = loading || (open && !url);
  const showEmpty = open && !loading && !url;

  const meta = KIND_META[kind];
  const KindIcon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "flex flex-col overflow-hidden border-border/60 bg-card p-0 shadow-2xl",
          fullscreen
            ? "h-dvh w-screen max-w-none rounded-none sm:max-w-none"
            : "h-[92vh] w-[calc(100vw-2rem)] max-w-5xl rounded-2xl",
        )}
        onContextMenu={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Animated gradient ribbon at the very top */}
        <div
          aria-hidden
          className={cn(
            "h-[3px] w-full bg-linear-to-r",
            meta.accent,
          )}
        />

        {/* Header */}
        <header className="relative flex shrink-0 items-center gap-3 border-b border-border/60 bg-linear-to-br from-card via-card to-muted/40 px-4 py-3">
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -left-12 -top-8 h-32 w-32 rounded-full bg-linear-to-br opacity-50 blur-3xl",
              meta.accent,
            )}
          />

          {/* Type icon with subtle pulse ring */}
          <div className="relative shrink-0">
            <span
              aria-hidden
              className="absolute inset-0 -m-0.5 rounded-xl bg-linear-to-br from-amber-400/40 to-amber-600/20 blur-md"
            />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-card/90 text-amber-600 shadow-sm backdrop-blur dark:text-amber-400">
              <KindIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="relative min-w-0 flex-1">
            <p className="truncate text-sm font-semibold sm:text-base">
              {title}
            </p>
            {subtitle ? (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
                {subtitle}
              </p>
            ) : null}
          </div>

          <span className="relative hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 sm:inline-flex">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
            </span>
            Protected
          </span>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="relative h-9 w-9 rounded-lg"
            onClick={() => setFullscreen((s) => !s)}
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <DialogClose asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="relative h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </header>

        {/* Body — content sits in a "vellum" frame for clear separation */}
        <div
          className="relative min-h-0 flex-1 select-none overflow-hidden bg-linear-to-br from-muted/40 via-background to-muted/20 p-2 sm:p-3"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Decorative ambient glows */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-linear-to-br opacity-30 blur-3xl",
              meta.accent,
            )}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl"
          />

          <div className="relative h-full w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-inner ring-1 ring-black/5">
            {showLoading ? <LoadingPanel kind={kind} /> : null}
            {showEmpty ? <EmptyPanel emptyAction={emptyAction} /> : null}

            {showContent && url ? (
              <>
                {kind === "pdf" ? <ProtectedPdfFrame url={url} /> : null}
                {kind === "video" ? <ProtectedVideoFrame url={url} /> : null}
                {kind === "image" ? (
                  <ProtectedImageFrame url={url} title={title} />
                ) : null}
                <WatermarkOverlay viewer={viewer} />
              </>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <footer className="relative flex shrink-0 flex-col gap-1.5 border-t border-border/60 bg-linear-to-r from-card via-card to-muted/40 px-4 py-2 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Secure session
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <Lock className="h-3 w-3" />
              Download, print &amp; share disabled
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 truncate">
            <Shield className="h-3 w-3 text-amber-500" />
            <span className="truncate">
              {viewer?.name || viewer?.email
                ? `Signed in as ${viewer.name ?? viewer.email}`
                : "Watermarked viewer"}
            </span>
          </span>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
