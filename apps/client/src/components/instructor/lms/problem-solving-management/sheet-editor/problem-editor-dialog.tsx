"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProblemSolvingProblemQuery } from "@/hooks/instructor/use-problem-solving-management";
import {
  CATEGORY_OPTIONS,
  EMPTY_PROBLEM_DRAFT,
  inferParameterNames,
  problemToDraft,
  problemToTestCases,
  tryParseJson,
  type ProblemDraft,
  type TestCaseDraft,
} from "./problem-form-utils";

type ProblemEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProblemId: string | null;
  onSave: (payload: {
    draft: ProblemDraft;
    parameterNames: string[];
    testCases: Array<{
      input: unknown;
      expected: unknown;
      ignoreArrayOrder?: boolean;
      isHidden?: boolean;
    }>;
    editingProblemId?: string;
  }) => Promise<void>;
};

export function ProblemEditorDialog({
  open,
  onOpenChange,
  editingProblemId,
  onSave,
}: ProblemEditorDialogProps) {
  const [draft, setDraft] = useState<ProblemDraft>(EMPTY_PROBLEM_DRAFT);
  const [testCases, setTestCases] = useState<TestCaseDraft[]>([
    { input: "", expected: "", ignoreArrayOrder: false, isHidden: false },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: loadedProblem, isLoading: isLoadingProblem } =
    useProblemSolvingProblemQuery(editingProblemId ?? "", open && Boolean(editingProblemId));

  useEffect(() => {
    if (!open) return;
    if (editingProblemId) {
      if (!loadedProblem) return;
      setDraft(problemToDraft(loadedProblem));
      setTestCases(problemToTestCases(loadedProblem));
      return;
    }
    setDraft(EMPTY_PROBLEM_DRAFT);
    setTestCases([
      { input: "", expected: "", ignoreArrayOrder: false, isHidden: false },
    ]);
  }, [open, editingProblemId, loadedProblem]);

  const toggleCategory = useCallback(
    (category: (typeof CATEGORY_OPTIONS)[number]["value"]) => {
      setDraft((prev) => ({
        ...prev,
        categories: prev.categories.includes(category)
          ? prev.categories.filter((item) => item !== category)
          : [...prev.categories, category],
      }));
    },
    [],
  );

  const addTestCase = useCallback(() => {
    setTestCases((prev) => [
      ...prev,
      { input: "", expected: "", ignoreArrayOrder: false, isHidden: false },
    ]);
  }, []);

  const updateTestCase = useCallback(
    (index: number, key: keyof TestCaseDraft, value: string) => {
      setTestCases((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
      );
    },
    [],
  );

  const removeTestCase = useCallback((index: number) => {
    setTestCases((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleSave = async () => {
    const validTestCases = testCases
      .map((item) => ({
        input: item.input.trim(),
        expected: item.expected.trim(),
        ignoreArrayOrder: Boolean(item.ignoreArrayOrder),
        isHidden: Boolean(item.isHidden),
      }))
      .filter((item) => item.input.length > 0 && item.expected.length > 0);

    if (
      !draft.title.trim() ||
      !draft.description.trim() ||
      !draft.constraints.trim() ||
      !draft.functionName.trim() ||
      draft.categories.length === 0 ||
      validTestCases.length === 0
    ) {
      toast.error("Please complete all required fields.");
      return;
    }

    // Build parsed test cases first
    const parsedCases: Array<{
      input: unknown;
      expected: unknown;
      ignoreArrayOrder?: boolean;
      isHidden?: boolean;
    }> = [];

    for (const [index, testCase] of validTestCases.entries()) {
      const parsedInput = tryParseJson(testCase.input);
      const parsedExpected = tryParseJson(testCase.expected);
      if (!parsedInput.ok || !parsedExpected.ok) {
        toast.error(
          `Test case ${index + 1} must contain valid JSON for input and expected.`,
        );
        return;
      }
      parsedCases.push({
        input: parsedInput.data,
        expected: parsedExpected.data,
        ignoreArrayOrder: testCase.ignoreArrayOrder,
        isHidden: testCase.isHidden,
      });
    }

    // Resolve parameterNames: use the manual field if provided, else auto-infer from first test case
    const resolvedParamNames: string[] = draft.parameterNames.trim()
      ? draft.parameterNames.split(",").map((s) => s.trim()).filter(Boolean)
      : inferParameterNames(parsedCases[0]?.input);

    setIsSaving(true);
    try {
      await onSave({
        draft,
        parameterNames: resolvedParamNames,
        testCases: parsedCases,
        editingProblemId: editingProblemId ?? undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormLoading = Boolean(editingProblemId) && isLoadingProblem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {editingProblemId ? "Edit Sheet Problem" : "Create Sheet Problem"}
          </DialogTitle>
          <DialogDescription>
            Problems created here are scoped to this sheet and hidden from global listings.
          </DialogDescription>
        </DialogHeader>

        {isFormLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading problem...
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              <Input
                placeholder="Problem title"
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Problem description"
                value={draft.description}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, description: e.target.value }))
                }
              />
              <Textarea
                placeholder="Constraints"
                value={draft.constraints}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, constraints: e.target.value }))
                }
              />
              <Input
                placeholder="Function name (e.g., twoSum)"
                value={draft.functionName}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, functionName: e.target.value }))
                }
              />
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Parameter Names{" "}
                  <span className="font-normal text-muted-foreground">
                    (comma-separated, e.g. nums, target)
                  </span>
                </Label>
                <Input
                  placeholder="e.g. nums, target (leave blank to auto-detect)"
                  value={draft.parameterNames}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, parameterNames: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Time limit (ms)"
                  value={draft.timeLimit}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, timeLimit: Number(e.target.value) }))
                  }
                />
                <Input
                  type="number"
                  placeholder="Memory limit (MB)"
                  value={draft.memoryLimit}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, memoryLimit: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Difficulty</p>
                <div className="flex flex-wrap gap-2">
                  {(["easy", "medium", "hard"] as const).map((level) => (
                    <Badge
                      key={level}
                      variant={draft.difficulty === level ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setDraft((prev) => ({ ...prev, difficulty: level }))}
                    >
                      {level}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Categories</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_OPTIONS.map((option) => (
                    <Badge
                      key={option.value}
                      variant={
                        draft.categories.includes(option.value) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleCategory(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Test Cases</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTestCase}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Case
                  </Button>
                </div>

                {testCases.map((testCase, index) => (
                  <Card key={`case-${index}`} className="py-4">
                    <CardContent className="space-y-3 px-4">
                      <Input
                        placeholder={`Case ${index + 1} input (JSON)`}
                        value={testCase.input}
                        onChange={(e) => updateTestCase(index, "input", e.target.value)}
                      />
                      <Input
                        placeholder={`Case ${index + 1} expected output (JSON)`}
                        value={testCase.expected}
                        onChange={(e) => updateTestCase(index, "expected", e.target.value)}
                      />
                      {testCases.length > 1 ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTestCase(index)}
                          className="cursor-pointer"
                        >
                          Remove
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="cursor-pointer"
              >
                {isSaving ? "Saving..." : editingProblemId ? "Save Problem" : "Create Problem"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
