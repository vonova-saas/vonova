"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface VoiceRecorderResult {
  blob: Blob;
  duration: number;
  mimeType: string;
}

interface VoiceRecorderProps {
  disabled?: boolean;
  onSend: (result: VoiceRecorderResult) => void | Promise<void>;
}

/**
 * A self-contained voice recorder using MediaRecorder.
 *
 * Designed to feel like Telegram / WhatsApp:
 *  - press the mic to record
 *  - the bar shows elapsed time + a faint live amplitude (analyser)
 *  - send delivers the blob to the parent which is responsible for uploading
 */
export function VoiceRecorder({ disabled, onSend }: VoiceRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "paused" | "preview">(
    "idle",
  );
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const mimeRef = useRef<string>("audio/webm");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const levelPulseRef = useRef<HTMLSpanElement>(null);
  const levelMeterFillRef = useRef<HTMLDivElement>(null);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  useEffect(() => {
    return () => {
      cleanup();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    if (typeof window === "undefined") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const preferred = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) =>
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(m),
      );
      mimeRef.current = preferred ?? "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mimeRef.current });
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        blobRef.current = blob;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
        setState("preview");
        cleanup();
      };
      recorder.start();
      recorderRef.current = recorder;

      // Live amplitude meter (cheap visual feedback).
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyserRef.current = analyser;
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(buf);
          const sum = buf.reduce((a, b) => a + b, 0) / buf.length;
          setLevel(Math.min(1, sum / 128));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // Visualisation is optional — recording continues without it.
      }

      setDuration(0);
      setState("recording");
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error("[VoiceRecorder] mic permission denied", err);
    }
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const togglePause = () => {
    const rec = recorderRef.current;
    if (!rec) return;
    if (rec.state === "recording") {
      rec.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setState("paused");
    } else if (rec.state === "paused") {
      rec.resume();
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      setState("recording");
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    blobRef.current = null;
    setDuration(0);
    setState("idle");
  };

  const send = async () => {
    if (!blobRef.current) return;
    setSubmitting(true);
    try {
      await onSend({
        blob: blobRef.current,
        duration,
        mimeType: mimeRef.current,
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  useLayoutEffect(() => {
    if (state === "preview") return;
    const pulse = levelPulseRef.current;
    const fill = levelMeterFillRef.current;
    if (pulse) {
      pulse.style.transform = `scale(${1 + level * 0.6})`;
    }
    if (fill) {
      fill.style.width = `${Math.min(100, level * 130)}%`;
    }
  }, [level, state]);

  if (state === "idle") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={start}
        aria-label="Record voice message"
        className="shrink-0"
      >
        <Mic className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-2 rounded-full border bg-card px-3 py-1.5",
      )}
    >
      {state === "preview" && previewUrl ? (
        <>
          <audio src={previewUrl} controls className="h-8 w-full" />
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatDuration(duration)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={reset}
            aria-label="Discard recording"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            onClick={send}
            disabled={submitting}
            aria-label="Send voice"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <span
            ref={levelPulseRef}
            className={cn(
              "inline-block h-3 w-3 rounded-full transition-transform",
              state === "recording" ? "bg-rose-500" : "bg-amber-500",
            )}
          />
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                ref={levelMeterFillRef}
                className="h-full rounded-full bg-violet-500/70"
              />
            </div>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatDuration(duration)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={togglePause}
            aria-label={state === "paused" ? "Resume" : "Pause"}
          >
            {state === "paused" ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={stop}
            aria-label="Stop recording"
          >
            <Square className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
