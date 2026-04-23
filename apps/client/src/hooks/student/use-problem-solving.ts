"use client";

import {
  createSubmissionMutationFn,
  getProblemByIdQueryFn,
  getProblemsQueryFn,
  requestHintMutationFn,
  requestSolutionMutationFn,
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
  submissions: (problemId: string) =>
    [...problemSolvingKeys.all, "submissions", problemId] as const,
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

export const useSolutionMutation = () =>
  useMutation({
    mutationFn: (payload: SolutionRequest) => requestSolutionMutationFn(payload),
  });

