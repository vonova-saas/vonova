'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllQuizzesMutationFn,
  getQuizByIdMutationFn,
  submitQuizMutationFn,
  getStudentQuizAttemptsMutationFn,
  getQuizAttemptByIdMutationFn,
} from '@/services/student/lms/quizzes/quiz.api';
import type { submitQuizType } from '@/types/api/student/lms/quizzes/quiz.type';

// Query Keys
export const quizzesKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizzesKeys.all, 'list'] as const,
  detail: (quizId: string) => [...quizzesKeys.all, 'detail', quizId] as const,
  attempts: () => [...quizzesKeys.all, 'attempts'] as const,
  attempt: (attemptId: string) => [...quizzesKeys.all, 'attempt', attemptId] as const,
};

// Browse Quizzes
export const useAllQuizzes = () => {
  return useQuery({
    queryKey: quizzesKeys.lists(),
    queryFn: getAllQuizzesMutationFn,
    staleTime: 5 * 60 * 1000,
  });
};

export const useQuizById = (quizId: string) => {
  return useQuery({
    queryKey: quizzesKeys.detail(quizId),
    queryFn: () => getQuizByIdMutationFn(quizId),
    enabled: !!quizId,
    staleTime: 5 * 60 * 1000,
  });
};

// Quiz Attempts
export const useStudentQuizAttempts = () => {
  return useQuery({
    queryKey: quizzesKeys.attempts(),
    queryFn: () => getStudentQuizAttemptsMutationFn(),
  });
};

export const useQuizAttemptById = (attemptId: string) => {
  return useQuery({
    queryKey: quizzesKeys.attempt(attemptId),
    queryFn: () => getQuizAttemptByIdMutationFn(attemptId),
    enabled: !!attemptId,
  });
};

// Submit Quiz
export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, answers }: { quizId: string; answers: submitQuizType }) => 
      submitQuizMutationFn(quizId, answers),
    onSuccess: (_, variables) => {
      toast.success('Quiz submitted successfully!');
      queryClient.invalidateQueries({ queryKey: quizzesKeys.attempts() });
      queryClient.invalidateQueries({ queryKey: quizzesKeys.detail(variables.quizId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to submit quiz');
    },
  });
};
