import { create } from "zustand";
import {
  getAllQuizzesMutationFn,
  getQuizByIdMutationFn,
  createNewQuizMutationFn,
  updateQuizMutationFn,
  deleteQuizMutationFn,
  getInstructorQuizzesMutationFn,
  getStudentQuizAttemptsMutationFn,
} from "@/services/student/lms/quizzes/quiz.api";
import type {
  QuizType,
  createQuizType,
  updateQuizType,
  getAttemptsTypeResponse,
} from "@/types/api/student/lms/quizzes/quiz.type";

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
      const list = (res as { data: QuizType[] }).data || [];
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
    const cached = get().quizzesById[id];
    if (cached) return cached;
    set({ loading: true, error: null });
    try {
      const res = await getQuizByIdMutationFn(id);
      const quiz = (res as { data: QuizType }).data;
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
      const res = await getStudentQuizAttemptsMutationFn(quizId);
      const raw = (res as getAttemptsTypeResponse).data as unknown;
      const arr = Array.isArray(raw) ? raw : [raw];
      const attempts: AttemptSummary[] = arr.map((a) => ({
        id: (a).id,
        score: (a).score,
        total: (a).total,
        percentage: (a).percentage,
        submittedAt: (a).submittedAt || (a).updatedAt || (a).createdAt,
      }));
      attempts.sort((a, b) => (Date.parse(b.submittedAt || "0") - Date.parse(a.submittedAt || "0")));
      set((st) => ({ attemptsByQuizId: { ...st.attemptsByQuizId, [quizId]: attempts } }));
      return attempts;
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
