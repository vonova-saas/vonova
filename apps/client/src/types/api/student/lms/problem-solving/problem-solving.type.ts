export type ProblemTestCase = {
  input: string;
  output: string;
};

export type ProblemEntity = {
  _id: string;
  title: string;
  description: string;
  constraints: string;
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
  status: "accepted" | "wrong_answer";
  failedTestCase: ProblemTestCase | null;
  createdAt: string;
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
};

