"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpenCheck,
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
import type { InstructorProblemEntity } from "@/types/api/instructor/lms/problem-solving/problem-solving.type";

type TestCaseDraft = { input: string; output: string };

const emptyDraft = {
  title: "",
  description: "",
  constraints: "",
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

export default function ProblemSolvingManagement() {
  const queryClient = useQueryClient();
  const { data: problems = [], isLoading, isRefetching, refetch } =
    useInstructorProblemsQuery();
  const createMutation = useCreateInstructorProblemMutation();
  const deleteMutation = useDeleteInstructorProblemMutation();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] =
    useState<InstructorProblemEntity | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [testCases, setTestCases] = useState<TestCaseDraft[]>([
    { input: "", output: "" },
  ]);

  const filteredProblems = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return problems;
    return problems.filter(
      (problem) =>
        problem.title.toLowerCase().includes(q) ||
        problem.description.toLowerCase().includes(q),
    );
  }, [problems, search]);

  const totalTestCases = useMemo(
    () => problems.reduce((sum, item) => sum + (item.testCases?.length ?? 0), 0),
    [problems],
  );

  const resetForm = () => {
    setDraft(emptyDraft);
    setTestCases([{ input: "", output: "" }]);
  };

  const handleCreateProblem = async () => {
    const validTestCases = testCases
      .map((item) => ({
        input: item.input.trim(),
        output: item.output.trim(),
      }))
      .filter((item) => item.input.length > 0 && item.output.length > 0);

    if (
      !draft.title.trim() ||
      !draft.description.trim() ||
      !draft.constraints.trim() ||
      draft.categories.length === 0 ||
      validTestCases.length === 0
    ) {
      toast.error("Please complete all required fields.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: draft.title.trim(),
        description: draft.description.trim(),
        constraints: draft.constraints.trim(),
        testCases: validTestCases,
        difficulty: draft.difficulty,
        categories: draft.categories,
      });
  const toggleCategory = (category: (typeof CATEGORY_OPTIONS)[number]["value"]) => {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category],
    }));
  };


      await queryClient.invalidateQueries({
        queryKey: instructorProblemSolvingKeys.list(),
      });

      toast.success("Problem created successfully.");
      setDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      toast.error("Failed to create problem.", {
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Please try again.",
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
          (error as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Please try again.",
      });
    }
  };

  const addTestCase = () => {
    setTestCases((prev) => [...prev, { input: "", output: "" }]);
  };

  const updateTestCase = (
    index: number,
    key: keyof TestCaseDraft,
    value: string,
  ) => {
    setTestCases((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    );
  };

  const removeTestCase = (index: number) => {
    setTestCases((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="min-h-full w-full pb-16">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium">
            <BookOpenCheck className="h-3.5 w-3.5 text-primary" />
            Instructor hub
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Problem Solving Management
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Create and maintain coding problems for students from one clean
            workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => void refetch()}
              className="rounded-full border-primary/25 bg-background/60 backdrop-blur cursor-pointer"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full px-8 cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  New Problem
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create Problem</DialogTitle>
                  <DialogDescription>
                    Fill the problem details and add one or more test cases.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                  <Input
                    placeholder="Problem title"
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, title: e.target.value }))
                    }
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
                          <RadioGroupItem value={level} id={`difficulty-${level}`} />
                          <Label htmlFor={`difficulty-${level}`} className="capitalize">
                            {level}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Categories</p>
                    <div className="grid grid-cols-2 gap-3">
                      {CATEGORY_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 rounded-md border px-3 py-2"
                        >
                          <Checkbox
                            checked={draft.categories.includes(option.value)}
                            onCheckedChange={() => toggleCategory(option.value)}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
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
                            placeholder={`Case ${index + 1} input`}
                            value={testCase.input}
                            onChange={(e) =>
                              updateTestCase(index, "input", e.target.value)
                            }
                          />
                          <Input
                            placeholder={`Case ${index + 1} output`}
                            value={testCase.output}
                            onChange={(e) =>
                              updateTestCase(index, "output", e.target.value)
                            }
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
                    onClick={() => {
                      resetForm();
                      setDialogOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProblem}
                    disabled={createMutation.isPending}
                    className="cursor-pointer"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Problem"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">
                {problems.length}
              </div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Problems
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">
                {totalTestCases}
              </div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Test Cases
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">
                Live
              </div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Workspace
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        <div className="mb-6 w-full max-w-4xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-44 animate-pulse rounded-xl border bg-muted"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {isRefetching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing problems...
              </div>
            ) : null}

            {filteredProblems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No problems found.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredProblems.map((problem) => (
                  <Card key={problem._id} className="py-4">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="line-clamp-2 text-lg">
                          {problem.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
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
                        {problem.categories?.map((category) => (
                          <Badge key={category} variant="outline">
                            {category}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProblem(problem)}
                              className="cursor-pointer"
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
                                  {selectedProblem?.description ?? problem.description}
                                </p>
                              </div>

                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Constraints
                                </p>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                  {selectedProblem?.constraints ?? problem.constraints}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Test Cases
                                </p>
                                {(selectedProblem?.testCases ?? problem.testCases)?.map(
                                  (testCase, index) => (
                                    <Card key={`${testCase.input}-${index}`} className="py-3">
                                      <CardContent className="space-y-2 px-4 text-sm">
                                        <p>
                                          <span className="font-semibold">Input:</span>{" "}
                                          <span className="font-mono text-xs">
                                            {testCase.input}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="font-semibold">Output:</span>{" "}
                                          <span className="font-mono text-xs">
                                            {testCase.output}
                                          </span>
                                        </p>
                                      </CardContent>
                                    </Card>
                                  ),
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeleteProblem(problem._id)}
                          disabled={deleteMutation.isPending}
                          className="cursor-pointer"
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
      </div>
    </div>
  );
}

