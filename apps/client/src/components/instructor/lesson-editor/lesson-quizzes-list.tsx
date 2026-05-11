"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ResourceSortableItem } from "./resource-sortable-item";
import { AttachQuizModal } from "./attach-quiz-modal";
import {
  detachLessonQuizMutationFn,
  reorderLessonQuizzesMutationFn,
} from "@/services/instructor/lesson-resources.api";
import {
  fetchInstructorLessonEditorQuizzesQueryFn,
  instructorLessonEditorQuizzesQueryKey,
} from "@/services/student/lms/quizzes/quiz.api";
import type { Lesson } from "@/types/api/lms/courses.type";
import type { QuizType } from "@/types/api/student/lms/quizzes/quiz.type";
import { toast } from "sonner";
import { coursesKeys } from "@/hooks/student/lms/use-courses";
import { ClipboardCheck, Trash2, Eye, HelpCircle } from "lucide-react";
import {
  ResourceEmptyState,
  ResourceSectionCard,
  VisibilityBadge,
} from "./resource-primitives";

type LessonQuizzesListProps = {
  courseId: string;
  chapterId: string;
  lesson: Lesson;
  quizzesHref?: string;
};

function questionCount(q: QuizType | undefined): number | null {
  if (!q) return null;
  if (Array.isArray(q.questions)) return q.questions.length;
  const n = Number(q.noOfQuestions);
  return Number.isFinite(n) ? n : null;
}

export function LessonQuizzesList({
  courseId,
  chapterId,
  lesson,
  quizzesHref,
}: LessonQuizzesListProps) {
  const qc = useQueryClient();
  const lessonId = lesson._id;
  const ids = lesson.quizzes ?? [];

  const { data: quizById = {} } = useQuery({
    queryKey: instructorLessonEditorQuizzesQueryKey,
    queryFn: fetchInstructorLessonEditorQuizzesQueryFn,
    select: (data) => {
      const list = Array.isArray(data) ? data : [];
      const map: Record<string, QuizType> = {};
      for (const q of list) map[q._id] = q;
      return map;
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const lessonKey = useMemo(
    () => ["lesson", courseId, chapterId, lessonId] as const,
    [courseId, chapterId, lessonId],
  );

  const reorder = useMutation({
    mutationFn: (orderedQuizIds: string[]) =>
      reorderLessonQuizzesMutationFn(courseId, lessonId, orderedQuizIds),
    onMutate: async (orderedQuizIds) => {
      await qc.cancelQueries({ queryKey: lessonKey });
      const prev = qc.getQueryData<Lesson>(lessonKey);
      qc.setQueryData<Lesson>(lessonKey, (old) =>
        old
          ? { ...old, quizzes: orderedQuizIds, quizId: orderedQuizIds[0] ?? null }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(lessonKey, ctx.prev);
      toast.error("Could not reorder quizzes");
    },
    onSuccess: () => toast.success("Lesson resources reordered"),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: lessonKey });
      void qc.invalidateQueries({ queryKey: ["lesson-resources", lessonId] });
      void qc.invalidateQueries({ queryKey: ["course-content", courseId] });
      void qc.invalidateQueries({
        queryKey: coursesKeys.contentTree(courseId),
      });
    },
  });

  const detach = useMutation({
    mutationFn: (quizId: string) =>
      detachLessonQuizMutationFn(courseId, lessonId, quizId),
    onMutate: async (quizId) => {
      await qc.cancelQueries({ queryKey: lessonKey });
      const prev = qc.getQueryData<Lesson>(lessonKey);
      qc.setQueryData<Lesson>(lessonKey, (old) => {
        if (!old) return old;
        const next = (old.quizzes ?? []).filter((id) => id !== quizId);
        return {
          ...old,
          quizzes: next,
          quizId: next[0] ?? null,
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(lessonKey, ctx.prev);
      toast.error("Could not detach quiz");
    },
    onSuccess: () => toast.success("Quiz removed"),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: lessonKey });
      void qc.invalidateQueries({ queryKey: ["lesson-resources", lessonId] });
      void qc.invalidateQueries({ queryKey: ["course-content", courseId] });
      void qc.invalidateQueries({
        queryKey: coursesKeys.contentTree(courseId),
      });
    },
  });

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    reorder.mutate(next);
  };

  const attachedSet = useMemo(() => new Set(ids), [ids]);
  const saving = reorder.isPending || detach.isPending;
  const saved = reorder.isSuccess || detach.isSuccess;

  return (
    <ResourceSectionCard
      icon={<ClipboardCheck className="h-5 w-5" aria-hidden />}
      title="Quizzes"
      description="Knowledge checks students take inside this lesson. Reorder to control attempt order."
      count={ids.length}
      badgeColor="violet"
      saving={saving}
      saved={!saving && saved}
      action={
        <AttachQuizModal
          courseId={courseId}
          chapterId={chapterId}
          lessonId={lessonId}
          attachedIds={attachedSet}
          quizzesHref={quizzesHref}
        />
      }
    >
      {ids.length === 0 ? (
        <ResourceEmptyState
          icon={<ClipboardCheck className="h-6 w-6 text-muted-foreground" />}
          title="No quizzes attached yet"
          description="Add a knowledge check so students can self-assess after the lesson video or reading."
          action={
            <AttachQuizModal
              courseId={courseId}
              chapterId={chapterId}
              lessonId={lessonId}
              attachedIds={attachedSet}
              quizzesHref={quizzesHref}
              triggerLabel="Add your first quiz"
              triggerVariant="default"
            />
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {ids.map((id, idx) => {
                const q = quizById[id];
                const count = questionCount(q);
                return (
                  <li key={id}>
                    <ResourceSortableItem
                      id={id}
                      index={idx}
                      disabled={reorder.isPending || detach.isPending}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            aria-hidden
                          >
                            <ClipboardCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {q?.title ?? id}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {q?.topic ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-full px-2 py-0 text-[10px] font-medium"
                                >
                                  {q.topic}
                                </Badge>
                              ) : null}
                              {count != null ? (
                                <Badge
                                  variant="secondary"
                                  className="rounded-full px-2 py-0 text-[10px] font-medium"
                                >
                                  <HelpCircle className="mr-1 h-3 w-3" />
                                  {count}{" "}
                                  {count === 1 ? "question" : "questions"}
                                </Badge>
                              ) : null}
                              <VisibilityBadge
                                value={q?.visibility ?? "PRIVATE"}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          {quizzesHref ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                                  asChild
                                  aria-label="Preview quiz"
                                >
                                  <a
                                    href={quizzesHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Preview in Quiz Management
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
                                onClick={() => detach.mutate(id)}
                                aria-label="Remove quiz"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Detach quiz</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </ResourceSortableItem>
                  </li>
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </ResourceSectionCard>
  );
}
