"use client";

import {
  createInstructorProblemMutationFn,
  deleteInstructorProblemMutationFn,
  getInstructorProblemByIdQueryFn,
  getInstructorProblemsQueryFn,
} from "@/services/instructor/lms/problem-solving/problem-solving.api";
import type { CreateInstructorProblemRequest } from "@/types/api/instructor/lms/problem-solving/problem-solving.type";
import { useMutation, useQuery } from "@tanstack/react-query";

export const instructorProblemSolvingKeys = {
  all: ["instructor-problem-solving"] as const,
  list: () => [...instructorProblemSolvingKeys.all, "list"] as const,
  detail: (problemId: string) =>
    [...instructorProblemSolvingKeys.all, "detail", problemId] as const,
};

export const useInstructorProblemsQuery = () =>
  useQuery({
    queryKey: instructorProblemSolvingKeys.list(),
    queryFn: getInstructorProblemsQueryFn,
  });

export const useCreateInstructorProblemMutation = () =>
  useMutation({
    mutationFn: (payload: CreateInstructorProblemRequest) =>
      createInstructorProblemMutationFn(payload),
  });

export const useInstructorProblemByIdQuery = (problemId: string) =>
  useQuery({
    queryKey: instructorProblemSolvingKeys.detail(problemId),
    queryFn: () => getInstructorProblemByIdQueryFn(problemId),
    enabled: Boolean(problemId),
  });

export const useDeleteInstructorProblemMutation = () =>
  useMutation({
    mutationFn: (problemId: string) => deleteInstructorProblemMutationFn(problemId),
  });

