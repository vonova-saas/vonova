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
  fetchInstructorLessonEditorQuizzesQueryFn,
  instructorLessonEditorQuizzesQueryKey,
} from "@/services/student/lms/quizzes/quiz.api";
import { attachLessonQuizMutationFn } from "@/services/instructor/lesson-resources.api";
import { toast } from "sonner";
import { coursesKeys } from "@/hooks/student/lms/use-courses";
import {
  ClipboardCheck,
  HelpCircle,
  Loader2,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { InlineCreateQuizForm } from "./inline-create-quiz-form";
import { getErrorMessageFromUnknown } from "@/lib/utils/error-message";
import { ResourceListSkeleton, VisibilityBadge } from "./resource-primitives";

type AttachQuizModalProps = {
  courseId: string;
  chapterId: string;
  lessonId: string;
  attachedIds: Set<string>;
  /** Deep link to Quiz Management (kept as a fallback for legacy callers). */
  quizzesHref?: string;
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

export function AttachQuizModal({
  courseId,
  chapterId,
  lessonId,
  attachedIds,
  quizzesHref,
  triggerLabel = "Add quiz",
  triggerVariant = "secondary",
  triggerSize = "sm",
}: AttachQuizModalProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("existing");
  const [q, setQ] = useState("");

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: instructorLessonEditorQuizzesQueryKey,
    queryFn: fetchInstructorLessonEditorQuizzesQueryFn,
    enabled: open && tab === "existing",
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(quizzes) ? quizzes : [];
    const needle = q.trim().toLowerCase();
    return list.filter((quiz) => {
      if (attachedIds.has(quiz._id)) return false;
      if (!needle) return true;
      return (
        quiz.title.toLowerCase().includes(needle) ||
        (quiz.topic && quiz.topic.toLowerCase().includes(needle))
      );
    });
  }, [quizzes, q, attachedIds]);

  const invalidateAll = () => {
    void qc.invalidateQueries({
      queryKey: ["lesson", courseId, chapterId, lessonId],
    });
    void qc.invalidateQueries({ queryKey: ["lesson-resources", lessonId] });
    void qc.invalidateQueries({
      queryKey: instructorLessonEditorQuizzesQueryKey,
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
    mutationFn: (quizId: string) => {
      const guard = guardIds();
      if (guard) return Promise.reject(new Error(guard));
      return attachLessonQuizMutationFn(courseId, lessonId, quizId);
    },
    onSuccess: () => {
      toast.success("Quiz attached");
      invalidateAll();
      setOpen(false);
    },
    onError: (e: unknown) => {
      const msg = getErrorMessageFromUnknown(e);
      console.error("Attach quiz failed", {
        url: `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/quizzes`,
        message: msg,
        error: e,
      });
      toast.error(`Attach failed: ${msg}`);
    },
  });

  const attachAfterCreate = useMutation({
    mutationFn: (quizId: string) => {
      const guard = guardIds();
      if (guard) return Promise.reject(new Error(guard));
      return attachLessonQuizMutationFn(courseId, lessonId, quizId);
    },
    onSuccess: () => {
      toast.success("Quiz created and attached");
      invalidateAll();
      setOpen(false);
    },
    onError: (e: unknown) => {
      const msg = getErrorMessageFromUnknown(e);
      console.error("Attach (after create) quiz failed", {
        url: `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/quizzes`,
        message: msg,
        error: e,
      });
      toast.error(
        `Created, but attach failed: ${msg}. Open Quiz Management to retry the attach.`,
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
        <DialogHeader className="space-y-2 border-b bg-linear-to-br from-violet-500/10 via-background to-background px-5 py-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400"
              aria-hidden
            >
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold">
                Add quiz to this lesson
              </DialogTitle>
              <DialogDescription className="text-xs">
                Reuse a quiz from your library or author a new one in a single
                step.
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
                placeholder="Search title or topic…"
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
                    No quizzes available to attach
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
                    {quizzesHref ? (
                      <>
                        {" "}
                        Or open the full{" "}
                        <a
                          href={quizzesHref}
                          className="underline underline-offset-4"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Quiz Management
                        </a>
                        .
                      </>
                    ) : null}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((quiz) => {
                    const count = Array.isArray(quiz.questions)
                      ? quiz.questions.length
                      : Number(quiz.noOfQuestions);
                    const hasCount = Number.isFinite(count);
                    return (
                      <li
                        key={quiz._id}
                        className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            aria-hidden
                          >
                            <ClipboardCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {quiz.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {quiz.topic ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-full px-2 py-0 text-[10px]"
                                >
                                  {quiz.topic}
                                </Badge>
                              ) : null}
                              {hasCount ? (
                                <Badge
                                  variant="secondary"
                                  className="rounded-full px-2 py-0 text-[10px]"
                                >
                                  <HelpCircle className="mr-1 h-3 w-3" />
                                  {count}{" "}
                                  {count === 1 ? "question" : "questions"}
                                </Badge>
                              ) : null}
                              <VisibilityBadge
                                value={quiz.visibility ?? "PRIVATE"}
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => attachExisting.mutate(quiz._id)}
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
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              The new quiz is created with{" "}
              <code className="rounded bg-muted px-1">visibility: PRIVATE</code> and
              <code className="mx-1 rounded bg-muted px-1">courseId</code> set, so
              students only see it through this lesson — and it's attached
              automatically.
            </p>
            <InlineCreateQuizForm
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
