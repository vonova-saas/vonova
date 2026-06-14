import { Injectable } from '@nestjs/common';
import { LESSON_WATCH_COMPLETE_THRESHOLD } from './utils/lesson-watch.util';

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

@Injectable()
export class LessonProgressionEngine {
  evaluateLessonCompletion(input: {
    watchedPercentage?: number | null;
    completed?: boolean | null;
    hasVideo?: boolean | null;
    accessible?: boolean | null;
    locked?: boolean | null;
    requiresSheetCompletion?: boolean | null;
    requiredSheetsCompleted?: boolean | null;
    requiresQuizPass?: boolean | null;
    requiredQuizPassed?: boolean | null;
    requiresMaterialView?: boolean | null;
    requiredMaterialsViewed?: boolean | null;
    watchThreshold?: number | null;
    minimumWatchPercentage?: number | null;
    requiredSheetIds?: string[] | null;
    completedSheetIds?: string[] | null;
    requiredQuizIds?: string[] | null;
    passedQuizIds?: string[] | null;
    requiredMaterialIds?: string[] | null;
    viewedMaterialIds?: string[] | null;
  }): LessonProgressionState {
    const hasVideo = input.hasVideo === true;
    const watchedPercentage = input.watchedPercentage ?? 0;
    const watchThreshold =
      input.minimumWatchPercentage ??
      input.watchThreshold ??
      LESSON_WATCH_COMPLETE_THRESHOLD;
    const requiredSheetIds = input.requiredSheetIds ?? [];
    const completedSheetIds = new Set(input.completedSheetIds ?? []);
    const requiredQuizIds = input.requiredQuizIds ?? [];
    const passedQuizIds = new Set(input.passedQuizIds ?? []);
    const requiredMaterialIds = input.requiredMaterialIds ?? [];
    const viewedMaterialIds = new Set(input.viewedMaterialIds ?? []);
    const requiresSheetCompletion =
      input.requiresSheetCompletion === true || requiredSheetIds.length > 0;
    const requiresQuizPass =
      input.requiresQuizPass === true || requiredQuizIds.length > 0;
    const requiresMaterialView =
      input.requiresMaterialView === true || requiredMaterialIds.length > 0;

    const videoSatisfied = !hasVideo || watchedPercentage >= watchThreshold;
    const sheetsSatisfied =
      !requiresSheetCompletion ||
      input.requiredSheetsCompleted === true ||
      requiredSheetIds.every((sheetId) => completedSheetIds.has(sheetId));
    const quizSatisfied =
      !requiresQuizPass ||
      input.requiredQuizPassed === true ||
      requiredQuizIds.every((quizId) => passedQuizIds.has(quizId));
    const materialsSatisfied =
      !requiresMaterialView ||
      input.requiredMaterialsViewed === true ||
      requiredMaterialIds.every((materialId) =>
        viewedMaterialIds.has(materialId),
      );

    return {
      watchedPercentage,
      canMarkComplete:
        videoSatisfied &&
        sheetsSatisfied &&
        quizSatisfied &&
        materialsSatisfied,
      hasVideo,
      watchThreshold,
      completed: input.completed === true,
      accessible: input.accessible !== false,
      locked: input.locked === true,
      computedCompletionRequirements: {
        requiresVideoWatch: hasVideo,
        requiresSheetCompletion,
        requiresQuizPass,
        requiresMaterialView,
        minimumWatchPercentage: watchThreshold,
        requiredSheetIds,
        requiredQuizIds,
        requiredMaterialIds,
      },
    };
  }

  evaluateChapterUnlock(previousChapterLessonCompleted: boolean): boolean {
    return previousChapterLessonCompleted;
  }

  evaluateCourseCompletion(input: {
    totalRequiredLessons: number;
    completedRequiredLessons: number;
  }): boolean {
    return (
      input.totalRequiredLessons > 0 &&
      input.completedRequiredLessons >= input.totalRequiredLessons
    );
  }

  evaluateCertificateEligibility(input: {
    allRequiredChaptersCompleted: boolean;
  }): boolean {
    return input.allRequiredChaptersCompleted;
  }
}
