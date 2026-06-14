"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  usePatchSheetProgressMutation,
  useSheetProgressQuery,
} from "./use-problem-solving";
import { writeSheetProgress } from "@/lib/problem-solving/sheet-progress";

const PROGRESS_DEBOUNCE_MS = 2000;

/**
 * Server-backed sheet resume index with localStorage fallback.
 * Progress PATCH is debounced to avoid chatter during navigation.
 */
export function useSheetProgress(sheetId: string) {
  const { data: serverProgress } = useSheetProgressQuery(sheetId);
  const patchProgress = usePatchSheetProgressMutation();
  const patchMutateRef = useRef(patchProgress.mutate);
  patchMutateRef.current = patchProgress.mutate;

  const [currentIndex, setCurrentIndexState] = useState(0);
  const pendingIndexRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedServerIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (serverProgress == null) return;
    const serverIndex = serverProgress.currentProblemIndex ?? 0;
    if (lastSyncedServerIndexRef.current === serverIndex) return;
    lastSyncedServerIndexRef.current = serverIndex;
    setCurrentIndexState(serverIndex);
    writeSheetProgress(sheetId, serverIndex);
  }, [serverProgress, sheetId]);

  const flushProgress = useCallback(() => {
    if (!sheetId || pendingIndexRef.current === null) return;
    const index = pendingIndexRef.current;
    pendingIndexRef.current = null;
    patchMutateRef.current({ sheetId, currentProblemIndex: index });
  }, [sheetId]);

  const scheduleProgressPatch = useCallback(
    (index: number) => {
      pendingIndexRef.current = index;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        flushProgress();
      }, PROGRESS_DEBOUNCE_MS);
    },
    [flushProgress],
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushProgress();
      }
    };
    const onPageHide = () => flushProgress();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      flushProgress();
    };
  }, [flushProgress]);

  const setCurrentIndex = useCallback(
    (index: number) => {
      let changed = false;
      setCurrentIndexState((prev) => {
        changed = prev !== index;
        return changed ? index : prev;
      });
      writeSheetProgress(sheetId, index);
      if (sheetId && changed) {
        scheduleProgressPatch(index);
      }
    },
    [sheetId, scheduleProgressPatch],
  );

  return {
    currentIndex,
    setCurrentIndex,
    serverProgress,
  };
}
