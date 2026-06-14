"use client";

import API from "@/services/axios-client";
import type {
  AIInteractionEntity,
  HintRequest,
  HintsHistoryEntity,
  ProblemEntity,
  ProblemsFilter,
  SolutionRequest,
  SubmissionEntity,
  SubmissionJobEntity,
  SubmissionRequest,
} from "@/types/api/student/lms/problem-solving/problem-solving.type";

const STUDENT_BASE = "/student";

export const getProblemsQueryFn = async (
  filters?: ProblemsFilter,
): Promise<ProblemEntity[]> => {
  const response = await API.get<ProblemEntity[]>(
    `${STUDENT_BASE}/problems`,
    { params: filters },
  );
  return response.data;
};

export const getProblemByIdQueryFn = async (
  problemId: string,
): Promise<ProblemEntity> => {
  const response = await API.get<ProblemEntity>(
    `${STUDENT_BASE}/problems/${problemId}`,
  );
  return response.data;
};

export const createSubmissionMutationFn = async (
  payload: SubmissionRequest,
): Promise<SubmissionJobEntity> => {
  const response = await API.post<SubmissionJobEntity>(
    `${STUDENT_BASE}/submissions`,
    payload,
  );
  return response.data;
};

export const getSubmissionStatusQueryFn = async (
  jobId: string,
): Promise<SubmissionEntity> => {
  const response = await API.get<SubmissionEntity>(
    `${STUDENT_BASE}/submissions/${jobId}`,
  );
  return response.data;
};

export const requestHintMutationFn = async (
  payload: HintRequest,
): Promise<AIInteractionEntity> => {
  const response = await API.post<AIInteractionEntity>(
    `${STUDENT_BASE}/problems/${payload.problemId}/hint`,
    {
      code: payload.code,
      languageHint: payload.languageHint ?? "english",
    },
  );
  return response.data;
};

export const getHintsHistoryQueryFn = async (
  problemId: string,
): Promise<HintsHistoryEntity> => {
  const response = await API.get<HintsHistoryEntity>(
    `${STUDENT_BASE}/problems/${problemId}/hints`,
  );
  return response.data;
};

export const requestSolutionMutationFn = async (
  payload: SolutionRequest,
): Promise<AIInteractionEntity> => {
  const response = await API.post<AIInteractionEntity>(
    `${STUDENT_BASE}/problems/${payload.problemId}/solution`,
    {
      language: payload.language ?? "typescript",
    },
  );
  return response.data;
};

export const markProblemAsSolvedMutationFn = async (
  problemId: string,
): Promise<boolean> => {
  const response = await API.post<boolean>(
    `${STUDENT_BASE}/problems/${problemId}/solved`,
  );
  return response.data;
};

export const getSolvedProblemsQueryFn = async (): Promise<string[]> => {
  const response = await API.get<string[]>(`${STUDENT_BASE}/solved-problems`);
  return response.data;
};

export type ProblemSheetEntity = {
  _id: string;
  title: string;
  description?: string;
  status: "draft" | "published";
  visibility?: "private" | "public";
  tags?: string[];
  problems?: Array<{
    _id: string;
    title: string;
    difficulty: string;
    tags?: string[];
    order?: number;
    status?: string;
  }>;
  embeddedQuestions?: Array<{
    title: string;
    description?: string;
    difficulty?: "easy" | "medium" | "hard";
  }>;
  totalQuestions?: number;
  timerMinutes?: number | null;
  dueDate?: string | null;
  updatedAt?: string;
};

export const getStudentProblemSheetsQueryFn = async (): Promise<
  ProblemSheetEntity[]
> => {
  const response = await API.get<ProblemSheetEntity[]>(
    `${STUDENT_BASE}/problem-sheets`,
  );
  return response.data;
};

export const getStudentProblemSheetByIdQueryFn = async (
  sheetId: string,
): Promise<ProblemSheetEntity> => {
  const response = await API.get<ProblemSheetEntity>(
    `${STUDENT_BASE}/problem-sheets/${sheetId}`,
  );
  return response.data;
};

export type ProblemProgressRecord = {
  studentId: string;
  problemId: string;
  solved: boolean;
  solvedAt: string | null;
  attemptsCount: number;
  lastSubmissionStatus: string | null;
};

export type SheetProblemProgressItem = {
  problemId: string;
  solved: boolean;
  solvedAt: string | null;
  attemptsCount: number;
  lastSubmissionStatus: string | null;
};

export type SheetProgressRecord = {
  studentId: string;
  sheetId: string;
  solvedProblemsCount: number;
  totalProblems: number;
  completionPercentage: number;
  completed: boolean;
  completedAt: string | null;
  lastOpenedAt: string | null;
  currentProblemIndex: number;
  solvedProblemIds: string[];
  problemProgress: SheetProblemProgressItem[];
};

export const getSheetProgressQueryFn = async (
  sheetId: string,
): Promise<SheetProgressRecord> => {
  const response = await API.get<SheetProgressRecord>(
    `/problem-solving/sheets/${sheetId}/progress`,
  );
  return response.data;
};

export const patchSheetProgressMutationFn = async (
  sheetId: string,
  body: { currentProblemIndex?: number },
): Promise<SheetProgressRecord> => {
  const response = await API.patch<SheetProgressRecord>(
    `/problem-solving/sheets/${sheetId}/progress`,
    body,
  );
  return response.data;
};

export const getProblemProgressQueryFn = async (
  problemId: string,
): Promise<ProblemProgressRecord> => {
  const response = await API.get<ProblemProgressRecord>(
    `/problem-solving/problems/${problemId}/progress`,
  );
  return response.data;
};

export const patchProblemProgressMutationFn = async (
  problemId: string,
  body: {
    solved?: boolean;
    lastSubmissionStatus?: string;
    attemptsCount?: number;
  },
): Promise<ProblemProgressRecord> => {
  const response = await API.patch<ProblemProgressRecord>(
    `/problem-solving/problems/${problemId}/progress`,
    body,
  );
  return response.data;
};
