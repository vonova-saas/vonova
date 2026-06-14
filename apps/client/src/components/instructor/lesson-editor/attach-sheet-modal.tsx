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
import { getInstructorProblemSheetsQueryFn } from "@/services/instructor/lms/problem-solving/problem-solving.api";
import {
  instructorProblemSolvingKeys,
  useUpdateInstructorProblemSheetMutation,
} from "@/hooks/instructor/use-problem-solving-management";
import { toast } from "sonner";
import { coursesKeys } from "@/hooks/student/lms/use-courses";
import { FileSpreadsheet, Loader2, Plus, Search } from "lucide-react";
import { InlineCreateSheetForm } from "./inline-create-sheet-form";
import { getErrorMessageFromUnknown } from "@/lib/utils/error-message";
import {
  DifficultyBadge,
  ResourceListSkeleton,
} from "./resource-primitives";

type AttachSheetModalProps = {
  courseId: string;
  chapterId: string;
  lessonId: string;
  attachedIds: Set<string>;
  sheetsHref?: string;
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

export function AttachSheetModal({
  courseId,
  chapterId,
  lessonId,
  attachedIds,
  sheetsHref,
  triggerLabel = "Add sheet",
  triggerVariant = "secondary",
  triggerSize = "sm",
}: AttachSheetModalProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("existing");
  const [q, setQ] = useState("");

  const { data: sheets = [], isLoading } = useQuery({
    queryKey: instructorProblemSolvingKeys.sheets(),
    queryFn: getInstructorProblemSheetsQueryFn,
    enabled: open && tab === "existing",
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(sheets) ? sheets : [];
    const needle = q.trim().toLowerCase();
    return list.filter((s) => {
      // Filter out sheets already attached to *this* lesson
      if (attachedIds.has(s._id)) return false;
      if (!needle) return true;
      return (
        s.title.toLowerCase().includes(needle) ||
        (s.description ?? "").toLowerCase().includes(needle)
      );
    });
  }, [sheets, q, attachedIds]);

  const invalidateAll = () => {
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
  };

  const updateMutation = useUpdateInstructorProblemSheetMutation();

  const attachExisting = useMutation({
    mutationFn: (sheetId: string) => {
      if (!courseId || !lessonId) {
        return Promise.reject(new Error("Missing courseId or lessonId"));
      }
      return updateMutation.mutateAsync({
        sheetId,
        payload: {
          lessonId,
          courseId,
          chapterId,
        },
      });
    },
    onSuccess: () => {
      toast.success("Problem sheet attached");
      invalidateAll();
      setOpen(false);
    },
    onError: (e: unknown) => {
      const msg = getErrorMessageFromUnknown(e);
      toast.error(`Attach failed: ${msg}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={triggerSize} variant={triggerVariant}>
          <Plus className="mr-1.5 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Problem Sheet</DialogTitle>
          <DialogDescription>
            Attach a problem sheet to this lesson. You can select an existing one or create a new one.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          className="mt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Pick existing</TabsTrigger>
            <TabsTrigger value="create">Create new</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problem sheets..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <ResourceListSkeleton rows={3} />
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {q.trim()
                  ? "No matching problem sheets found."
                  : "No problem sheets available to attach."}
              </div>
            ) : (
              <ScrollArea className="max-h-72 pr-2">
                <ul className="space-y-2">
                  {filtered.map((s) => (
                    <li
                      key={s._id}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400">
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {s.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <DifficultyBadge value={s.difficulty} />
                            <span className="text-xs text-muted-foreground">
                              {s.totalQuestions ?? 0} questions
                            </span>
                            {s.lessonId && (
                              <span className="text-xs text-amber-600 dark:text-amber-400">
                                (Attached to another lesson)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => attachExisting.mutate(s._id)}
                        disabled={attachExisting.isPending}
                      >
                        {attachExisting.isPending &&
                        attachExisting.variables === s._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Attach"
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="create" className="pt-4">
            <InlineCreateSheetForm
              courseId={courseId}
              chapterId={chapterId}
              lessonId={lessonId}
              onCancel={() => setOpen(false)}
              onCreated={() => {
                invalidateAll();
                setOpen(false);
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
