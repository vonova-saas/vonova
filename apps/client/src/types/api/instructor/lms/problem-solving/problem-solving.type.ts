export type InstructorProblemTestCase = {
  input: string;
  output: string;
};

export type InstructorProblemEntity = {
  _id: string;
  title: string;
  description: string;
  constraints: string;
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
  testCases: InstructorProblemTestCase[];
  difficulty: InstructorProblemEntity["difficulty"];
  categories: InstructorProblemEntity["categories"];
};

export type DeleteInstructorProblemResponse = {
  success: boolean;
  message: string;
};

