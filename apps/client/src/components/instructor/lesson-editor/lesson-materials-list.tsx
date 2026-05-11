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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ResourceSortableItem } from "./resource-sortable-item";
import { AttachMaterialModal } from "./attach-material-modal";
import {
  detachLessonMaterialMutationFn,
  reorderLessonMaterialsMutationFn,
} from "@/services/instructor/lesson-resources.api";
import {
  fetchInstructorLessonEditorLibraryQueryFn,
  instructorLessonEditorLibraryQueryKey,
  updateLibraryMaterialVisibilityMutationFn,
  type InstructorLibraryEditorRow,
} from "@/services/api/shared/material-library/material.api";
import type { Lesson } from "@/types/api/lms/courses.type";
import { toast } from "sonner";
import { coursesKeys } from "@/hooks/student/lms/use-courses";
import { getErrorMessageFromUnknown } from "@/lib/utils/error-message";
import {
  BookOpen,
  FileText,
  ImageIcon,
  Presentation,
  Trash2,
  Eye,
  Lock,
  Loader2,
} from "lucide-react";
import {
  ResourceSectionCard,
  ResourceEmptyState,
  VisibilityBadge,
} from "./resource-primitives";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RowMeta = InstructorLibraryEditorRow;

type LessonMaterialsListProps = {
  courseId: string;
  chapterId: string;
  lesson: Lesson;
  libraryHref?: string;
};

const TYPE_ICON: Record<RowMeta["viewType"], typeof BookOpen> = {
  book: BookOpen,
  guide: ImageIcon,
  presentation: Presentation,
};

const TYPE_LABEL: Record<RowMeta["viewType"], string> = {
  book: "Book",
  guide: "Guide",
  presentation: "Slides",
};

const TYPE_TINT: Record<RowMeta["viewType"], string> = {
  book: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
  guide:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  presentation:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25",
};

export function LessonMaterialsList({
  courseId,
  chapterId,
  lesson,
  libraryHref,
}: LessonMaterialsListProps) {
  const qc = useQueryClient();
  const lessonId = lesson._id;
  const ids = lesson.materials ?? [];

  const { data: metaById = {} } = useQuery({
    queryKey: instructorLessonEditorLibraryQueryKey,
    queryFn: fetchInstructorLessonEditorLibraryQueryFn,
    select: (data) => {
      const rows = Array.isArray(data) ? data : [];
      const map: Record<string, RowMeta> = {};
      for (const row of rows) map[row._id] = row;
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
    mutationFn: (orderedMaterialIds: string[]) =>
      reorderLessonMaterialsMutationFn(courseId, lessonId, orderedMaterialIds),
    onMutate: async (orderedMaterialIds) => {
      await qc.cancelQueries({ queryKey: lessonKey });
      const prev = qc.getQueryData<Lesson>(lessonKey);
      qc.setQueryData<Lesson>(lessonKey, (old) =>
        old ? { ...old, materials: orderedMaterialIds } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(lessonKey, ctx.prev);
      toast.error("Could not reorder materials");
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

  const visibilityMutation = useMutation({
    mutationFn: (vars: {
      materialId: string;
      viewType: RowMeta["viewType"];
      visibility: "PUBLIC" | "PRIVATE";
    }) => updateLibraryMaterialVisibilityMutationFn(vars),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: instructorLessonEditorLibraryQueryKey });
      const prev = qc.getQueryData<InstructorLibraryEditorRow[]>(
        instructorLessonEditorLibraryQueryKey,
      );
      qc.setQueryData<InstructorLibraryEditorRow[]>(
        instructorLessonEditorLibraryQueryKey,
        (old) =>
          Array.isArray(old)
            ? old.map((row) =>
                row._id === vars.materialId
                  ? { ...row, visibility: vars.visibility }
                  : row,
              )
            : old,
      );
      return { prev };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(instructorLessonEditorLibraryQueryKey, ctx.prev);
      }
      toast.error(`Could not change visibility: ${getErrorMessageFromUnknown(e)}`);
    },
    onSuccess: (_data, vars) => {
      toast.success(
        vars.visibility === "PRIVATE"
          ? "Material is now private to this course"
          : "Material is now public",
      );
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: instructorLessonEditorLibraryQueryKey });
    },
  });

  const detach = useMutation({
    mutationFn: (materialId: string) =>
      detachLessonMaterialMutationFn(courseId, lessonId, materialId),
    onMutate: async (materialId) => {
      await qc.cancelQueries({ queryKey: lessonKey });
      const prev = qc.getQueryData<Lesson>(lessonKey);
      qc.setQueryData<Lesson>(lessonKey, (old) =>
        old
          ? {
              ...old,
              materials: (old.materials ?? []).filter((id) => id !== materialId),
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(lessonKey, ctx.prev);
      toast.error("Could not detach material");
    },
    onSuccess: () => toast.success("Material removed"),
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
      icon={<FileText className="h-5 w-5" aria-hidden />}
      title="Materials"
      description="PDFs, slides, cheat sheets, and other library content shown to students in this lesson."
      count={ids.length}
      badgeColor="sky"
      saving={saving}
      saved={!saving && saved}
      action={
        <AttachMaterialModal
          courseId={courseId}
          chapterId={chapterId}
          lessonId={lessonId}
          attachedIds={attachedSet}
          libraryHref={libraryHref}
        />
      }
    >
      {ids.length === 0 ? (
        <ResourceEmptyState
          icon={<FileText className="h-6 w-6 text-muted-foreground" />}
          title="No materials attached yet"
          description="Add PDFs, slides, cheat sheets, or downloadable resources for students in this lesson."
          action={
            <AttachMaterialModal
              courseId={courseId}
              chapterId={chapterId}
              lessonId={lessonId}
              attachedIds={attachedSet}
              libraryHref={libraryHref}
              triggerLabel="Add your first material"
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
                const meta = metaById[id];
                const viewType = meta?.viewType ?? "book";
                const Icon = TYPE_ICON[viewType] ?? BookOpen;
                const currentVisibility = meta?.visibility ?? "PUBLIC";
                const isPrivate = currentVisibility === "PRIVATE";
                const isToggling =
                  visibilityMutation.isPending &&
                  visibilityMutation.variables?.materialId === id;
                const nextVisibility: "PUBLIC" | "PRIVATE" = isPrivate
                  ? "PUBLIC"
                  : "PRIVATE";
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
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                              TYPE_TINT[viewType] ??
                                "bg-muted text-foreground border-border",
                            )}
                            aria-hidden
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {meta?.title ?? id}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="rounded-full px-2 py-0 text-[10px] font-medium"
                              >
                                {TYPE_LABEL[viewType] ?? "Material"}
                              </Badge>
                              <VisibilityBadge value={currentVisibility} />
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className={cn(
                                  "h-8 w-8 rounded-md",
                                  isPrivate
                                    ? "text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                                    : "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400",
                                )}
                                disabled={isToggling || !meta}
                                onClick={() =>
                                  visibilityMutation.mutate({
                                    materialId: id,
                                    viewType,
                                    visibility: nextVisibility,
                                  })
                                }
                                aria-label={
                                  isPrivate
                                    ? "Make material public"
                                    : "Make material private"
                                }
                              >
                                {isToggling ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isPrivate ? (
                                  <Lock className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isPrivate
                                ? "Private — only enrolled students see it. Click to make public."
                                : "Public — visible in the global library. Click to make private."}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-md text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                                disabled={detach.isPending}
                                onClick={() => detach.mutate(id)}
                                aria-label="Remove material"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Detach material</TooltipContent>
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
