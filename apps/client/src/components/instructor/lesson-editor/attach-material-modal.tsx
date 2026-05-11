"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchInstructorLessonEditorLibraryQueryFn,
  instructorLessonEditorLibraryQueryKey,
  type InstructorLibraryEditorRow,
} from "@/services/api/shared/material-library/material.api";
import { attachLessonMaterialMutationFn } from "@/services/instructor/lesson-resources.api";
import { toast } from "sonner";
import { coursesKeys } from "@/hooks/student/lms/use-courses";
import {
  BookOpen,
  ImageIcon,
  Loader2,
  Plus,
  Presentation,
  Search,
  Sparkles,
  FileText,
} from "lucide-react";
import { InlineCreateMaterialForm } from "./inline-create-material-form";
import { getErrorMessageFromUnknown } from "@/lib/utils/error-message";
import { ResourceListSkeleton, VisibilityBadge } from "./resource-primitives";
import { cn } from "@/lib/utils";

type AttachMaterialModalProps = {
  courseId: string;
  chapterId: string;
  lessonId: string;
  attachedIds: Set<string>;
  /** Deep link to the Material Library (kept as a fallback for legacy callers). */
  libraryHref?: string;
  triggerLabel?: string;
  triggerVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  triggerSize?: "default" | "sm" | "lg" | "icon";
};

type Tab = "existing" | "create";

export function AttachMaterialModal({
  courseId,
  chapterId,
  lessonId,
  attachedIds,
  libraryHref,
  triggerLabel = "Add material",
  triggerVariant = "secondary",
  triggerSize = "sm",
}: AttachMaterialModalProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("existing");
  const [q, setQ] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: instructorLessonEditorLibraryQueryKey,
    queryFn: fetchInstructorLessonEditorLibraryQueryFn,
    enabled: open && tab === "existing",
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    const needle = q.trim().toLowerCase();
    return list.filter((r) => {
      if (attachedIds.has(r._id)) return false;
      if (!needle) return true;
      return r.title.toLowerCase().includes(needle);
    });
  }, [rows, q, attachedIds]);

  const invalidateAll = () => {
    void qc.invalidateQueries({
      queryKey: ["lesson", courseId, chapterId, lessonId],
    });
    void qc.invalidateQueries({ queryKey: ["lesson-resources", lessonId] });
    void qc.invalidateQueries({
      queryKey: instructorLessonEditorLibraryQueryKey,
    });
    void qc.invalidateQueries({
      queryKey: coursesKeys.contentTree(courseId),
    });
    void qc.invalidateQueries({ queryKey: ["course-content", courseId] });
  };

  const guardIds = (): string | null => {
    if (!courseId) return "Missing courseId — refresh the page and try again.";
    if (!lessonId) return "Missing lessonId — open the lesson page directly and try again.";
    return null;
  };

  const attachExisting = useMutation({
    mutationFn: (row: InstructorLibraryEditorRow) => {
      const guard = guardIds();
      if (guard) return Promise.reject(new Error(guard));
      return attachLessonMaterialMutationFn(courseId, lessonId, {
        materialId: row._id,
        materialType: row.viewType,
      });
    },
    onSuccess: () => {
      toast.success("Material attached");
      invalidateAll();
      setOpen(false);
    },
    onError: (e: unknown) => {
      const msg = getErrorMessageFromUnknown(e);
      console.error("Attach material failed", {
        url: `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/materials`,
        message: msg,
        error: e,
      });
      toast.error(`Attach failed: ${msg}`);
    },
  });

  const attachAfterCreate = useMutation({
    mutationFn: (created: {
      id: string;
      viewType: "book" | "guide" | "presentation";
    }) => {
      const guard = guardIds();
      if (guard) return Promise.reject(new Error(guard));
      return attachLessonMaterialMutationFn(courseId, lessonId, {
        materialId: created.id,
        materialType: created.viewType,
      });
    },
    onSuccess: () => {
      toast.success("Material created and attached");
      invalidateAll();
      setOpen(false);
    },
    onError: (e: unknown) => {
      const msg = getErrorMessageFromUnknown(e);
      console.error("Attach (after create) material failed", {
        url: `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/materials`,
        message: msg,
        error: e,
      });
      toast.error(
        `Created, but attach failed: ${msg}. Open the material library to retry the attach.`,
      );
    },
  });

  const busy = attachExisting.isPending || attachAfterCreate.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy && !next) return;
        setOpen(next);
        if (next) {
          setTab("existing");
          setQ("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size={triggerSize} variant={triggerVariant}>
          <Plus className="mr-1 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto p-0"
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader className="space-y-2 border-b bg-linear-to-br from-sky-500/10 via-background to-background px-5 py-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400"
              aria-hidden
            >
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold">
                Add material to this lesson
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pick a published item from your library or create a new one
                without leaving the page.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          className="w-full px-5 pb-5"
        >
          <TabsList className="mt-4 grid w-full grid-cols-2">
            <TabsTrigger value="existing">Pick existing</TabsTrigger>
            <TabsTrigger value="create">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Create new
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[360px] pr-3">
              {isLoading ? (
                <ResourceListSkeleton rows={4} />
              ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center">
                  <p className="text-sm font-medium">
                    No materials available to attach
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                    Switch to{" "}
                    <button
                      type="button"
                      className="font-medium text-primary underline underline-offset-4"
                      onClick={() => setTab("create")}
                    >
                      Create new
                    </button>{" "}
                    to add one inline.
                    {libraryHref ? (
                      <>
                        {" "}
                        Or open the full{" "}
                        <a
                          href={libraryHref}
                          className="underline underline-offset-4"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Material Library
                        </a>
                        .
                      </>
                    ) : null}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((row) => (
                    <ExistingMaterialRow
                      key={row._id}
                      row={row}
                      busy={busy}
                      onAttach={() => attachExisting.mutate(row)}
                    />
                  ))}
                </ul>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              The new material is created and immediately attached to this lesson. A
              <code className="mx-1 rounded bg-muted px-1">scope.courseId</code>
              hint is sent so the backend can lock it to this course once that
              feature ships.
            </p>
            <InlineCreateMaterialForm
              courseId={courseId}
              lessonId={lessonId}
              onCancel={() => setOpen(false)}
              onCreated={(created) =>
                attachAfterCreate.mutate({
                  id: created.id,
                  viewType: created.viewType,
                })
              }
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

const ROW_TYPE_ICON: Record<
  InstructorLibraryEditorRow["viewType"],
  typeof BookOpen
> = {
  book: BookOpen,
  guide: ImageIcon,
  presentation: Presentation,
};

const ROW_TYPE_LABEL: Record<InstructorLibraryEditorRow["viewType"], string> = {
  book: "Book",
  guide: "Guide",
  presentation: "Slides",
};

const ROW_TYPE_TINT: Record<InstructorLibraryEditorRow["viewType"], string> = {
  book: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
  guide:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  presentation:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25",
};

function ExistingMaterialRow({
  row,
  busy,
  onAttach,
}: {
  row: InstructorLibraryEditorRow;
  busy: boolean;
  onAttach: () => void;
}) {
  const Icon = ROW_TYPE_ICON[row.viewType] ?? BookOpen;
  return (
    <li className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            ROW_TYPE_TINT[row.viewType] ??
              "bg-muted text-foreground border-border",
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border bg-background px-2 py-0 text-[10px] font-medium text-muted-foreground">
              {ROW_TYPE_LABEL[row.viewType] ?? "Material"}
            </span>
            <VisibilityBadge value={row.visibility ?? "PRIVATE"} />
          </div>
        </div>
      </div>
      <Button size="sm" disabled={busy} onClick={onAttach}>
        {busy ? (
          <>
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            Attaching
          </>
        ) : (
          "Attach"
        )}
      </Button>
    </li>
  );
}
