/**
 * External AI microservice for generating quiz question text.
 * This is **not** the Vonova LMS quiz CRUD API (`/api/v1/lms/quizzes` in `student/lms/quizzes/quiz.api.ts`).
 * It does not take instructor/student user ids in the URL — only topic/level/counts in the request body.
 */
import axios from "axios";
import { CustomError } from "@/types/error/custom-error.type";

const AI_QUIZ_API_BASE_URL = process.env.NEXT_PUBLIC_AI_QUIZ_GENERATION_API_BASE;

const aiQuizAPI = axios.create({
  baseURL: AI_QUIZ_API_BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

aiQuizAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }
    const { data, status } = error.response;
    
    const customError: CustomError = {
      ...error,
      errorCode: data?.errorCode || `AI_QUIZ_ERROR_${status}`,
      message: data?.message || "Failed to generate quiz with AI",
    };
    
    return Promise.reject(customError);
  }
);

export interface GenerateQuizRequest {
  topic: string;
  total_questions: number;
  mc_questions: number;
  tf_questions: number;
  level: "easy" | "medium" | "hard" | string;
}

export interface GenerateQuizResponse {
  topic: string;
  level: string;
  total_questions: number;
  questions: string[];
}

export const generateQuizWithAIMutationFn = async (
  data: GenerateQuizRequest
): Promise<GenerateQuizResponse> => {
  const response = await aiQuizAPI.post<GenerateQuizResponse>("/generate-quiz", data);
  return response.data;
};
