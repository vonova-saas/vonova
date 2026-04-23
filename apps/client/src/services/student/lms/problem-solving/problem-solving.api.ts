"use client";

import type {
  AIInteractionEntity,
  HintRequest,
  ProblemEntity,
  SolutionRequest,
  SubmissionEntity,
  SubmissionRequest,
} from "@/types/api/student/lms/problem-solving/problem-solving.type";
import { problemSolvingClient } from "./problem-solving.client";

const STUDENT_BASE = "/api/v1/student";

export const getProblemsQueryFn = async (): Promise<ProblemEntity[]> => {
  const response = await problemSolvingClient.get<ProblemEntity[]>(
    `${STUDENT_BASE}/problems`,
  );
  return response.data;
};

export const getProblemByIdQueryFn = async (
  problemId: string,
): Promise<ProblemEntity> => {
  const response = await problemSolvingClient.get<ProblemEntity>(
    `${STUDENT_BASE}/problems/${problemId}`,
  );
  return response.data;
};

export const createSubmissionMutationFn = async (
  payload: SubmissionRequest,
): Promise<SubmissionEntity> => {
  const response = await problemSolvingClient.post<SubmissionEntity>(
    `${STUDENT_BASE}/submissions`,
    payload,
  );
  return response.data;
};

export const requestHintMutationFn = async (
  payload: HintRequest,
): Promise<AIInteractionEntity> => {
  const response = await problemSolvingClient.post<AIInteractionEntity>(
    `${STUDENT_BASE}/problems/${payload.problemId}/hint`,
    {
      code: payload.code,
      languageHint: payload.languageHint ?? "english",
    },
  );
  return response.data;
};

export const requestSolutionMutationFn = async (
  payload: SolutionRequest,
): Promise<AIInteractionEntity> => {
  const response = await problemSolvingClient.post<AIInteractionEntity>(
    `${STUDENT_BASE}/problems/${payload.problemId}/solution`,
    {
      language: payload.language ?? "typescript",
    },
  );
  return response.data;
};

