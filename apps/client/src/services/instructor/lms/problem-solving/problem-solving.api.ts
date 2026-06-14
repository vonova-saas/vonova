import API from "@/services/axios-client";
import type {
  CreateInstructorProblemRequest,
  DeleteInstructorProblemResponse,
  InstructorProblemEntity,
} from "@/types/api/instructor/lms/problem-solving/problem-solving.type";
import type { SheetProblemSummary } from "@/types/api/instructor/lms/problem-solving/sheet-problem.type";

const INSTRUCTOR_PROBLEMS_BASE = "/api/v1/instructor/problems";
const INSTRUCTOR_SHEETS_BASE = "/api/v1/problem-solving/sheets";
const PROBLEM_SOLVING_PROBLEMS_BASE = "/api/v1/problem-solving/problems";

export type ProblemSheetEntity = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  status: "draft" | "published";
  visibility?: "private" | "public";
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  courseId?: string | null;
  chapterId?: string | null;
  lessonId?: string | null;
  totalQuestions?: number;
  problems?: SheetProblemSummary[];
  completionCount?: number;
  timerMinutes?: number | null;
  estimatedDuration?: number | null;
  dueDate?: string | null;
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UpsertProblemSheetRequest = {
  title: string;
  slug?: string;
  description?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  courseId?: string | null;
  chapterId?: string | null;
  lessonId?: string | null;
  visibility?: "private" | "public";
  estimatedDuration?: number | null;
  timerMinutes?: number | null;
  dueDate?: string | null;
  coverImage?: string;
};

export const getInstructorProblemSheetsQueryFn = async (): Promise<
  ProblemSheetEntity[]
> => {
  const response = await API.get<ProblemSheetEntity[]>(INSTRUCTOR_SHEETS_BASE);
  return response.data;
};

export const getInstructorProblemSheetByIdQueryFn = async (
  sheetId: string,
): Promise<ProblemSheetEntity> => {
  const response = await API.get<ProblemSheetEntity>(
    `${INSTRUCTOR_SHEETS_BASE}/${sheetId}`,
  );
  return response.data;
};

export const createInstructorProblemSheetMutationFn = async (
  payload: UpsertProblemSheetRequest,
): Promise<ProblemSheetEntity> => {
  const response = await API.post<ProblemSheetEntity>(
    INSTRUCTOR_SHEETS_BASE,
    payload,
  );
  return response.data;
};

export const updateInstructorProblemSheetMutationFn = async ({
  sheetId,
  payload,
}: {
  sheetId: string;
  payload: Partial<UpsertProblemSheetRequest> & { status?: "draft" | "published" };
}): Promise<ProblemSheetEntity> => {
  const response = await API.patch<ProblemSheetEntity>(
    `${INSTRUCTOR_SHEETS_BASE}/${sheetId}`,
    payload,
  );
  return response.data;
};

export const publishInstructorProblemSheetMutationFn = async ({
  sheetId,
  publish,
}: {
  sheetId: string;
  publish: boolean;
}): Promise<ProblemSheetEntity> => {
  const response = await API.patch<ProblemSheetEntity>(
    `${INSTRUCTOR_SHEETS_BASE}/${sheetId}/publish`,
    { status: publish ? "published" : "draft" },
  );
  return response.data;
};

export const duplicateInstructorProblemSheetMutationFn = async (
  sheetId: string,
): Promise<ProblemSheetEntity> => {
  const response = await API.post<ProblemSheetEntity>(
    `${INSTRUCTOR_SHEETS_BASE}/${sheetId}/duplicate`,
  );
  return response.data;
};

export const deleteInstructorProblemSheetMutationFn = async (
  sheetId: string,
): Promise<{ ok: boolean }> => {
  const response = await API.delete<{ ok: boolean }>(
    `${INSTRUCTOR_SHEETS_BASE}/${sheetId}`,
  );
  return response.data;
};

/** Shared key; `list` avoids cache collisions with map-shaped lesson-editor data. */
export const instructorLessonEditorProblemsQueryKey = [
  "instructor-lesson-editor",
  "problems",
  "list",
] as const;

export const getInstructorProblemsQueryFn = async (): Promise<
  InstructorProblemEntity[]
> => {
  const response = await API.get<InstructorProblemEntity[]>(
    INSTRUCTOR_PROBLEMS_BASE,
  );
  return response.data;
};

export const createInstructorProblemMutationFn = async (
  payload: CreateInstructorProblemRequest,
): Promise<InstructorProblemEntity> => {
  const response = await API.post<InstructorProblemEntity>(
    INSTRUCTOR_PROBLEMS_BASE,
    payload,
  );
  return response.data;
};

export const getInstructorProblemByIdQueryFn = async (
  problemId: string,
): Promise<InstructorProblemEntity> => {
  const response = await API.get<InstructorProblemEntity>(
    `${INSTRUCTOR_PROBLEMS_BASE}/${problemId}`,
  );
  return response.data;
};

/** Full problem document for sheet editor edit/preview (lazy load). */
export const getProblemSolvingProblemByIdQueryFn = async (
  problemId: string,
): Promise<InstructorProblemEntity> => {
  const response = await API.get<InstructorProblemEntity>(
    `${PROBLEM_SOLVING_PROBLEMS_BASE}/${problemId}`,
  );
  return response.data;
};

export const deleteInstructorProblemMutationFn = async (
  problemId: string,
): Promise<DeleteInstructorProblemResponse> => {
  const response = await API.delete<DeleteInstructorProblemResponse>(
    `${INSTRUCTOR_PROBLEMS_BASE}/${problemId}`,
  );
  return response.data;
};

// Sheet problem APIs
export const createProblemInSheetMutationFn = async ({
  sheetId,
  payload,
}: {
  sheetId: string;
  payload: CreateInstructorProblemRequest;
}): Promise<InstructorProblemEntity> => {
  const response = await API.post<InstructorProblemEntity>(
    `${INSTRUCTOR_SHEETS_BASE}/${sheetId}/problems`,
    payload,
  );
  return response.data;
};

export const updateProblemInSheetMutationFn = async ({
  sheetId,
  problemId,
  payload,
}: {
  sheetId: string;
  problemId: string;
  payload: Partial<CreateInstructorProblemRequest>;
}): Promise<InstructorProblemEntity> => {
  const response = await API.patch<InstructorProblemEntity>(
    `${INSTRUCTOR_SHEETS_BASE}/${sheetId}/problems/${problemId}`,
    payload,
  );
  return response.data;
};

export const deleteProblemInSheetMutationFn = async ({
  sheetId,
  problemId,
}: {
  sheetId: string;
  problemId: string;
}): Promise<DeleteInstructorProblemResponse> => {
  const response = await API.delete<DeleteInstructorProblemResponse>(
    `${INSTRUCTOR_SHEETS_BASE}/${sheetId}/problems/${problemId}`,
  );
  return response.data;
};
