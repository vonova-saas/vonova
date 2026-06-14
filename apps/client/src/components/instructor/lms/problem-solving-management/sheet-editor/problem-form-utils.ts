import type { InstructorProblemEntity } from "@/types/api/instructor/lms/problem-solving/problem-solving.type";

export type TestCaseDraft = {
  input: string;
  expected: string;
  ignoreArrayOrder?: boolean;
  isHidden?: boolean;
};

export type ProblemDraft = {
  title: string;
  description: string;
  constraints: string;
  functionName: string;
  /** Comma-separated parameter names shown in the editor; e.g. "nums, target" */
  parameterNames: string;
  allowUnorderedArrayOutput: boolean;
  timeLimit: number;
  memoryLimit: number;
  difficulty: "easy" | "medium" | "hard";
  categories: (
    | "arrays"
    | "strings"
    | "hashmap"
    | "math"
    | "dp"
    | "recursion"
    | "sorting"
  )[];
};

export const EMPTY_PROBLEM_DRAFT: ProblemDraft = {
  title: "",
  description: "",
  constraints: "",
  functionName: "",
  parameterNames: "",
  allowUnorderedArrayOutput: false,
  timeLimit: 2000,
  memoryLimit: 128,
  difficulty: "easy",
  categories: [],
};

export const CATEGORY_OPTIONS = [
  { value: "arrays", label: "Arrays" },
  { value: "strings", label: "Strings" },
  { value: "hashmap", label: "Hashmap" },
  { value: "math", label: "Math" },
  { value: "dp", label: "DP" },
  { value: "recursion", label: "Recursion" },
  { value: "sorting", label: "Sorting" },
] as const;

export function tryParseJson(
  value: string,
): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(value) as unknown };
  } catch {
    return { ok: false };
  }
}

export function inferParameterNames(input: unknown): string[] {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const keys = Object.keys(input as Record<string, unknown>).filter(Boolean);
    if (keys.length > 0) return keys;
  }
  if (Array.isArray(input)) {
    return input.map((_, index) => `arg${index + 1}`);
  }
  return ["input"];
}

export function problemToDraft(problem: InstructorProblemEntity): ProblemDraft {
  return {
    title: problem.title,
    description: problem.description,
    constraints: problem.constraints,
    functionName: problem.functionName,
    parameterNames: (problem as unknown as { parameterNames?: string[] })
      .parameterNames?.join(", ") ?? "",
    allowUnorderedArrayOutput: Boolean(problem.allowUnorderedArrayOutput),
    timeLimit: problem.timeLimit ?? 2000,
    memoryLimit: problem.memoryLimit ?? 128,
    difficulty: problem.difficulty,
    categories: problem.categories,
  };
}

export function problemToTestCases(problem: InstructorProblemEntity): TestCaseDraft[] {
  return (problem.testCases ?? []).map((testCase) => ({
    input: JSON.stringify(testCase.input),
    expected: JSON.stringify(testCase.expected),
    ignoreArrayOrder: testCase.ignoreArrayOrder,
    isHidden: testCase.isHidden,
  }));
}
