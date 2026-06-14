"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Eye,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  instructorProblemSolvingKeys,
  useCreateInstructorProblemMutation,
  useDeleteInstructorProblemMutation,
  useInstructorProblemsQuery,
} from "@/hooks/instructor/use-problem-solving-management";
import { inferParameterNames } from "./sheet-editor/problem-form-utils";
import type { InstructorProblemEntity } from "@/types/api/instructor/lms/problem-solving/problem-solving.type";

type TestCaseDraft = {
  input: string;
  expected: string;
  ignoreArrayOrder?: boolean;
  isHidden?: boolean;
};

const emptyDraft = {
  title: "",
  description: "",
  constraints: "",
  functionName: "",
  allowUnorderedArrayOutput: false,
  timeLimit: 2000,
  memoryLimit: 128,
  difficulty: "easy" as "easy" | "medium" | "hard",
  categories: [] as (
    | "arrays"
    | "strings"
    | "hashmap"
    | "math"
    | "dp"
    | "recursion"
    | "sorting"
  )[],
};

const CATEGORY_OPTIONS = [
  { value: "arrays", label: "Arrays" },
  { value: "strings", label: "Strings" },
  { value: "hashmap", label: "Hashmap" },
  { value: "math", label: "Math" },
  { value: "dp", label: "DP" },
  { value: "recursion", label: "Recursion" },
  { value: "sorting", label: "Sorting" },
] as const;

function tryParseJson(value: string): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(value) as unknown };
  } catch {
    return { ok: false };
  }
}

export function StandaloneProblemsDashboard() {
  const queryClient = useQueryClient();
  const {
    data: problems = [],
    isLoading,
    isRefetching,
    refetch,
  } = useInstructorProblemsQuery();
  const createMutation = useCreateInstructorProblemMutation();
  const deleteMutation = useDeleteInstructorProblemMutation();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] =
    useState<InstructorProblemEntity | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [testCases, setTestCases] = useState<TestCaseDraft[]>([
    { input: "", expected: "", ignoreArrayOrder: false, isHidden: false },
  ]);

  const filteredProblems = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return problems;
    return problems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [problems, search]);

  const totalTestCases = useMemo(
    () =>
      problems.reduce((sum, item) => sum + (item.testCases?.length ?? 0), 0),
    [problems],
  );

  const resetForm = () => {
    setDraft(emptyDraft);
    setTestCases([
      { input: "", expected: "", ignoreArrayOrder: false, isHidden: false },
    ]);
  };

  const handleCreateProblem = async () => {
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

    try {
      await createMutation.mutateAsync({
        title: draft.title.trim(),
        description: draft.description.trim(),
        constraints: draft.constraints.trim(),
        functionName: draft.functionName.trim(),
        parameterNames: inferParameterNames(parsedCases[0]?.input),
        allowUnorderedArrayOutput: draft.allowUnorderedArrayOutput,
        timeLimit: Number(draft.timeLimit) || 2000,
        memoryLimit: Number(draft.memoryLimit) || 128,
        testCases: parsedCases,
        difficulty: draft.difficulty,
        categories: draft.categories,
      });

      await queryClient.invalidateQueries({
        queryKey: instructorProblemSolvingKeys.list(),
      });

      toast.success("Problem created successfully.");
      setDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      toast.error("Failed to create problem.", {
        description:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Please try again.",
      });
    }
  };

  const handleDeleteProblem = async (problemId: string) => {
    try {
      await deleteMutation.mutateAsync(problemId);
      await queryClient.invalidateQueries({
        queryKey: instructorProblemSolvingKeys.list(),
      });
      toast.success("Problem deleted.");
    } catch (error: unknown) {
      toast.error("Delete failed.", {
        description:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Please try again.",
      });
    }
  };

  const toggleCategory = (
    category: (typeof CATEGORY_OPTIONS)[number]["value"],
  ) => {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category],
    }));
  };

  const addTestCase = () => {
    setTestCases((prev) => [
      ...prev,
      { input: "", expected: "", ignoreArrayOrder: false, isHidden: false },
    ]);
  };

  const updateTestCase = (
    index: number,
    key: keyof TestCaseDraft,
    value: string,
  ) => {
    setTestCases((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const removeTestCase = (index: number) => {
    setTestCases((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <Card className="mb-8">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Standalone Problems</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage standalone coding problems for students. These
              are not scoped to a sheet and can be attached to lessons directly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void refetch()}
              className="cursor-pointer"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            {/* ── Create Problem Dialog ─────────────────────────── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  New Problem
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create Problem</DialogTitle>
                  <DialogDescription>
                    Fill in the problem details and add one or more test cases.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <Label>Title</Label>
                    <Input
                      placeholder="Problem title"
                      value={draft.title}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Problem description"
                      value={draft.description}
                      rows={3}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Constraints */}
                  <div className="space-y-1">
                    <Label>Constraints</Label>
                    <Textarea
                      placeholder="Constraints"
                      value={draft.constraints}
                      rows={2}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          constraints: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Function name */}
                  <div className="space-y-1">
                    <Label>Function Name</Label>
                    <Input
                      placeholder="Function name (e.g., twoSum)"
                      value={draft.functionName}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          functionName: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Time / Memory limits */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Time limit (ms)</Label>
                      <Input
                        type="number"
                        placeholder="2000"
                        value={draft.timeLimit}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            timeLimit: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Memory limit (MB)</Label>
                      <Input
                        type="number"
                        placeholder="128"
                        value={draft.memoryLimit}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            memoryLimit: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Allow unordered output */}
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2">
                    <Checkbox
                      checked={draft.allowUnorderedArrayOutput}
                      onCheckedChange={(checked) =>
                        setDraft((prev) => ({
                          ...prev,
                          allowUnorderedArrayOutput: Boolean(checked),
                        }))
                      }
                    />
                    <span className="text-sm">
                      Allow unordered array outputs by default
                    </span>
                  </label>

                  {/* Difficulty */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Difficulty</p>
                    <RadioGroup
                      value={draft.difficulty}
                      onValueChange={(value: "easy" | "medium" | "hard") =>
                        setDraft((prev) => ({ ...prev, difficulty: value }))
                      }
                      className="flex flex-wrap gap-5"
                    >
                      {(["easy", "medium", "hard"] as const).map((level) => (
                        <div key={level} className="flex items-center gap-2">
                          <RadioGroupItem
                            value={level}
                            id={`standalone-difficulty-${level}`}
                          />
                          <Label
                            htmlFor={`standalone-difficulty-${level}`}
                            className="cursor-pointer capitalize"
                          >
                            {level}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Categories */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Categories</p>
                    <div className="grid grid-cols-2 gap-3">
                      {CATEGORY_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2"
                        >
                          <Checkbox
                            checked={draft.categories.includes(option.value)}
                            onCheckedChange={() =>
                              toggleCategory(option.value)
                            }
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Test Cases */}
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
                            onChange={(e) =>
                              updateTestCase(index, "input", e.target.value)
                            }
                          />
                          <Input
                            placeholder={`Case ${index + 1} expected output (JSON)`}
                            value={testCase.expected}
                            onChange={(e) =>
                              updateTestCase(index, "expected", e.target.value)
                            }
                          />
                          <label className="flex cursor-pointer items-center gap-2">
                            <Checkbox
                              checked={Boolean(testCase.ignoreArrayOrder)}
                              onCheckedChange={(checked) =>
                                setTestCases((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? {
                                          ...item,
                                          ignoreArrayOrder: Boolean(checked),
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              Ignore array order for this case
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-2">
                            <Checkbox
                              checked={Boolean(testCase.isHidden)}
                              onCheckedChange={(checked) =>
                                setTestCases((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, isHidden: Boolean(checked) }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              Hidden test case (not shown to students)
                            </span>
                          </label>
                          {testCases.length > 1 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeTestCase(index)}
                              className="cursor-pointer"
                            >
                              Remove
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      resetForm();
                      setDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="cursor-pointer"
                    onClick={() => void handleCreateProblem()}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      "Create Problem"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{problems.length}</p>
            <p className="text-xs text-muted-foreground">All problems</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{totalTestCases}</p>
            <p className="text-xs text-muted-foreground">Test Cases</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">Live</p>
            <p className="text-xs text-muted-foreground">Workspace</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search */}
        <div className="mb-6 max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search problems…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Problem list */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="h-44 animate-pulse rounded-xl border bg-muted"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {isRefetching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing problems…
              </div>
            )}

            {filteredProblems.length === 0 ? (
              <div className="rounded-md border py-12 text-center text-sm text-muted-foreground">
                No problems found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredProblems.map((problem) => (
                  <Card key={problem._id} className="py-4">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="line-clamp-2 text-lg">
                          {problem.title}
                        </CardTitle>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            className={
                              problem.difficulty === "easy"
                                ? "bg-emerald-100 text-emerald-800"
                                : problem.difficulty === "medium"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                            }
                          >
                            {problem.difficulty}
                          </Badge>
                          <Badge variant="secondary">
                            {problem.testCases?.length ?? 0} cases
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {problem.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {problem.categories?.map((cat) => (
                          <Badge key={cat} variant="outline">
                            {cat}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* View dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => setSelectedProblem(problem)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>
                                {selectedProblem?.title ?? problem.title}
                              </DialogTitle>
                              <DialogDescription>
                                Problem details and test cases
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Description
                                </p>
                                <p className="whitespace-pre-wrap text-sm">
                                  {selectedProblem?.description ??
                                    problem.description}
                                </p>
                              </div>
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Constraints
                                </p>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                  {selectedProblem?.constraints ??
                                    problem.constraints}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Test Cases
                                </p>
                                {(
                                  selectedProblem?.testCases ?? problem.testCases
                                )?.map((tc, i) => (
                                  <Card
                                    key={`${JSON.stringify(tc.input)}-${i}`}
                                    className="py-3"
                                  >
                                    <CardContent className="space-y-2 px-4 text-sm">
                                      <p>
                                        <span className="font-semibold">
                                          Input:
                                        </span>{" "}
                                        <span className="font-mono text-xs">
                                          {JSON.stringify(tc.input)}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="font-semibold">
                                          Expected:
                                        </span>{" "}
                                        <span className="font-mono text-xs">
                                          {JSON.stringify(tc.expected)}
                                        </span>
                                      </p>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Delete */}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => void handleDeleteProblem(problem._id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
