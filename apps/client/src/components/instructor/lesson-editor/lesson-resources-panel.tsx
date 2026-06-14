"use client";

import { useUserId } from "@/hooks";
import type { Lesson } from "@/types/api/lms/courses.type";
import { LessonMaterialsList } from "./lesson-materials-list";
import { LessonQuizzesList } from "./lesson-quizzes-list";
import { LessonProblemsList } from "./lesson-problems-list";
import { LessonSheetsList } from "./lesson-sheets-list";
import { Badge } from "@/components/ui/badge";
import { Layers3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  instructorProblemSolvingKeys,
} from "@/hooks/instructor/use-problem-solving-management";
import { getInstructorProblemSheetsQueryFn } from "@/services/instructor/lms/problem-solving/problem-solving.api";

type LessonResourcesPanelProps = {
  courseId: string;
  chapterId: string;
  lesson: Lesson;
};

export function LessonResourcesPanel({
  courseId,
  chapterId,
  lesson,
}: LessonResourcesPanelProps) {
  const userId = useUserId();
  const libraryHref = userId
    ? `/instructor/${userId}/material-library-management`
    : "/instructor";
  const quizzesHref = userId
    ? `/instructor/${userId}/quiz-managment`
    : "/instructor";
  const problemsHref = userId
    ? `/instructor/${userId}/problem-solving-management`
    : "/instructor";

  // Query problem sheets to count those attached to this lesson
  const { data: sheets = [] } = useQuery({
    queryKey: instructorProblemSolvingKeys.sheets(),
    queryFn: getInstructorProblemSheetsQueryFn,
  });

  const attachedSheetsCount = useMemo(() => {
    const list = Array.isArray(sheets) ? sheets : [];
    return list.filter((s) => String(s.lessonId ?? "") === String(lesson._id)).length;
  }, [sheets, lesson._id]);

  const totalResources =
    (lesson.materials?.length ?? 0) +
    (lesson.quizzes?.length ?? 0) +
    (lesson.problems?.length ?? 0) +
    attachedSheetsCount;

  return (
    <section
      aria-label="Lesson resources"
      className="mt-6 space-y-4"
    >
      <header className="rounded-2xl border border-border/60 bg-linear-to-br from-primary/8 via-background to-violet-500/5 p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
              <Layers3 className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                Lesson resources
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Add materials, quizzes, coding problems, and problem sheets. Each{" "}
                <span className="font-medium text-foreground">Add</span> button
                opens a dialog with two tabs:{" "}
                <span className="font-medium text-foreground">Pick existing</span>{" "}
                or{" "}
                <span className="font-medium text-foreground">Create new</span>.
                Drag any attached item to reorder (for materials, quizzes, and problems) — changes save automatically.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <Badge
              variant="secondary"
              className="h-7 rounded-full px-3 text-xs font-semibold tabular-nums"
            >
              {totalResources} total
            </Badge>
            <Badge
              variant="outline"
              className="h-7 rounded-full border-sky-500/30 bg-sky-500/10 px-2.5 text-[11px] font-medium text-sky-600 dark:text-sky-400"
            >
              Materials ({lesson.materials?.length ?? 0})
            </Badge>
            <Badge
              variant="outline"
              className="h-7 rounded-full border-violet-500/30 bg-violet-500/10 px-2.5 text-[11px] font-medium text-violet-600 dark:text-violet-400"
            >
              Quizzes ({lesson.quizzes?.length ?? 0})
            </Badge>
            <Badge
              variant="outline"
              className="h-7 rounded-full border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
            >
              Problems ({lesson.problems?.length ?? 0})
            </Badge>
            <Badge
              variant="outline"
              className="h-7 rounded-full border-indigo-500/30 bg-indigo-500/10 px-2.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400"
            >
              Sheets ({attachedSheetsCount})
            </Badge>
          </div>
        </div>
      </header>

      <LessonMaterialsList
        courseId={courseId}
        chapterId={chapterId}
        lesson={lesson}
        libraryHref={libraryHref}
      />
      <LessonQuizzesList
        courseId={courseId}
        chapterId={chapterId}
        lesson={lesson}
        quizzesHref={quizzesHref}
      />
      <LessonProblemsList
        courseId={courseId}
        chapterId={chapterId}
        lesson={lesson}
        problemsHref={problemsHref}
      />
      <LessonSheetsList
        courseId={courseId}
        chapterId={chapterId}
        lesson={lesson}
        sheetsHref={problemsHref}
      />
    </section>
  );
}
