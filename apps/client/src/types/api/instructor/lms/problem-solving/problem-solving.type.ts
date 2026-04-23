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
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateInstructorProblemRequest = {
  title: string;
  description: string;
  constraints: string;
  testCases: InstructorProblemTestCase[];
};

export type DeleteInstructorProblemResponse = {
  success: boolean;
  message: string;
};

