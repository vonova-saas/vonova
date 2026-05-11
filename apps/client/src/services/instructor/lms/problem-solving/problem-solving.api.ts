import API from "@/services/axios-client";
import type {
  CreateInstructorProblemRequest,
  DeleteInstructorProblemResponse,
  InstructorProblemEntity,
} from "@/types/api/instructor/lms/problem-solving/problem-solving.type";

const INSTRUCTOR_PROBLEMS_BASE = "/instructor/problems";

/** Shared key; `list` avoids cache collisions with map-shaped lesson-editor data. */
export const instructorLessonEditorProblemsQueryKey = [
  "instructor-lesson-editor",
  "problems",
  "list",
] as const;

export const getInstructorProblemsQueryFn = async (): Promise<
  InstructorProblemEntity[]
> => {
  const response = await API.get<InstructorProblemEntity[]>(
    INSTRUCTOR_PROBLEMS_BASE,
  );
  return response.data;
};

export const createInstructorProblemMutationFn = async (
  payload: CreateInstructorProblemRequest,
): Promise<InstructorProblemEntity> => {
  const response = await API.post<InstructorProblemEntity>(
    INSTRUCTOR_PROBLEMS_BASE,
    payload,
  );
  return response.data;
};

export const getInstructorProblemByIdQueryFn = async (
  problemId: string,
): Promise<InstructorProblemEntity> => {
  const response = await API.get<InstructorProblemEntity>(
    `${INSTRUCTOR_PROBLEMS_BASE}/${problemId}`,
  );
  return response.data;
};

export const deleteInstructorProblemMutationFn = async (
  problemId: string,
): Promise<DeleteInstructorProblemResponse> => {
  const response = await API.delete<DeleteInstructorProblemResponse>(
    `${INSTRUCTOR_PROBLEMS_BASE}/${problemId}`,
  );
  return response.data;
};

