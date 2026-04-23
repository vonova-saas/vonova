export type InstructorProblemTestCase = {
  input: unknown;
  expected: unknown;
  ignoreArrayOrder?: boolean;
  isHidden?: boolean;
};

export type InstructorProblemEntity = {
  _id: string;
  title: string;
  description: string;
  constraints: string;
  functionName: string;
  allowUnorderedArrayOutput?: boolean;
  timeLimit?: number;
  memoryLimit?: number;
  testCases: InstructorProblemTestCase[];
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

export type CreateInstructorProblemRequest = {
  title: string;
  description: string;
  constraints: string;
  functionName: string;
  allowUnorderedArrayOutput?: boolean;
  timeLimit?: number;
  memoryLimit?: number;
  testCases: InstructorProblemTestCase[];
  difficulty: InstructorProblemEntity["difficulty"];
  categories: InstructorProblemEntity["categories"];
};

export type DeleteInstructorProblemResponse = {
  success: boolean;
  message: string;
};

