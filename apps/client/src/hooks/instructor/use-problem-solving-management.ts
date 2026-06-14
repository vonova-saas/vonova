"use client";

import { useRouter } from "next/navigation";
import {
  createInstructorProblemMutationFn,
  createInstructorProblemSheetMutationFn,
  deleteInstructorProblemSheetMutationFn,
  deleteInstructorProblemMutationFn,
  duplicateInstructorProblemSheetMutationFn,
  getInstructorProblemByIdQueryFn,
  getInstructorProblemSheetByIdQueryFn,
  getInstructorProblemSheetsQueryFn,
  getInstructorProblemsQueryFn,
  getProblemSolvingProblemByIdQueryFn,
  publishInstructorProblemSheetMutationFn,
  updateInstructorProblemSheetMutationFn,
} from "@/services/instructor/lms/problem-solving/problem-solving.api";
import type { CreateInstructorProblemRequest } from "@/types/api/instructor/lms/problem-solving/problem-solving.type";
import { useMutation, useQuery } from "@tanstack/react-query";

export const instructorProblemSolvingKeys = {
  all: ["instructor-problem-solving"] as const,
  list: () => [...instructorProblemSolvingKeys.all, "list"] as const,
  sheets: () => [...instructorProblemSolvingKeys.all, "sheets"] as const,
  sheet: (sheetId: string) =>
    [...instructorProblemSolvingKeys.all, "sheets", sheetId] as const,
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

export const useProblemSolvingProblemQuery = (problemId: string, enabled = true) =>
  useQuery({
    queryKey: [...instructorProblemSolvingKeys.detail(problemId), "full"] as const,
    queryFn: () => getProblemSolvingProblemByIdQueryFn(problemId),
    enabled: Boolean(problemId) && enabled,
    staleTime: 30_000,
  });

export const useDeleteInstructorProblemMutation = () =>
  useMutation({
    mutationFn: (problemId: string) => deleteInstructorProblemMutationFn(problemId),
  });

export const useInstructorProblemSheetsQuery = () =>
  useQuery({
    queryKey: instructorProblemSolvingKeys.sheets(),
    queryFn: getInstructorProblemSheetsQueryFn,
  });

export const useInstructorProblemSheetQuery = (sheetId: string) =>
  useQuery({
    queryKey: instructorProblemSolvingKeys.sheet(sheetId),
    queryFn: () => getInstructorProblemSheetByIdQueryFn(sheetId),
    enabled: Boolean(sheetId),
    staleTime: 60_000,
  });

export const useCreateInstructorProblemSheetMutation = () =>
  useMutation({
    mutationFn: createInstructorProblemSheetMutationFn,
  });

export const useCreateInstructorProblemSheetMutationWithRedirect = (
  instructorId: string,
) => {
  const router = useRouter();

  return useMutation({
    mutationFn: createInstructorProblemSheetMutationFn,
    onSuccess: (data) => {
      // Auto-redirect to sheet editor after creation
      const sheetId = data?._id;
      if (!sheetId) {
        console.error("Sheet ID not found in response:", data);
        return;
      }

      const editorUrl = `/instructor/${instructorId}/problem-solving-management/sheets/${sheetId}/editor`;

      try {
        router.push(editorUrl);
      } catch (error) {
        console.error("Failed to navigate to sheet editor:", error);
        // Fallback to window.location if router.push fails
        window.location.href = editorUrl;
      }
    },
  });
};

export const usePublishInstructorProblemSheetMutation = () =>
  useMutation({
    mutationFn: publishInstructorProblemSheetMutationFn,
  });

export const useUpdateInstructorProblemSheetMutation = () =>
  useMutation({
    mutationFn: updateInstructorProblemSheetMutationFn,
  });

export const useDuplicateInstructorProblemSheetMutation = () =>
  useMutation({
    mutationFn: duplicateInstructorProblemSheetMutationFn,
  });

export const useDeleteInstructorProblemSheetMutation = () =>
  useMutation({
    mutationFn: deleteInstructorProblemSheetMutationFn,
  });

