import API from "@/services/axios-client";
import {
  createQuizType,
  createQuizTypeResponse,
  updateQuizType,
  updateQuizTypeResponse,
  deleteQuizTypeResponse,

  getAllQuizzesTypeResponse,
  getQuizByIdTypeResponse,
  submitQuizType,
  submitQuizTypeResponse,
  getAttemptsTypeResponse,
  getSpecificAttemptTypeResponse,
} from "@/types/api/student/lms/quizzes/quiz.type";

// ========== Quiz Managment for Instructor ==========
export const createNewQuizMutationFn = async (
  userId: string,
  quizData: createQuizType
): Promise<createQuizTypeResponse> => {
  const response = await API.post(`/lms/quizzes/${userId}`, quizData);
  return response.data;
};

export const updateQuizMutationFn = async (
  userId: string,
  quizId: string,
  quizData: updateQuizType,
): Promise<updateQuizTypeResponse> => {
  const response = await API.patch(`/lms/quizzes/${userId}/${quizId}`, quizData);
  return response.data;
};

export const deleteQuizMutationFn = async (
  userId: string,
  quizId: string,
): Promise<deleteQuizTypeResponse> => {
  const response = await API.delete(`/lms/quizzes/${userId}/${quizId}`);
  return response.data;
};

export const getInstructorQuizzesMutationFn = async (
  userId: string,
): Promise<getAllQuizzesTypeResponse> => {
  const response = await API.get(`/lms/quizzes/${userId}`);
  return response.data;
};

// ========== Quiz View & Submit for Student ==========
export const getAllQuizzesMutationFn = async (): Promise<getAllQuizzesTypeResponse> => {
  const response = await API.get(`/lms/quizzes/getAllQuizzes`);
  return response.data;
};

export const getQuizByIdMutationFn = async (
  id: string,
): Promise<getQuizByIdTypeResponse> => {
  const response = await API.get(`/lms/quizzes/${id}`);
  return response.data;
};

export const submitQuizMutationFn = async (
  id: string,
  answers: submitQuizType,
): Promise<submitQuizTypeResponse> => {
  const response = await API.post(`/lms/quizzes/${id}/submit`, answers);
  return response.data;
};

export const getAttemptsMutationFn = async (
  attemptId: string,
): Promise<getAttemptsTypeResponse> => {
  const response = await API.get(`/lms/quizzes/attempts/${attemptId}`);
  return response.data;
};

export const getSpecificAttemptMutationFn = async (
  quizId: string,
): Promise<getSpecificAttemptTypeResponse> => {
  const response = await API.get(`/lms/quizzes/${quizId}/my-attempts`);
  return response.data;
};