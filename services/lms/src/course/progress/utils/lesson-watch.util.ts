export type WatchedSegment = { start: number; end: number };

export const LESSON_WATCH_COMPLETE_THRESHOLD = 90;

/** Merge overlapping/adjacent watched intervals. */
export function mergeWatchedSegments(
  segments: WatchedSegment[],
): WatchedSegment[] {
  const sorted = segments
    .filter(
      (s) =>
        Number.isFinite(s.start) &&
        Number.isFinite(s.end) &&
        s.end > s.start,
    )
    .sort((a, b) => a.start - b.start);

  if (sorted.length === 0) return [];

  const merged: WatchedSegment[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    if (cur.start <= last.end + 0.5) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

export function watchedSecondsFromSegments(segments: WatchedSegment[]): number {
  return mergeWatchedSegments(segments).reduce(
    (sum, s) => sum + (s.end - s.start),
    0,
  );
}

export function computeWatchedPercentage(
  segments: WatchedSegment[],
  durationSec: number,
): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  const watched = watchedSecondsFromSegments(segments);
  return Math.min(100, Math.round((watched / durationSec) * 100));
}

/**
 * Append playback progress; ignores large forward seeks (anti skip-to-end).
 */
export function appendWatchSegment(
  existing: WatchedSegment[],
  currentTime: number,
  durationSec: number,
  maxJumpSec = 12,
): WatchedSegment[] {
  const t = Math.max(0, currentTime);
  const duration = Math.max(0, durationSec);
  if (duration <= 0 || t <= 0) return existing;

  const merged = mergeWatchedSegments(existing);
  const maxEnd =
    merged.length > 0 ? Math.max(...merged.map((s) => s.end)) : 0;

  if (t > maxEnd + maxJumpSec) {
    return merged;
  }

  if (t <= maxEnd + 0.25) {
    return merged;
  }

  const start = Math.max(0, maxEnd);
  const end = Math.min(duration, t);
  if (end <= start) return merged;

  return mergeWatchedSegments([...merged, { start, end }]);
}
