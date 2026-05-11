import API from "@/services/axios-client";
import { unwrapLmsData } from "@/lib/api/unwrap-lms-body";

export type AttachMaterialBody = {
  materialId: string;
  materialType: "book" | "guide" | "presentation";
  visibility?: "PUBLIC" | "PRIVATE";
};

export async function attachLessonMaterialMutationFn(
  courseId: string,
  lessonId: string,
  body: AttachMaterialBody,
) {
  const res = await API.post(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/materials`,
    body,
  );
  return unwrapLmsData(res.data);
}

export async function detachLessonMaterialMutationFn(
  courseId: string,
  lessonId: string,
  materialId: string,
) {
  const res = await API.delete(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/materials/${materialId}`,
  );
  return unwrapLmsData(res.data);
}

export async function reorderLessonMaterialsMutationFn(
  courseId: string,
  lessonId: string,
  orderedMaterialIds: string[],
) {
  const res = await API.patch(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/materials/reorder`,
    { orderedMaterialIds },
  );
  return unwrapLmsData(res.data);
}

export async function attachLessonQuizMutationFn(
  courseId: string,
  lessonId: string,
  quizId: string,
) {
  const res = await API.post(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/quizzes`,
    { quizId },
  );
  return unwrapLmsData(res.data);
}

export async function detachLessonQuizMutationFn(
  courseId: string,
  lessonId: string,
  quizId: string,
) {
  const res = await API.delete(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/quizzes/${quizId}`,
  );
  return unwrapLmsData(res.data);
}

export async function attachLessonProblemMutationFn(
  courseId: string,
  lessonId: string,
  problemId: string,
) {
  const res = await API.post(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/problems`,
    { problemId },
  );
  return unwrapLmsData(res.data);
}

export async function detachLessonProblemMutationFn(
  courseId: string,
  lessonId: string,
  problemId: string,
) {
  const res = await API.delete(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/problems/${problemId}`,
  );
  return unwrapLmsData(res.data);
}

export async function reorderLessonQuizzesMutationFn(
  courseId: string,
  lessonId: string,
  orderedQuizIds: string[],
) {
  const res = await API.patch(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/quizzes/reorder`,
    { orderedQuizIds },
  );
  return unwrapLmsData(res.data);
}

export async function reorderLessonProblemsMutationFn(
  courseId: string,
  lessonId: string,
  orderedProblemIds: string[],
) {
  const res = await API.patch(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/problems/reorder`,
    { orderedProblemIds },
  );
  return unwrapLmsData(res.data);
}
