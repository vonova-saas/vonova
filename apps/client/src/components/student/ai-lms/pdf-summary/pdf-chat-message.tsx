"use client";

import { PDFMessage } from "./types";
import { AIResponse } from "@/components/ui/ai/ai-components/response";
import { FileText, Play, Pause, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import type { currentUserResponseType } from "@/types/api/app/auth/auth.type";

interface PDFChatMessageProps {
  message: PDFMessage;
  currentPDFName?: string;
}

function pickDisplayUsername(
  user: currentUserResponseType["user"] | undefined,
): string {
  if (!user) return "You";
  const u = user as currentUserResponseType["user"] & { username?: string };
  const fromUsername =
    typeof u.username === "string" && u.username.trim()
      ? u.username.trim()
      : "";
  if (fromUsername) return fromUsername;
  const name =
    typeof user.name === "string" && user.name.trim() ? user.name.trim() : "";
  if (name) return name;
  const email = typeof user.email === "string" ? user.email : "";
  const local = email.includes("@") ? email.split("@")[0]!.trim() : email.trim();
  return local || "You";
}

export default function PDFChatMessage({
  message,
  currentPDFName,
}: PDFChatMessageProps) {
  const auth = useAuthContextOptional();
  const displayUsername = pickDisplayUsername(auth?.user);
  const isUser = message.from === "user";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const hasRecordedAudio = !!message.audioUrl;
  const hasTtsAudio = !hasRecordedAudio && !!(message.ttsText || message.content)?.trim();

  const voiceLabel = useMemo(() => {
    if (hasRecordedAudio) return isUser ? "Voice message" : "AI voice";
    if (hasTtsAudio) return "AI voice";
    return "";
  }, [hasRecordedAudio, hasTtsAudio, isUser]);
  const formatTime = (date: any) => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
};

  const getMessageIcon = () => {
    if (isUser) {
      return (
        <div className="flex max-w-[10.5rem] shrink-0 flex-col items-end justify-end pb-1 pl-1">
          <span
            className="text-right text-[11px] font-semibold leading-snug tracking-tight text-foreground break-words sm:text-xs"
            title={displayUsername}
          >
            {displayUsername}
          </span>
        </div>
      );
    }
    return (
      <div className="flex shrink-0 flex-col justify-end pb-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/25 bg-linear-to-br from-primary to-violet-600 shadow-md">
          <Sparkles className="h-4 w-4 text-primary-foreground" aria-hidden />
        </div>
      </div>
    );
  };

  const getMessageTypeBadge = () => {
    if (!isUser && message.type !== "text") {
      return (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              message.type === "summary" &&
                "border-primary/25 bg-primary/10 text-primary",
              message.type === "question" &&
                "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              message.type === "error" &&
                "border-destructive/30 bg-destructive/10 text-destructive",
              message.type === "voice" &&
                "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
            )}
          >
            <FileText className="h-3 w-3 opacity-70" />
            {message.type}
          </span>
          {currentPDFName && (
            <span className="text-[11px] text-muted-foreground">
              {currentPDFName}
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        "mb-5 flex w-full gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && getMessageIcon()}
      <div
        className={cn(
          "w-full max-w-[min(100%,min(92vw,52rem))]",
          isUser ? "order-first" : "",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border px-4 py-3 text-[15px] leading-relaxed shadow-md backdrop-blur-sm",
            isUser
              ? "border-primary/20 bg-linear-to-br from-primary/15 via-primary/5 to-background text-foreground"
              : "border-border/80 bg-card/95 text-card-foreground",
          )}
        >
          {!isUser && (
            <div
              className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-full bg-linear-to-b from-primary to-violet-500 opacity-90"
              aria-hidden
            />
          )}
          <div className={cn(!isUser && "pl-2")}>
          {getMessageTypeBadge()}
          {message.type === "voice" || message.audioUrl || message.ttsText ? (
            <div className="space-y-2">
              {message.content?.trim() ? (
                <AIResponse>{message.content}</AIResponse>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {voiceLabel}
                </div>
              )}

              {/* Voice player */}
              {hasRecordedAudio ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const el = audioRef.current;
                      if (!el) return;
                      if (el.paused) el.play();
                      else el.pause();
                    }}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                      isUser
                        ? "border-primary/25 bg-background/90 hover:bg-primary/10"
                        : "border-border bg-muted/60 hover:bg-muted",
                    )}
                    aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                      />
                    </div>
                  </div>
                  <audio
                    ref={(n) => {
                      audioRef.current = n;
                    }}
                    src={message.audioUrl}
                    preload="metadata"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false);
                      setProgress(0);
                    }}
                    onTimeUpdate={(e) => {
                      const el = e.currentTarget;
                      if (!el.duration || Number.isNaN(el.duration)) return;
                      setProgress(el.currentTime / el.duration);
                    }}
                    className="hidden"
                  />
                </div>
              ) : hasTtsAudio ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const textToSpeak = (message.ttsText || message.content || "").trim();
                      if (!textToSpeak) return;

                      // Toggle behavior: cancel current speaking if playing, otherwise speak.
                      if (window.speechSynthesis.speaking) {
                        window.speechSynthesis.cancel();
                        setIsPlaying(false);
                        return;
                      }

                      const u = new SpeechSynthesisUtterance(textToSpeak);
                      u.onstart = () => setIsPlaying(true);
                      u.onend = () => setIsPlaying(false);
                      u.onerror = () => setIsPlaying(false);
                      window.speechSynthesis.speak(u);
                    }}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                      isUser
                        ? "border-primary/25 bg-background/90 hover:bg-primary/10"
                        : "border-border bg-muted/60 hover:bg-muted",
                    )}
                    aria-label={isPlaying ? "Stop AI voice" : "Play AI voice"}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full bg-primary/60",
                          isPlaying && "animate-pulse",
                        )}
                        style={{ width: isPlaying ? "70%" : "0%" }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <AIResponse>{message.content}</AIResponse>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            {message.pdfId && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
      {isUser && getMessageIcon()}
    </div>
  );
}
