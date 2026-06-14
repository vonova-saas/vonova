export type LessonCompletionRequirements = {
  requiresVideoWatch: boolean;
  requiresSheetCompletion: boolean;
  requiresQuizPass: boolean;
  requiresMaterialView: boolean;
  minimumWatchPercentage?: number;
  requiredSheetIds?: string[];
  requiredQuizIds?: string[];
  requiredMaterialIds?: string[];
};

export type LessonProgressionState = {
  watchedPercentage: number;
  canMarkComplete: boolean;
  hasVideo: boolean;
  watchThreshold: number;
  completed: boolean;
  accessible: boolean;
  locked: boolean;
  computedCompletionRequirements: LessonCompletionRequirements;
};
