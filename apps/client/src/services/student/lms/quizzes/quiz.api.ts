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
} from "@/types/api/student/lms/quizzes/quiz.type";

const LMS_QUIZZES_INSTRUCTOR = "/lms/instructor/quizzes";
const LMS_QUIZZES_STUDENT = "/lms/student/quizzes";

/** Backend DTOs expect `noOfQuestions` as a number; UI forms use string inputs. */
function withNumericQuestionCount<T extends { noOfQuestions?: string | number; questions: unknown[] }>(
  body: T,
): T & { noOfQuestions: number } {
  const raw = body.noOfQuestions;
  const parsed =
    raw === undefined || raw === ""
      ? NaN
      : typeof raw === "number"
        ? raw
        : parseInt(String(raw).trim(), 10);
  const fallback = Math.max(1, body.questions?.length ?? 1);
  const n = Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
  return { ...body, noOfQuestions: n };
}

// ========== Instructor (creator) — manage quizzes ==========

export const createNewQuizMutationFn = async (
  quizData: createQuizType,
): Promise<createQuizTypeResponse> => {
  const body = withNumericQuestionCount(quizData);
  const response = await API.post<createQuizTypeResponse>(`${LMS_QUIZZES_INSTRUCTOR}`, body);
  return response.data;
};

export const updateQuizMutationFn = async (
  quizId: string,
  quizData: updateQuizType,
): Promise<updateQuizTypeResponse> => {
  const qid = quizId?.trim();
  if (!qid) {
    throw new Error("Quiz ID is required");
  }
  const body = withNumericQuestionCount(quizData);
  const response = await API.patch<updateQuizTypeResponse>(`${LMS_QUIZZES_INSTRUCTOR}/${qid}`, body);
  return response.data;
};

export const deleteQuizMutationFn = async (
  quizId: string,
): Promise<deleteQuizTypeResponse> => {
  const qid = quizId?.trim();
  if (!qid) {
    throw new Error("Quiz ID is required");
  }
  const response = await API.delete<deleteQuizTypeResponse>(`${LMS_QUIZZES_INSTRUCTOR}/${qid}`);
  return response.data;
};

/** Quizzes created by the authenticated instructor. */
export const getInstructorQuizzesMutationFn = async (): Promise<getAllQuizzesTypeResponse> => {
  const response = await API.get<getAllQuizzesTypeResponse>(`${LMS_QUIZZES_INSTRUCTOR}`);
  return response.data;
};

// ========== Student — browse & take quizzes ==========

export const getAllQuizzesMutationFn = async (): Promise<getAllQuizzesTypeResponse> => {
  const response = await API.get<getAllQuizzesTypeResponse>(`${LMS_QUIZZES_STUDENT}`);
  return response.data;
};

/** Single quiz by its id — uses `/quiz/:quizId` so it is not confused with “all quizzes for user”. */
export const getQuizByIdMutationFn = async (
  quizId: string,
): Promise<getQuizByIdTypeResponse> => {
  const qid = quizId?.trim();
  if (!qid) {
    throw new Error("Quiz ID is required");
  }
  const response = await API.get<getQuizByIdTypeResponse>(`${LMS_QUIZZES_STUDENT}/${qid}`);
  return response.data;
};

export const submitQuizMutationFn = async (
  quizId: string,
  answers: submitQuizType,
): Promise<submitQuizTypeResponse> => {
  const qid = quizId?.trim();
  if (!qid) {
    throw new Error("Quiz ID is required");
  }
  const response = await API.post<submitQuizTypeResponse>(`${LMS_QUIZZES_STUDENT}/${qid}/submit`, answers);
  return response.data;
};

/** One attempt record by attempt id (not quiz id). */
export const getQuizAttemptByIdMutationFn = async (
  attemptId: string,
): Promise<getAttemptsTypeResponse> => {
  const aid = attemptId?.trim();
  if (!aid) {
    throw new Error("Attempt ID is required");
  }
  const response = await API.get<getAttemptsTypeResponse>(`${LMS_QUIZZES_STUDENT}/attempts/${aid}`);
  return response.data;
};

export const getStudentQuizAttemptsMutationFn = async (
  quizId?: string,
): Promise<getAttemptsTypeResponse> => {
  // Student APIs expose attempts at `/lms/student/quizzes/attempts` (not `/:quizId/attempts`).
  // We always use the global endpoint and filter/group client-side when needed.
  void quizId;
  const response = await API.get<getAttemptsTypeResponse>(`${LMS_QUIZZES_STUDENT}/attempts`);
  return response.data;
};
