import { LESSON_WATCH_COMPLETE_THRESHOLD } from "@/lib/lms/lesson-watch";
import type {
  LessonCompletionRequirements,
  LessonProgressionState,
} from "@/types/api/lms/progression.type";

export const DEFAULT_LESSON_COMPLETION_REQUIREMENTS: LessonCompletionRequirements = {
  requiresVideoWatch: false,
  requiresSheetCompletion: false,
  requiresQuizPass: false,
  requiresMaterialView: false,
  minimumWatchPercentage: LESSON_WATCH_COMPLETE_THRESHOLD,
  requiredSheetIds: [],
  requiredQuizIds: [],
  requiredMaterialIds: [],
};

export function normalizeLessonProgressionState(input: {
  watchedPercentage?: number | null;
  canMarkComplete?: boolean | null;
  hasVideo?: boolean | null;
  watchThreshold?: number | null;
  completed?: boolean | null;
  accessible?: boolean | null;
  locked?: boolean | null;
  computedCompletionRequirements?: Partial<LessonCompletionRequirements> | null;
}): LessonProgressionState {
  const hasVideo = input.hasVideo === true;
  const watchedPercentage =
    typeof input.watchedPercentage === "number" ? input.watchedPercentage : 0;
  const watchThreshold =
    typeof input.watchThreshold === "number"
      ? input.watchThreshold
      : LESSON_WATCH_COMPLETE_THRESHOLD;
  const computedCompletionRequirements = {
    ...DEFAULT_LESSON_COMPLETION_REQUIREMENTS,
    requiresVideoWatch: hasVideo,
    minimumWatchPercentage: watchThreshold,
    ...(input.computedCompletionRequirements ?? {}),
  };

  return {
    watchedPercentage,
    canMarkComplete:
      typeof input.canMarkComplete === "boolean"
        ? input.canMarkComplete
        : !hasVideo || watchedPercentage >= watchThreshold,
    hasVideo,
    watchThreshold,
    completed: input.completed === true,
    accessible: input.accessible !== false,
    locked: input.locked === true,
    computedCompletionRequirements,
  };
}
