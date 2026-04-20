"use client";

import { PDFMessage } from "./types";
import { AIResponse } from "@/components/ui/ai/ai-components/response";
import { FileText, Bot, Play, Pause } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface PDFChatMessageProps {
  message: PDFMessage;
  currentPDFName?: string;
}

export default function PDFChatMessage({
  message,
  currentPDFName,
}: PDFChatMessageProps) {
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
        <div className="flex items-end mr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/avatars/avatar1.avif"
            alt="User"
            className="w-10 h-10 rounded-full border"
          />
        </div>
      );
    } else {
      return (
        <div className="flex items-end mr-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border">
            <Bot className="w-6 h-6 text-gray-700" />
          </div>
        </div>
      );
    }
  };

  const getMessageTypeBadge = () => {
    if (!isUser && message.type !== "text") {
      const typeColors = {
        summary: "bg-blue-100 text-blue-700 border-blue-200",
        question: "bg-green-100 text-green-700 border-green-200",
        error: "bg-red-100 text-red-700 border-red-200",
        voice: "bg-purple-100 text-purple-700 border-purple-200",
      };

      return (
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${typeColors[message.type] || ""}`}
          >
            {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
          </span>
          {currentPDFName && (
            <span className="text-xs text-muted-foreground">
              from {currentPDFName}
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      {!isUser && getMessageIcon()}
      <div className={`max-w-[70%] ${isUser ? "ml-8" : "mr-8"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-base ${isUser ? "bg-white text-black" : "bg-neutral-900 text-white"} shadow-sm`}
        >
          {getMessageTypeBadge()}
          {message.type === "voice" || message.audioUrl || message.ttsText ? (
            <div className="space-y-2">
              {message.content?.trim() ? (
                <AIResponse>{message.content}</AIResponse>
              ) : (
                <div className={`text-sm ${isUser ? "text-neutral-700" : "text-neutral-200"}`}>
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
                    className={`h-9 w-9 rounded-full flex items-center justify-center ${isUser ? "bg-black/10" : "bg-white/10"}`}
                    aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
                  >
                    {isPlaying ? (
                      <Pause className={`w-4 h-4 ${isUser ? "text-black" : "text-white"}`} />
                    ) : (
                      <Play className={`w-4 h-4 ${isUser ? "text-black" : "text-white"}`} />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className={`h-2 rounded-full overflow-hidden ${isUser ? "bg-black/10" : "bg-white/10"}`}>
                      <div
                        className={`h-full ${isUser ? "bg-black/40" : "bg-white/40"}`}
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
                    className={`h-9 w-9 rounded-full flex items-center justify-center ${isUser ? "bg-black/10" : "bg-white/10"}`}
                    aria-label={isPlaying ? "Stop AI voice" : "Play AI voice"}
                  >
                    {isPlaying ? (
                      <Pause className={`w-4 h-4 ${isUser ? "text-black" : "text-white"}`} />
                    ) : (
                      <Play className={`w-4 h-4 ${isUser ? "text-black" : "text-white"}`} />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className={`h-2 rounded-full overflow-hidden ${isUser ? "bg-black/10" : "bg-white/10"}`}>
                      <div
                        className={`h-full ${isUser ? "bg-black/40" : "bg-white/40"} ${isPlaying ? "animate-pulse" : ""}`}
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
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/20">
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            {message.pdfId && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>PDF Reference</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {isUser && getMessageIcon()}
    </div>
  );
}
