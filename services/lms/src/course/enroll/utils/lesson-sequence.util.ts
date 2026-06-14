import { Types } from 'mongoose';

export type OrderedLessonRef = {
  id: string;
  chapterId: string;
  previewable: boolean;
};

export type ChapterLessonTree = {
  id: string;
  index: number;
  lessons: Array<{
    id: string;
    previewable: boolean;
    [key: string]: unknown;
  }>;
};

/**
 * Flat lesson order: chapter index ascending, then lesson index within chapter.
 */
export function flattenLessonOrder(chapters: ChapterLessonTree[]): string[] {
  const sortedChapters = [...chapters].sort((a, b) => a.index - b.index);
  const ids: string[] = [];
  for (const ch of sortedChapters) {
    const lessons = [...ch.lessons].sort(
      (a, b) =>
        Number((a as { index?: number }).index ?? 0) -
        Number((b as { index?: number }).index ?? 0),
    );
    for (const l of lessons) {
      ids.push(String(l.id));
    }
  }
  return ids;
}

export function isLessonUnlockedInSequence(
  lessonId: string,
  flatOrder: string[],
  completedIds: Set<string>,
  previewable: boolean,
): boolean {
  if (previewable) return true;
  const idx = flatOrder.indexOf(String(lessonId));
  if (idx < 0) return false;
  if (idx === 0) return true;
  return completedIds.has(flatOrder[idx - 1]);
}

export function isChapterUnlocked(
  chapterIndex: number,
  chapters: ChapterLessonTree[],
  completedIds: Set<string>,
): boolean {
  if (chapterIndex <= 0) return true;
  const sorted = [...chapters].sort((a, b) => a.index - b.index);
  const prev = sorted[chapterIndex - 1];
  if (!prev) return true;
  return prev.lessons.every((l) => completedIds.has(String(l.id)));
}

export function matchCourseIdFilter(
  courseOid: Types.ObjectId,
  courseIdStr: string,
): { $or: Array<{ courseId: Types.ObjectId } | { courseId: string }> } {
  return {
    $or: [{ courseId: courseOid }, { courseId: courseIdStr }],
  };
}
