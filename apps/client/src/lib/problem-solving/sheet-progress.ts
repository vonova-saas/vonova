const STORAGE_PREFIX = "problem-sheet-progress:";

export type SheetProgressState = {
  currentIndex: number;
  lastVisitedAt: string;
};

export function sheetProgressKey(sheetId: string) {
  return `${STORAGE_PREFIX}${sheetId}`;
}

export function readSheetProgress(sheetId: string): SheetProgressState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(sheetProgressKey(sheetId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SheetProgressState;
    if (typeof parsed.currentIndex !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSheetProgress(sheetId: string, currentIndex: number) {
  if (typeof window === "undefined") return;
  const state: SheetProgressState = {
    currentIndex,
    lastVisitedAt: new Date().toISOString(),
  };
  localStorage.setItem(sheetProgressKey(sheetId), JSON.stringify(state));
}

export function sheetProblemPath(
  userId: string,
  sheetId: string,
  problemId: string,
  index: number,
) {
  const params = new URLSearchParams({
    sheetId,
    qIndex: String(index),
  });
  return `/student/${userId}/problem-solving/${problemId}?${params.toString()}`;
}
