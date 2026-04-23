export type ProblemTestCase = {
  input: unknown;
  expected: unknown;
  ignoreArrayOrder?: boolean;
  isHidden?: boolean;
};

export type ProblemEntity = {
  _id: string;
  title: string;
  description: string;
  constraints: string;
  functionName: string;
  allowUnorderedArrayOutput?: boolean;
  timeLimit?: number;
  memoryLimit?: number;
  testCases: ProblemTestCase[];
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
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProblemsFilter = {
  difficulty?: "easy" | "medium" | "hard";
  category?: ProblemEntity["categories"][number];
};

export type SubmissionRequest = {
  problemId: string;
  code: string;
  language: string;
};

export type SubmissionEntity = {
  _id: string;
  userId: string;
  problemId: string;
  code: string;
  language: string;
  status:
    | "pending"
    | "accepted"
    | "wrong_answer"
    | "runtime_error"
    | "time_limit_exceeded"
    | "memory_limit_exceeded";
  success: boolean;
  passed: number;
  total: number;
  failedCases: Array<{
    input: unknown;
    expected: unknown;
    output?: unknown;
    error?: string;
  }>;
  executionTime: number;
  memoryUsed: number;
  judgeLogs?: string[];
  createdAt: string;
};

export type SubmissionJobEntity = {
  jobId: string;
  status: "pending";
};

export type HintRequest = {
  problemId: string;
  code: string;
  languageHint?: string;
};

export type SolutionRequest = {
  problemId: string;
  language?: string;
};

export type AIInteractionEntity = {
  _id: string;
  userId: string;
  problemId: string;
  type: "hint" | "solution";
  level?: 1 | 2 | 3;
  response: string;
  createdAt: string;
  hintsUsed?: number;
  hintsRemaining?: number;
  solutionUsed?: boolean;
};

export type StoredHintEntity = {
  level: 1 | 2 | 3;
  response: string;
  language: "english" | "arabic";
  createdAt: string;
};

export type HintsHistoryEntity = {
  userId: string;
  problemId: string;
  hintsUsed: number;
  hintsRemaining: number;
  solutionUsed: boolean;
  hints: StoredHintEntity[];
};

