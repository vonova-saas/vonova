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
