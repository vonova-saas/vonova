import { create } from "zustand";
import {
  getAllQuizzesMutationFn,
  getQuizByIdMutationFn,
  getInstructorQuizByIdMutationFn,
  createNewQuizMutationFn,
  updateQuizMutationFn,
  deleteQuizMutationFn,
  getInstructorQuizzesMutationFn,
  getStudentQuizAttemptsMutationFn,
  normalizeQuizAttemptsResponse,
  getAttemptRecordId,
} from "@/services/student/lms/quizzes/quiz.api";
import type {
  QuizType,
  createQuizType,
  updateQuizType,
} from "@/types/api/student/lms/quizzes/quiz.type";

let attemptsHydrated = false;
let attemptsHydrationPromise: Promise<void> | null = null;

function getAttemptQuizId(attempt: unknown): string {
  if (!attempt || typeof attempt !== "object") return "";
  const quizValue = (attempt as { quiz?: unknown; quizId?: unknown }).quiz
    ?? (attempt as { quizId?: unknown }).quizId;
  if (quizValue && typeof quizValue === "object") {
    return String((quizValue as { _id?: string })._id ?? "");
  }
  return String(quizValue ?? "");
}

export type AttemptSummary = {
  id?: string;
  score: number;
  total: number;
  percentage: number;
  submittedAt?: string;
};

type QuizStore = {
  quizzesById: Record<string, QuizType>;
  allIds: string[];
  attemptsByQuizId: Record<string, AttemptSummary[]>;
  loading: boolean;
  error: string | null;
  // actions
  fetchAll: () => Promise<void>;
  fetchInstructorQuizzes: () => Promise<void>;
  fetchById: (id: string) => Promise<QuizType | undefined>;
  createQuiz: (payload: createQuizType) => Promise<QuizType | undefined>;
  updateQuiz: (id: string, payload: updateQuizType) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  fetchAttempts: (quizId: string) => Promise<AttemptSummary[]>;
  getLatestAttempt: (quizId: string) => AttemptSummary | null;
  clearError: () => void;
};

export const useQuizStore = create<QuizStore>((set, get) => ({
  quizzesById: {},
  allIds: [],
  attemptsByQuizId: {},
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getAllQuizzesMutationFn();
      const list = Array.isArray(res)
        ? res
        : (res as { data?: QuizType[] })?.data ?? [];
      const map: Record<string, QuizType> = {};
      const ids: string[] = [];
      for (const q of list) {
        map[q._id] = q;
        ids.push(q._id);
      }
      set({ quizzesById: map, allIds: ids });
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to load quizzes" });
    } finally {
      set({ loading: false });
    }
  },

  fetchInstructorQuizzes: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getInstructorQuizzesMutationFn();

      // Handle different response structures
      let list: QuizType[] = [];
      if (res && res.data && Array.isArray(res.data)) {
        list = res.data;
      } else if (res && Array.isArray(res)) {
        list = res;
      } else {
        console.warn("Unexpected response structure:", res);
        list = [];
      }

      const map: Record<string, QuizType> = {};
      const ids: string[] = [];
      for (const q of list) {
        map[q._id] = q;
        ids.push(q._id);
      }
      set({ quizzesById: map, allIds: ids });
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to load instructor quizzes" });
    } finally {
      set({ loading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      let rawQuizResponse: unknown;
      try {
        rawQuizResponse = await getQuizByIdMutationFn(id);
      } catch {
        try {
          // Instructor edit pages can access quizzes that aren't available on student endpoints.
          rawQuizResponse = await getInstructorQuizByIdMutationFn(id);
        } catch {
          // Some backends expose only "list instructor quizzes" + PATCH by id.
          const instructorRes = await getInstructorQuizzesMutationFn();
          const instructorList = Array.isArray(instructorRes)
            ? instructorRes
            : (instructorRes as { data?: QuizType[] })?.data ?? [];
          const matchedQuiz = instructorList.find((q) => q._id === id);
          if (!matchedQuiz) {
            throw new Error("Quiz not found");
          }
          rawQuizResponse = matchedQuiz;
        }
      }
      const quiz = ((rawQuizResponse as { data?: QuizType })?.data ?? rawQuizResponse) as QuizType;
      set((st) => ({ quizzesById: { ...st.quizzesById, [quiz._id]: quiz }, allIds: st.allIds.includes(quiz._id) ? st.allIds : [...st.allIds, quiz._id] }));
      return quiz;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to load quiz" });
      return undefined;
    } finally {
      set({ loading: false });
    }
  },

  createQuiz: async (payload: createQuizType) => {
    set({ loading: true, error: null });
    try {
      const res = await createNewQuizMutationFn(payload);
      const created = (res as { data: QuizType }).data as unknown as QuizType;
      set((st) => ({
        quizzesById: { ...st.quizzesById, [created._id]: created },
        allIds: st.allIds.includes(created._id) ? st.allIds : [created._id, ...st.allIds],
      }));
      return created;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to create quiz" });
      return undefined;
    } finally {
      set({ loading: false });
    }
  },

  updateQuiz: async (id: string, payload: updateQuizType) => {
    set({ loading: true, error: null });
    try {
      await updateQuizMutationFn(id, payload);
      // optimistic: merge into cache
      set((st) => ({
        quizzesById: st.quizzesById[id]
          ? { ...st.quizzesById, [id]: { ...st.quizzesById[id], ...payload } as QuizType }
          : st.quizzesById,
      }));
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to update quiz" });
    } finally {
      set({ loading: false });
    }
  },

  deleteQuiz: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteQuizMutationFn(id);
      set((st) => {
        const rest = { ...st.quizzesById };
        delete rest[id];
        return { quizzesById: rest, allIds: st.allIds.filter((x) => x !== id) };
      });
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to delete quiz" });
    } finally {
      set({ loading: false });
    }
  },

  fetchAttempts: async (quizId: string) => {
    try {
      const cached = get().attemptsByQuizId[quizId];
      if (cached) return cached;
      if (attemptsHydrated) return [];

      if (!attemptsHydrationPromise) {
        attemptsHydrationPromise = (async () => {
          const res = await getStudentQuizAttemptsMutationFn();
          const arr = normalizeQuizAttemptsResponse(res);
          const grouped: Record<string, AttemptSummary[]> = {};

          for (const a of arr) {
            const targetQuizId = getAttemptQuizId(a);
            if (!targetQuizId) continue;
            const mapped: AttemptSummary = {
              id: getAttemptRecordId(a) || undefined,
              score: Number((a as { score?: number }).score ?? 0),
              total: Number((a as { total?: number }).total ?? 0),
              percentage: Number((a as { percentage?: number }).percentage ?? 0),
              submittedAt:
                (a as { submittedAt?: string; updatedAt?: string; createdAt?: string }).submittedAt
                || (a as { submittedAt?: string; updatedAt?: string; createdAt?: string }).updatedAt
                || (a as { submittedAt?: string; updatedAt?: string; createdAt?: string }).createdAt,
            };
            grouped[targetQuizId] = grouped[targetQuizId] ?? [];
            grouped[targetQuizId].push(mapped);
          }

          for (const key of Object.keys(grouped)) {
            grouped[key].sort((a, b) => Date.parse(b.submittedAt || "0") - Date.parse(a.submittedAt || "0"));
          }

          set((st) => ({ attemptsByQuizId: { ...st.attemptsByQuizId, ...grouped } }));
          attemptsHydrated = true;
        })().finally(() => {
          attemptsHydrationPromise = null;
        });
      }

      await attemptsHydrationPromise;
      return get().attemptsByQuizId[quizId] ?? [];
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to load attempts" });
      return [];
    }
  },

  getLatestAttempt: (quizId: string) => {
    const list = get().attemptsByQuizId[quizId];
    return list && list.length ? list[0] : null;
  },
}));
