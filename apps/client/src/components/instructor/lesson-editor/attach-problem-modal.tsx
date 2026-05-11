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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getInstructorProblemsQueryFn,
  instructorLessonEditorProblemsQueryKey,
} from "@/services/instructor/lms/problem-solving/problem-solving.api";
import { attachLessonProblemMutationFn } from "@/services/instructor/lesson-resources.api";
import { toast } from "sonner";
import { coursesKeys } from "@/hooks/student/lms/use-courses";
import { Code2, Loader2, Plus, Search, Sparkles, Tag } from "lucide-react";
import { InlineCreateProblemForm } from "./inline-create-problem-form";
import { getErrorMessageFromUnknown } from "@/lib/utils/error-message";
import {
  DifficultyBadge,
  ResourceListSkeleton,
} from "./resource-primitives";

type AttachProblemModalProps = {
  courseId: string;
  chapterId: string;
  lessonId: string;
  attachedIds: Set<string>;
  /** Deep link to Problem Solving Management (kept as a fallback for legacy callers). */
  problemsHref?: string;
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

export function AttachProblemModal({
  courseId,
  chapterId,
  lessonId,
  attachedIds,
  problemsHref,
  triggerLabel = "Add problem",
  triggerVariant = "secondary",
  triggerSize = "sm",
}: AttachProblemModalProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("existing");
  const [q, setQ] = useState("");

  const { data: problems = [], isLoading } = useQuery({
    queryKey: instructorLessonEditorProblemsQueryKey,
    queryFn: getInstructorProblemsQueryFn,
    enabled: open && tab === "existing",
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(problems) ? problems : [];
    const needle = q.trim().toLowerCase();
    return list.filter((p) => {
      if (attachedIds.has(p._id)) return false;
      if (!needle) return true;
      return (
        p.title.toLowerCase().includes(needle) ||
        p.functionName.toLowerCase().includes(needle)
      );
    });
  }, [problems, q, attachedIds]);

  const invalidateAll = () => {
    void qc.invalidateQueries({
      queryKey: ["lesson", courseId, chapterId, lessonId],
    });
    void qc.invalidateQueries({ queryKey: ["lesson-resources", lessonId] });
    void qc.invalidateQueries({
      queryKey: instructorLessonEditorProblemsQueryKey,
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
    mutationFn: (problemId: string) => {
      const guard = guardIds();
      if (guard) return Promise.reject(new Error(guard));
      return attachLessonProblemMutationFn(courseId, lessonId, problemId);
    },
    onSuccess: () => {
      toast.success("Problem attached");
      invalidateAll();
      setOpen(false);
    },
    onError: (e: unknown) => {
      const msg = getErrorMessageFromUnknown(e);
      console.error("Attach problem failed", {
        url: `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/problems`,
        message: msg,
        error: e,
      });
      toast.error(`Attach failed: ${msg}`);
    },
  });

  const attachAfterCreate = useMutation({
    mutationFn: (problemId: string) => {
      const guard = guardIds();
      if (guard) return Promise.reject(new Error(guard));
      return attachLessonProblemMutationFn(courseId, lessonId, problemId);
    },
    onSuccess: () => {
      toast.success("Problem created and attached");
      invalidateAll();
      setOpen(false);
    },
    onError: (e: unknown) => {
      const msg = getErrorMessageFromUnknown(e);
      console.error("Attach (after create) problem failed", {
        url: `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/problems`,
        message: msg,
        error: e,
      });
      toast.error(
        `Created, but attach failed: ${msg}. Open Problem Solving Management to retry the attach.`,
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
        className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-3xl overflow-y-auto p-0"
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader className="space-y-2 border-b bg-linear-to-br from-emerald-500/10 via-background to-background px-5 py-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              aria-hidden
            >
              <Code2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold">
                Add coding problem to this lesson
              </DialogTitle>
              <DialogDescription className="text-xs">
                Attach a hands-on practice problem. Students get an in-lesson
                IDE with starter code and tests.
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
                placeholder="Search title or function…"
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
                    No problems available to attach
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
                    {problemsHref ? (
                      <>
                        {" "}
                        Or open the full{" "}
                        <a
                          href={problemsHref}
                          className="underline underline-offset-4"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Problem Solving Management
                        </a>
                        .
                      </>
                    ) : null}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((p) => (
                    <li
                      key={p._id}
                      className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          aria-hidden
                        >
                          <Code2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {p.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <DifficultyBadge value={p.difficulty} />
                            <Badge
                              variant="secondary"
                              className="rounded-full px-2 py-0 font-mono text-[10px]"
                            >
                              {p.functionName}()
                            </Badge>
                            {p.categories?.slice(0, 2).map((cat) => (
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
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => attachExisting.mutate(p._id)}
                      >
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
                  ))}
                </ul>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              The new problem is created and immediately attached to this lesson. A
              <code className="mx-1 rounded bg-muted px-1">scope.courseId</code>
              hint is sent so the backend can lock it to this course once that
              feature ships.
            </p>
            <InlineCreateProblemForm
              courseId={courseId}
              lessonId={lessonId}
              onCancel={() => setOpen(false)}
              onCreated={(created) => attachAfterCreate.mutate(created.id)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
