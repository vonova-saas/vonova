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
  quizData: createQuizType
): Promise<createQuizTypeResponse> => {
  const response = await API.post(`/api/v1/lms/quizzes/addQuiz`, quizData);
  return response.data;
};

export const updateQuizMutationFn = async (
  quizId: string,
  quizData: updateQuizType,
): Promise<updateQuizTypeResponse> => {
  const response = await API.put(`/api/v1/lms/quizzes/updateQuiz/${quizId}`, quizData);
  return response.data;
};

export const deleteQuizMutationFn = async (
  quizId: string,
): Promise<deleteQuizTypeResponse> => {
  const response = await API.delete(`/api/v1/lms/quizzes/deleteQuiz/${quizId}`);
  return response.data;
};

// ========== Quiz View & Submit for Student ==========
export const getAllQuizzesMutationFn = async (): Promise<getAllQuizzesTypeResponse> => {
  const response = await API.get(`/api/v1/lms/quizzes/getAllQuizzes`);
  return response.data;
};

export const getQuizByIdMutationFn = async (
  quizId: string,
): Promise<getQuizByIdTypeResponse> => {
  const response = await API.get(`/api/v1/lms/quizzes/getQuiz/${quizId}`);
  return response.data;
};

export const submitQuizMutationFn = async (
  quizId: string,
  answers: submitQuizType,
): Promise<submitQuizTypeResponse> => {
  const response = await API.post(`/api/v1/lms/quizzes/${quizId}/submit`, answers);
  return response.data;
};

export const getAttemptsMutationFn = async (
  quizId: string,
): Promise<getAttemptsTypeResponse> => {
  const response = await API.get(`/api/v1/lms/quizzes/${quizId}/my-attempts`);
  return response.data;
};

export const getSpecificAttemptMutationFn = async (
  attemptId: string,
): Promise<getSpecificAttemptTypeResponse> => {
  const response = await API.get(`/api/v1/lms/quizzes/attempts/${attemptId}`);
  return response.data;
};