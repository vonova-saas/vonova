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
import { AttachProblemModal } from "./attach-problem-modal";
import {
  detachLessonProblemMutationFn,
  reorderLessonProblemsMutationFn,
} from "@/services/instructor/lesson-resources.api";
import {
  getInstructorProblemsQueryFn,
  instructorLessonEditorProblemsQueryKey,
} from "@/services/instructor/lms/problem-solving/problem-solving.api";
import type { Lesson } from "@/types/api/lms/courses.type";
import type { InstructorProblemEntity } from "@/types/api/instructor/lms/problem-solving/problem-solving.type";
import { toast } from "sonner";
import { coursesKeys } from "@/hooks/student/lms/use-courses";
import { Code2, Trash2, Eye, Tag } from "lucide-react";
import {
  DifficultyBadge,
  ResourceEmptyState,
  ResourceSectionCard,
} from "./resource-primitives";

type LessonProblemsListProps = {
  courseId: string;
  chapterId: string;
  lesson: Lesson;
  problemsHref?: string;
};

export function LessonProblemsList({
  courseId,
  chapterId,
  lesson,
  problemsHref,
}: LessonProblemsListProps) {
  const qc = useQueryClient();
  const lessonId = lesson._id;
  const ids = lesson.problems ?? [];

  const { data: problemById = {} } = useQuery({
    queryKey: instructorLessonEditorProblemsQueryKey,
    queryFn: getInstructorProblemsQueryFn,
    select: (data) => {
      const list = Array.isArray(data) ? data : [];
      const map: Record<string, InstructorProblemEntity> = {};
      for (const p of list) map[p._id] = p;
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
    mutationFn: (orderedProblemIds: string[]) =>
      reorderLessonProblemsMutationFn(courseId, lessonId, orderedProblemIds),
    onMutate: async (orderedProblemIds) => {
      await qc.cancelQueries({ queryKey: lessonKey });
      const prev = qc.getQueryData<Lesson>(lessonKey);
      qc.setQueryData<Lesson>(lessonKey, (old) =>
        old ? { ...old, problems: orderedProblemIds } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(lessonKey, ctx.prev);
      toast.error("Could not reorder problems");
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
    mutationFn: (problemId: string) =>
      detachLessonProblemMutationFn(courseId, lessonId, problemId),
    onMutate: async (problemId) => {
      await qc.cancelQueries({ queryKey: lessonKey });
      const prev = qc.getQueryData<Lesson>(lessonKey);
      qc.setQueryData<Lesson>(lessonKey, (old) =>
        old
          ? {
              ...old,
              problems: (old.problems ?? []).filter((id) => id !== problemId),
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(lessonKey, ctx.prev);
      toast.error("Could not detach problem");
    },
    onSuccess: () => toast.success("Problem removed"),
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
      icon={<Code2 className="h-5 w-5" aria-hidden />}
      title="Coding problems"
      description="Hands-on practice problems from your Problem Solving Management. Reorder to set the recommended path."
      count={ids.length}
      badgeColor="emerald"
      saving={saving}
      saved={!saving && saved}
      action={
        <AttachProblemModal
          courseId={courseId}
          chapterId={chapterId}
          lessonId={lessonId}
          attachedIds={attachedSet}
          problemsHref={problemsHref}
        />
      }
    >
      {ids.length === 0 ? (
        <ResourceEmptyState
          icon={<Code2 className="h-6 w-6 text-muted-foreground" />}
          title="No coding problems attached yet"
          description="Add a hands-on coding challenge so students can practice what they just learned."
          action={
            <AttachProblemModal
              courseId={courseId}
              chapterId={chapterId}
              lessonId={lessonId}
              attachedIds={attachedSet}
              problemsHref={problemsHref}
              triggerLabel="Add your first problem"
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
                const p = problemById[id];
                const categories = Array.isArray(p?.categories)
                  ? p?.categories.slice(0, 3)
                  : [];
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
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            aria-hidden
                          >
                            <Code2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {p?.title ?? id}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <DifficultyBadge value={p?.difficulty} />
                              {p?.functionName ? (
                                <Badge
                                  variant="secondary"
                                  className="rounded-full px-2 py-0 font-mono text-[10px]"
                                >
                                  {p.functionName}()
                                </Badge>
                              ) : null}
                              {categories?.map((cat) => (
                                <Badge
                                  key={cat}
                                  variant="outline"
                                  className="rounded-full px-2 py-0 text-[10px]"
                                >
                                  <Tag className="mr-1 h-3 w-3" />
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          {problemsHref ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                                  asChild
                                  aria-label="Preview problem"
                                >
                                  <a
                                    href={problemsHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Preview in Problem Solving
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
                                aria-label="Remove problem"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Detach problem</TooltipContent>
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
