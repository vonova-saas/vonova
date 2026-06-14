"use client";

import {
  createSubmissionMutationFn,
  getHintsHistoryQueryFn,
  getProblemByIdQueryFn,
  getProblemsQueryFn,
  getSubmissionStatusQueryFn,
  requestHintMutationFn,
  requestSolutionMutationFn,
  markProblemAsSolvedMutationFn,
  getSolvedProblemsQueryFn,
  getStudentProblemSheetByIdQueryFn,
  getStudentProblemSheetsQueryFn,
  getSheetProgressQueryFn,
  patchSheetProgressMutationFn,
  getProblemProgressQueryFn,
} from "@/services/student/lms/problem-solving/problem-solving.api";
import type {
  HintRequest,
  ProblemsFilter,
  SolutionRequest,
  SubmissionRequest,
} from "@/types/api/student/lms/problem-solving/problem-solving.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const problemSolvingKeys = {
  all: ["problem-solving"] as const,
  problems: (filters?: ProblemsFilter) =>
    [...problemSolvingKeys.all, "problems", filters ?? {}] as const,
  problem: (problemId: string) =>
    [...problemSolvingKeys.all, "problem", problemId] as const,
  hints: (problemId: string) => [...problemSolvingKeys.all, "hints", problemId] as const,
  submissions: (problemId: string) =>
    [...problemSolvingKeys.all, "submissions", problemId] as const,
  submissionStatus: (jobId: string) =>
    [...problemSolvingKeys.all, "submission-status", jobId] as const,
  solved: () => [...problemSolvingKeys.all, "solved"] as const,
  sheets: () => [...problemSolvingKeys.all, "sheets"] as const,
  sheet: (sheetId: string) => [...problemSolvingKeys.all, "sheet", sheetId] as const,
  sheetProgress: (sheetId: string) =>
    [...problemSolvingKeys.all, "sheet-progress", sheetId] as const,
  problemProgress: (problemId: string) =>
    [...problemSolvingKeys.all, "problem-progress", problemId] as const,
};

export const useProblemsQuery = (filters?: ProblemsFilter) =>
  useQuery({
    queryKey: problemSolvingKeys.problems(filters),
    queryFn: () => getProblemsQueryFn(filters),
  });

export const useProblemQuery = (problemId: string) =>
  useQuery({
    queryKey: problemSolvingKeys.problem(problemId),
    queryFn: () => getProblemByIdQueryFn(problemId),
    enabled: Boolean(problemId),
  });

export const useSubmitSolutionMutation = () =>
  useMutation({
    mutationFn: (payload: SubmissionRequest) => createSubmissionMutationFn(payload),
  });

export const useHintMutation = () =>
  useMutation({
    mutationFn: (payload: HintRequest) => requestHintMutationFn(payload),
  });

export const useHintsHistoryQuery = (problemId: string) =>
  useQuery({
    queryKey: problemSolvingKeys.hints(problemId),
    queryFn: () => getHintsHistoryQueryFn(problemId),
    enabled: Boolean(problemId),
  });

export const useSolutionMutation = () =>
  useMutation({
    mutationFn: (payload: SolutionRequest) => requestSolutionMutationFn(payload),
  });

export const useSubmissionStatusQuery = (jobId: string) =>
  useQuery({
    queryKey: problemSolvingKeys.submissionStatus(jobId),
    queryFn: () => getSubmissionStatusQueryFn(jobId),
    enabled: Boolean(jobId),
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? 1200 : false,
  });

export const useMarkAsSolvedMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (problemId: string) => markProblemAsSolvedMutationFn(problemId),
    onSuccess: (_data, problemId) => {
      void queryClient.invalidateQueries({ queryKey: problemSolvingKeys.solved() });
      void queryClient.invalidateQueries({
        queryKey: problemSolvingKeys.problemProgress(problemId),
      });
    },
  });
};

export const useSheetProgressQuery = (sheetId: string) =>
  useQuery({
    queryKey: problemSolvingKeys.sheetProgress(sheetId),
    queryFn: () => getSheetProgressQueryFn(sheetId),
    enabled: Boolean(sheetId),
  });

export const usePatchSheetProgressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sheetId,
      currentProblemIndex,
    }: {
      sheetId: string;
      currentProblemIndex: number;
    }) => patchSheetProgressMutationFn(sheetId, { currentProblemIndex }),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(problemSolvingKeys.sheetProgress(vars.sheetId), data);
    },
  });
};

export const useProblemProgressQuery = (problemId: string) =>
  useQuery({
    queryKey: problemSolvingKeys.problemProgress(problemId),
    queryFn: () => getProblemProgressQueryFn(problemId),
    enabled: Boolean(problemId),
  });

export const useSolvedProblemsQuery = () =>
  useQuery({
    queryKey: problemSolvingKeys.solved(),
    queryFn: () => getSolvedProblemsQueryFn(),
  });

export const useStudentProblemSheetsQuery = () =>
  useQuery({
    queryKey: problemSolvingKeys.sheets(),
    queryFn: () => getStudentProblemSheetsQueryFn(),
  });

export const useStudentProblemSheetQuery = (sheetId: string) =>
  useQuery({
    queryKey: problemSolvingKeys.sheet(sheetId),
    queryFn: () => getStudentProblemSheetByIdQueryFn(sheetId),
    enabled: Boolean(sheetId),
  });
