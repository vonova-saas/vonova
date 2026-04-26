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
} from "@/services/student/lms/problem-solving/problem-solving.api";
import type {
  HintRequest,
  ProblemsFilter,
  SolutionRequest,
  SubmissionRequest,
} from "@/types/api/student/lms/problem-solving/problem-solving.type";
import { useMutation, useQuery } from "@tanstack/react-query";

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

export const useMarkAsSolvedMutation = () =>
  useMutation({
    mutationFn: (problemId: string) => markProblemAsSolvedMutationFn(problemId),
  });

export const useSolvedProblemsQuery = () =>
  useQuery({
    queryKey: problemSolvingKeys.solved(),
    queryFn: () => getSolvedProblemsQueryFn(),
  });
