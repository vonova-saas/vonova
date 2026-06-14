"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createProblemInSheetMutationFn,
  updateProblemInSheetMutationFn,
  deleteProblemInSheetMutationFn,
  type ProblemSheetEntity,
} from "@/services/instructor/lms/problem-solving/problem-solving.api";
import type { InstructorProblemEntity } from "@/types/api/instructor/lms/problem-solving/problem-solving.type";
import { fullProblemToSummary } from "@/types/api/instructor/lms/problem-solving/sheet-problem.type";
import type { SheetProblemSummary } from "@/types/api/instructor/lms/problem-solving/sheet-problem.type";
import { useQueryClient } from "@tanstack/react-query";
import {
  instructorProblemSolvingKeys,
  useInstructorProblemSheetQuery,
} from "@/hooks/instructor/use-problem-solving-management";
import { SheetMetadataForm } from "./sheet-editor/sheet-metadata-form";
import { ProblemList } from "./sheet-editor/problem-list";
import { ProblemEditorDialog } from "./sheet-editor/problem-editor-dialog";
import { ProblemViewDialog } from "./sheet-editor/problem-view-dialog";

interface SheetEditorProps {
  sheetId: string;
  instructorId: string;
}

export default function SheetEditor({ sheetId, instructorId }: SheetEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: sheet, isLoading: isSheetLoading } = useInstructorProblemSheetQuery(sheetId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewProblemId, setViewProblemId] = useState<string | null>(null);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);

  const problems = useMemo(
    () => sheet?.problems ?? [],
    [sheet?.problems],
  );

  const patchSheetCache = useCallback(
    (nextProblems: SheetProblemSummary[]) => {
      if (!sheet) return;
      queryClient.setQueryData(
        instructorProblemSolvingKeys.sheet(sheetId),
        { ...sheet, problems: nextProblems, totalQuestions: nextProblems.length },
      );
      queryClient.setQueryData(
        instructorProblemSolvingKeys.sheets(),
        (rows: ProblemSheetEntity[] | undefined) =>
          rows?.map((row) =>
            row._id === sheetId
              ? { ...row, problems: nextProblems, totalQuestions: nextProblems.length }
              : row,
          ),
      );
    },
    [queryClient, sheet, sheetId],
  );

  const upsertSummaryFromFull = useCallback(
    (
      full: InstructorProblemEntity,
      existing: SheetProblemSummary[],
      orderOverride?: number,
    ): SheetProblemSummary[] => {
      const summary = fullProblemToSummary(
        full,
        orderOverride ?? existing.length + 1,
        sheet?.status ?? "draft",
      );
      const idx = existing.findIndex((row) => row._id === full._id);
      if (idx < 0) return [...existing, summary];
      return existing.map((row, index) =>
        index === idx ? { ...summary, order: row.order } : row,
      );
    },
    [sheet?.status],
  );

  const handleSaveProblem = useCallback(
    async ({
      draft,
      parameterNames,
      testCases,
      editingProblemId: problemId,
    }: {
      draft: {
        title: string;
        description: string;
        constraints: string;
        functionName: string;
        allowUnorderedArrayOutput: boolean;
        timeLimit: number;
        memoryLimit: number;
        difficulty: "easy" | "medium" | "hard";
        categories: InstructorProblemEntity["categories"];
      };
      parameterNames: string[];
      testCases: Array<{
        input: unknown;
        expected: unknown;
        ignoreArrayOrder?: boolean;
        isHidden?: boolean;
      }>;
      editingProblemId?: string;
    }) => {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        constraints: draft.constraints.trim(),
        functionName: draft.functionName.trim(),
        parameterNames,
        allowUnorderedArrayOutput: draft.allowUnorderedArrayOutput,
        timeLimit: Number(draft.timeLimit) || 2000,
        memoryLimit: Number(draft.memoryLimit) || 128,
        testCases,
        difficulty: draft.difficulty,
        categories: draft.categories,
      };

      try {
        if (problemId) {
          const updated = await updateProblemInSheetMutationFn({
            sheetId,
            problemId,
            payload,
          });
          patchSheetCache(upsertSummaryFromFull(updated, problems));
          void queryClient.invalidateQueries({
            queryKey: [...instructorProblemSolvingKeys.detail(problemId), "full"],
          });
          toast.success("Problem updated successfully.");
        } else {
          const created = await createProblemInSheetMutationFn({ sheetId, payload });
          patchSheetCache(upsertSummaryFromFull(created, problems));
          toast.success("Problem created successfully.");
        }
        setEditingProblemId(null);
      } catch (error: unknown) {
        toast.error("Failed to save problem.", {
          description:
            (error as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? "Please try again.",
        });
        throw error;
      }
    },
    [patchSheetCache, problems, queryClient, sheetId, upsertSummaryFromFull],
  );

  const handleDeleteProblem = useCallback(
    async (problemId: string) => {
      try {
        await deleteProblemInSheetMutationFn({ sheetId, problemId });
        const next = problems
          .filter((problem) => problem._id !== problemId)
          .map((problem, index) => ({ ...problem, order: index + 1 }));
        patchSheetCache(next);
        toast.success("Problem removed from sheet successfully");
      } catch {
        toast.error("Failed to remove problem from sheet");
      }
    },
    [patchSheetCache, problems, sheetId],
  );

  const handlePreview = useCallback(() => {
    if (problems.length === 0) {
      toast.error("Add at least one problem before previewing.");
      return;
    }
    setViewProblemId(problems[0]._id);
    setViewDialogOpen(true);
  }, [problems]);

  const handleEditProblem = useCallback((problemId: string) => {
    setEditingProblemId(problemId);
    setEditorOpen(true);
  }, []);

  const handleViewProblem = useCallback((problemId: string) => {
    setViewProblemId(problemId);
    setViewDialogOpen(true);
  }, []);

  const handleAddProblem = useCallback(() => {
    setEditingProblemId(null);
    setEditorOpen(true);
  }, []);

  if (!sheetId) {
    return null;
  }

  if (isSheetLoading || !sheet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full w-full pb-16">
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/instructor/${instructorId}/problem-solving-management`)
              }
              className="cursor-pointer"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{sheet.title}</h1>
              <p className="text-sm text-muted-foreground">
                {sheet.status === "draft" ? "Draft" : "Published"} • {problems.length} problems
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePreview} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SheetMetadataForm sheet={sheet} problemCount={problems.length} />
          </div>
          <div className="lg:col-span-2">
            <ProblemList
              problems={problems}
              onAddProblem={handleAddProblem}
              onEdit={handleEditProblem}
              onView={handleViewProblem}
              onDelete={(id) => void handleDeleteProblem(id)}
            />
          </div>
        </div>
      </div>

      <ProblemEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingProblemId={editingProblemId}
        onSave={handleSaveProblem}
      />

      <ProblemViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        problemId={viewProblemId}
      />
    </div>
  );
}
