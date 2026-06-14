"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Plus } from "lucide-react";
import { useCreateInstructorProblemMutation } from "@/hooks/instructor/use-problem-solving-management";
import type { CreateInstructorProblemRequest } from "@/types/api/instructor/lms/problem-solving/problem-solving.type";
import { toast } from "sonner";
import {
  VisibilityField,
  type VisibilityChoice,
} from "./resource-primitives";

type InlineCreateProblemFormProps = {
  courseId: string;
  lessonId: string;
  onCancel: () => void;
  onCreated: (created: { id: string; title: string }) => void;
};

type TestCaseDraft = {
  input: string;
  expected: string;
  ignoreArrayOrder?: boolean;
  isHidden?: boolean;
};

type ProblemDraft = {
  title: string;
  description: string;
  constraints: string;
  functionName: string;
  allowUnorderedArrayOutput: boolean;
  timeLimit: number;
  memoryLimit: number;
  difficulty: "easy" | "medium" | "hard";
  categories: CreateInstructorProblemRequest["categories"];
};

const emptyDraft: ProblemDraft = {
  title: "",
  description: "",
  constraints: "",
  functionName: "",
  allowUnorderedArrayOutput: false,
  timeLimit: 2000,
  memoryLimit: 128,
  difficulty: "easy",
  categories: [],
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

export function InlineCreateProblemForm({
  courseId,
  lessonId,
  onCancel,
  onCreated,
}: InlineCreateProblemFormProps) {
  const [draft, setDraft] = useState<ProblemDraft>(emptyDraft);
  const [testCases, setTestCases] = useState<TestCaseDraft[]>([
    { input: "", expected: "", ignoreArrayOrder: false, isHidden: false },
  ]);
  const [visibility, setVisibility] = useState<VisibilityChoice>("PRIVATE");
  const createMutation = useCreateInstructorProblemMutation();

  const tryParseJson = (
    value: string,
  ): { ok: true; data: unknown } | { ok: false } => {
    try {
      return { ok: true, data: JSON.parse(value) as unknown };
    } catch {
      return { ok: false };
    }
  };

  const inferParameterNames = (input: unknown): string[] => {
    if (input && typeof input === "object" && !Array.isArray(input)) {
      const keys = Object.keys(input as Record<string, unknown>).filter(Boolean);
      if (keys.length > 0) return keys;
    }
    if (Array.isArray(input)) {
      return input.map((_, index) => `arg${index + 1}`);
    }
    return ["input"];
  };

  const toggleCategory = (
    category: (typeof CATEGORY_OPTIONS)[number]["value"],
  ) => {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
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
    value: string | boolean,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    for (const [index, tc] of validTestCases.entries()) {
      const pIn = tryParseJson(tc.input);
      const pEx = tryParseJson(tc.expected);
      if (!pIn.ok || !pEx.ok) {
        toast.error(`Test case ${index + 1} must be valid JSON.`);
        return;
      }
      parsedCases.push({
        input: pIn.data,
        expected: pEx.data,
        ignoreArrayOrder: tc.ignoreArrayOrder,
        isHidden: tc.isHidden,
      });
    }

    try {
      const created = await createMutation.mutateAsync({
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
        visibility,
        courseId,
        lessonId,
      } satisfies CreateInstructorProblemRequest);

      const id =
        (created as { _id?: string; id?: string })._id ??
        (created as { _id?: string; id?: string }).id;
      if (!id) throw new Error("Server did not return a problem id");
      onCreated({ id, title: draft.title.trim() });
    } catch (err) {
      console.error(err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        (err instanceof Error ? err.message : "Failed to create problem");
      toast.error(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        placeholder="Problem title"
        value={draft.title}
        onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
      />
      <Textarea
        placeholder="Problem description"
        value={draft.description}
        rows={3}
        onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
      />
      <Textarea
        placeholder="Constraints"
        value={draft.constraints}
        rows={2}
        onChange={(e) => setDraft((p) => ({ ...p, constraints: e.target.value }))}
      />
      <Input
        placeholder="Function name (e.g., twoSum)"
        value={draft.functionName}
        onChange={(e) =>
          setDraft((p) => ({ ...p, functionName: e.target.value }))
        }
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          placeholder="Time limit (ms)"
          value={draft.timeLimit}
          onChange={(e) =>
            setDraft((p) => ({ ...p, timeLimit: Number(e.target.value) }))
          }
        />
        <Input
          type="number"
          placeholder="Memory limit (MB)"
          value={draft.memoryLimit}
          onChange={(e) =>
            setDraft((p) => ({ ...p, memoryLimit: Number(e.target.value) }))
          }
        />
      </div>
      <label className="flex items-center gap-2 rounded-md border px-3 py-2">
        <Checkbox
          checked={draft.allowUnorderedArrayOutput}
          onCheckedChange={(checked) =>
            setDraft((p) => ({
              ...p,
              allowUnorderedArrayOutput: Boolean(checked),
            }))
          }
        />
        <span className="text-sm">Allow unordered array outputs by default</span>
      </label>

      <VisibilityField
        value={visibility}
        onChange={setVisibility}
        resourceLabel="problem"
        managementLabel="Problem Solving library"
        disabled={createMutation.isPending}
      />

      <div className="space-y-2">
        <p className="text-sm font-semibold">Difficulty</p>
        <RadioGroup
          value={draft.difficulty}
          onValueChange={(v) =>
            setDraft((p) => ({
              ...p,
              difficulty: v as ProblemDraft["difficulty"],
            }))
          }
          className="flex flex-wrap gap-5"
        >
          {(["easy", "medium", "hard"] as const).map((level) => (
            <div key={level} className="flex items-center gap-2">
              <RadioGroupItem
                value={level}
                id={`inline-prob-diff-${level}`}
              />
              <Label htmlFor={`inline-prob-diff-${level}`} className="capitalize">
                {level}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Categories</p>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <Checkbox
                checked={draft.categories.includes(opt.value)}
                onCheckedChange={() => toggleCategory(opt.value)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Test Cases</p>
          <Button type="button" size="sm" variant="outline" onClick={addTestCase}>
            <Plus className="mr-1 h-4 w-4" /> Add case
          </Button>
        </div>
        {testCases.map((tc, idx) => (
          <Card key={`tc-${idx}`} className="py-3">
            <CardContent className="space-y-2 px-3">
              <Input
                placeholder={`Case ${idx + 1} input (JSON, e.g. [1,2,3])`}
                value={tc.input}
                onChange={(e) => updateTestCase(idx, "input", e.target.value)}
              />
              <Input
                placeholder={`Case ${idx + 1} expected (JSON)`}
                value={tc.expected}
                onChange={(e) => updateTestCase(idx, "expected", e.target.value)}
              />
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={Boolean(tc.ignoreArrayOrder)}
                  onCheckedChange={(checked) =>
                    updateTestCase(idx, "ignoreArrayOrder", Boolean(checked))
                  }
                />
                <span className="text-xs text-muted-foreground">
                  Ignore array order
                </span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={Boolean(tc.isHidden)}
                  onCheckedChange={(checked) =>
                    updateTestCase(idx, "isHidden", Boolean(checked))
                  }
                />
                <span className="text-xs text-muted-foreground">
                  Hidden from students
                </span>
              </label>
              {testCases.length > 1 ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeTestCase(idx)}
                >
                  Remove case
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={createMutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
            </>
          ) : (
            "Create & attach"
          )}
        </Button>
      </div>
    </form>
  );
}
