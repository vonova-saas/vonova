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

/**
 * LMS quiz HTTP API (gateway: `/api/v1/lms/quizzes`).
 *
 * Path segments use **creator id** (instructor) vs **student id** explicitly — they must not be swapped:
 * - Creator routes: `POST|PATCH|DELETE|GET .../:instructorId...` — the account that owns/manages quizzes.
 * - Student routes: `GET .../:studentUserId/:quizId/my-attempts` — the account taking the quiz.
 * - Quiz identity: `GET .../quiz/:quizId` — fetch one quiz by its document id (not a user id).
 */
const LMS_QUIZZES = "/lms/quizzes";

function assertInstructorId(instructorId: string | undefined): string {
  const id = instructorId?.trim();
  if (!id) {
    throw new Error("Instructor (creator) ID is required");
  }
  return id;
}

function assertStudentUserId(studentUserId: string | undefined): string {
  const id = studentUserId?.trim();
  if (!id) {
    throw new Error("Student user ID is required");
  }
  return id;
}

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
  instructorId: string,
  quizData: createQuizType,
): Promise<createQuizTypeResponse> => {
  const uid = assertInstructorId(instructorId);
  const body = withNumericQuestionCount(quizData);
  const response = await API.post<createQuizTypeResponse>(`${LMS_QUIZZES}/${uid}`, body);
  return response.data;
};

export const updateQuizMutationFn = async (
  instructorId: string,
  quizId: string,
  quizData: updateQuizType,
): Promise<updateQuizTypeResponse> => {
  const uid = assertInstructorId(instructorId);
  const qid = quizId?.trim();
  if (!qid) {
    throw new Error("Quiz ID is required");
  }
  const body = withNumericQuestionCount(quizData);
  const response = await API.patch<updateQuizTypeResponse>(`${LMS_QUIZZES}/${uid}/${qid}`, body);
  return response.data;
};

export const deleteQuizMutationFn = async (
  instructorId: string,
  quizId: string,
): Promise<deleteQuizTypeResponse> => {
  const uid = assertInstructorId(instructorId);
  const qid = quizId?.trim();
  if (!qid) {
    throw new Error("Quiz ID is required");
  }
  const response = await API.delete<deleteQuizTypeResponse>(`${LMS_QUIZZES}/${uid}/${qid}`);
  return response.data;
};

/** Quizzes created by this instructor (creator id in path). */
export const getInstructorQuizzesMutationFn = async (
  instructorId: string,
): Promise<getAllQuizzesTypeResponse> => {
  const uid = assertInstructorId(instructorId);
  const response = await API.get<getAllQuizzesTypeResponse>(`${LMS_QUIZZES}/${uid}`);
  return response.data;
};

// ========== Student — browse & take quizzes ==========

export const getAllQuizzesMutationFn = async (): Promise<getAllQuizzesTypeResponse> => {
  const response = await API.get<getAllQuizzesTypeResponse>(`${LMS_QUIZZES}/getAllQuizzes`);
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
  const response = await API.get<getQuizByIdTypeResponse>(`${LMS_QUIZZES}/quiz/${qid}`);
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
  const response = await API.post<submitQuizTypeResponse>(`${LMS_QUIZZES}/${qid}/submit`, answers);
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
  const response = await API.get<getAttemptsTypeResponse>(`${LMS_QUIZZES}/attempts/${aid}`);
  return response.data;
};

/**
 * All attempts by this **student** for a given quiz.
 * Gateway: `GET /{studentUserId}/{quizId}/my-attempts`
 */
export const getStudentQuizAttemptsMutationFn = async (
  studentUserId: string,
  quizId: string,
): Promise<getAttemptsTypeResponse> => {
  const sid = assertStudentUserId(studentUserId);
  const qid = quizId?.trim();
  if (!qid) {
    throw new Error("Quiz ID is required");
  }
  const response = await API.get<getAttemptsTypeResponse>(
    `${LMS_QUIZZES}/${sid}/${qid}/my-attempts`,
  );
  return response.data;
};
