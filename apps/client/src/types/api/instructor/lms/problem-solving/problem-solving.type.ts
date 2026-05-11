export type InstructorProblemTestCase = {
  input: unknown;
  expected: unknown;
  ignoreArrayOrder?: boolean;
  isHidden?: boolean;
};

export type InstructorProblemVisibility = "PUBLIC" | "PRIVATE";

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
  /** PUBLIC = appears in Problem Solving library; PRIVATE = course-scoped. */
  visibility?: InstructorProblemVisibility;
  courseId?: string | null;
  lessonId?: string | null;
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
  /** PUBLIC = global; PRIVATE = course-only (requires `courseId`). */
  visibility?: InstructorProblemVisibility;
  /** Course this problem belongs to when private. */
  courseId?: string;
  /** Optional lesson back-reference for the editor. */
  lessonId?: string;
};

export type DeleteInstructorProblemResponse = {
  success: boolean;
  message: string;
};

