"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AttachSheetModal } from "./attach-sheet-modal";
import {
  useInstructorProblemSheetsQuery,
  useUpdateInstructorProblemSheetMutation,
  instructorProblemSolvingKeys,
} from "@/hooks/instructor/use-problem-solving-management";
import { getInstructorProblemSheetsQueryFn } from "@/services/instructor/lms/problem-solving/problem-solving.api";
import type { Lesson } from "@/types/api/lms/courses.type";
import { toast } from "sonner";
import { coursesKeys } from "@/hooks/student/lms/use-courses";
import { FileSpreadsheet, Trash2, Eye, Calendar } from "lucide-react";
import { useUserId } from "@/hooks";
import {
  DifficultyBadge,
  ResourceEmptyState,
  ResourceSectionCard,
} from "./resource-primitives";

type LessonSheetsListProps = {
  courseId: string;
  chapterId: string;
  lesson: Lesson;
  sheetsHref?: string;
};

export function LessonSheetsList({
  courseId,
  chapterId,
  lesson,
  sheetsHref,
}: LessonSheetsListProps) {
  const qc = useQueryClient();
  const userId = useUserId();
  const lessonId = lesson._id;

  const { data: sheets = [], isLoading } = useQuery({
    queryKey: instructorProblemSolvingKeys.sheets(),
    queryFn: getInstructorProblemSheetsQueryFn,
  });

  // Filter sheets attached to this lesson
  const attachedSheets = useMemo(() => {
    const list = Array.isArray(sheets) ? sheets : [];
    return list.filter((s) => String(s.lessonId ?? "") === String(lessonId));
  }, [sheets, lessonId]);

  const attachedSet = useMemo(() => {
    return new Set(attachedSheets.map((s) => s._id));
  }, [attachedSheets]);

  const updateMutation = useUpdateInstructorProblemSheetMutation();

  const detach = useMutation({
    mutationFn: (sheetId: string) =>
      updateMutation.mutateAsync({
        sheetId,
        payload: {
          lessonId: null,
          courseId: null,
          chapterId: null,
        },
      }),
    onSuccess: () => {
      toast.success("Problem sheet detached");
      // Invalidate queries to refresh list
      void qc.invalidateQueries({
        queryKey: ["lesson", courseId, chapterId, lessonId],
      });
      void qc.invalidateQueries({ queryKey: ["lesson-resources", lessonId] });
      void qc.invalidateQueries({
        queryKey: instructorProblemSolvingKeys.sheets(),
      });
      void qc.invalidateQueries({
        queryKey: coursesKeys.contentTree(courseId),
      });
      void qc.invalidateQueries({ queryKey: ["course-content", courseId] });
    },
    onError: (e: unknown) => {
      toast.error("Could not detach problem sheet");
    },
  });

  const saving = detach.isPending;
  const saved = detach.isSuccess;

  return (
    <ResourceSectionCard
      icon={<FileSpreadsheet className="h-5 w-5" aria-hidden />}
      title="Problem sheets"
      description="Practice problem sheets from your Problem Solving Management containing multiple coding tasks."
      count={attachedSheets.length}
      badgeColor="violet"
      saving={saving}
      saved={!saving && saved}
      action={
        <AttachSheetModal
          courseId={courseId}
          chapterId={chapterId}
          lessonId={lessonId}
          attachedIds={attachedSet}
          sheetsHref={sheetsHref}
        />
      }
    >
      {attachedSheets.length === 0 ? (
        <ResourceEmptyState
          icon={<FileSpreadsheet className="h-6 w-6 text-muted-foreground" />}
          title="No problem sheets attached yet"
          description="Attach a problem sheet containing multiple coding tasks for structured student learning."
          action={
            <AttachSheetModal
              courseId={courseId}
              chapterId={chapterId}
              lessonId={lessonId}
              attachedIds={attachedSet}
              sheetsHref={sheetsHref}
              triggerLabel="Attach your first sheet"
              triggerVariant="default"
            />
          }
        />
      ) : (
        <ul className="space-y-2">
          {attachedSheets.map((s) => {
            const editorUrl = userId
              ? `/instructor/${userId}/problem-solving-management/sheets/${s._id}/editor`
              : null;

            return (
              <li key={s._id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/5">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                    aria-hidden
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {s.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <DifficultyBadge value={s.difficulty} />
                      <span className="text-xs text-muted-foreground">
                        {s.totalQuestions ?? s.problems?.length ?? 0} questions
                      </span>
                      {s.dueDate && (
                        <span className="inline-flex items-center text-xs text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          Due: {new Date(s.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {editorUrl ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                          asChild
                          aria-label="Edit sheet"
                        >
                          <a
                            href={editorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Edit sheet in Problem Solving
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-md text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                        disabled={detach.isPending}
                        onClick={() => detach.mutate(s._id)}
                        aria-label="Remove sheet"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Detach sheet</TooltipContent>
                  </Tooltip>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ResourceSectionCard>
  );
}
