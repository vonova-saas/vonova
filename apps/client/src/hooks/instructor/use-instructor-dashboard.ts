"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQuizStore } from "@/lib/stores";
import { useInstructorCourses } from "@/hooks/instructor/use-courses";
import {
  getInstructorProblemsQueryFn,
  instructorLessonEditorProblemsQueryKey,
} from "@/services/instructor/lms/problem-solving/problem-solving.api";
import {
  fetchInstructorLessonEditorLibraryQueryFn,
  instructorLessonEditorLibraryQueryKey,
} from "@/services/api/shared/material-library/material.api";
import type { Course } from "@/types/api/lms/courses.type";
import type { QuizType } from "@/types/api/student/lms/quizzes/quiz.type";
import type { InstructorProblemEntity } from "@/types/api/instructor/lms/problem-solving/problem-solving.type";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function lastNMonths(n: number): { label: string; year: number; month: number }[] {
  const now = new Date();
  const out: { label: string; year: number; month: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1);
    out.push({
      label: MONTHS[d.getUTCMonth()],
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
    });
  }
  return out;
}

function categoryFor(course: Course): string {
  if (course.category && course.category.trim()) return course.category.trim();
  if (course.level) return course.level;
  return "Uncategorized";
}

export type InstructorDashboardData = {
  isLoading: boolean;

  courses: Course[];
  quizzes: QuizType[];
  problems: InstructorProblemEntity[];
  libraryCount: number;

  stats: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalQuizzes: number;
    totalQuestions: number;
    totalProblems: number;
    libraryItems: number;
  };

  /** Monthly output: number of resources (courses + problems) created per month. */
  monthlyOutput: { month: string; value: number }[];

  /** Workload distribution by resource type. */
  workloadDistribution: {
    name: string;
    value: number;
    color: string;
  }[];

  /** Courses grouped by category, count. Used for bar chart. */
  coursesByCategory: { area: string; count: number }[];
};

export function useInstructorDashboardData(): InstructorDashboardData {
  // Quizzes via existing store
  const {
    quizzesById,
    allIds,
    loading: quizLoading,
    fetchInstructorQuizzes,
  } = useQuizStore();

  useEffect(() => {
    void fetchInstructorQuizzes();
  }, [fetchInstructorQuizzes]);

  // Courses
  const coursesQ = useInstructorCourses();
  // Problems
  const problemsQ = useQuery({
    queryKey: instructorLessonEditorProblemsQueryKey,
    queryFn: getInstructorProblemsQueryFn,
    staleTime: 60_000,
  });
  // Library
  const libraryQ = useQuery({
    queryKey: instructorLessonEditorLibraryQueryKey,
    queryFn: fetchInstructorLessonEditorLibraryQueryFn,
    staleTime: 60_000,
  });

  const quizzes = useMemo<QuizType[]>(
    () => allIds.map((id) => quizzesById[id]).filter(Boolean) as QuizType[],
    [allIds, quizzesById],
  );
  const courses = useMemo<Course[]>(() => coursesQ.data ?? [], [coursesQ.data]);
  const problems = useMemo<InstructorProblemEntity[]>(
    () => problemsQ.data ?? [],
    [problemsQ.data],
  );
  const libraryCount = useMemo(() => libraryQ.data?.length ?? 0, [libraryQ.data]);

  const stats = useMemo(() => {
    const totalQuestions = quizzes.reduce(
      (sum, q) => sum + (Array.isArray(q.questions) ? q.questions.length : 0),
      0,
    );
    return {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.status === "PUBLISHED").length,
      draftCourses: courses.filter((c) => c.status === "DRAFT").length,
      totalQuizzes: quizzes.length,
      totalQuestions,
      totalProblems: problems.length,
      libraryItems: libraryCount,
    };
  }, [courses, quizzes, problems, libraryCount]);

  const monthlyOutput = useMemo(() => {
    const buckets = lastNMonths(7).map((m) => ({ ...m, value: 0 }));
    const addOne = (ts: string | undefined) => {
      if (!ts) return;
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return;
      const idx = buckets.findIndex(
        (b) => b.year === d.getUTCFullYear() && b.month === d.getUTCMonth(),
      );
      if (idx >= 0) buckets[idx].value += 1;
    };
    for (const c of courses) addOne(c.createdAt);
    for (const p of problems) addOne(p.createdAt);
    for (const q of quizzes) {
      const ts = (q as { createdAt?: string }).createdAt;
      addOne(ts);
    }
    return buckets.map((b) => ({ month: b.label, value: b.value }));
  }, [courses, problems, quizzes]);

  const workloadDistribution = useMemo(() => {
    const rows = [
      { name: "Courses", value: stats.totalCourses, color: "#4f6bff" },
      { name: "Quizzes", value: stats.totalQuizzes, color: "#24d05a" },
      { name: "Problems", value: stats.totalProblems, color: "#2b8fff" },
      { name: "Materials", value: stats.libraryItems, color: "#7e53ff" },
    ];
    const hasAny = rows.some((r) => r.value > 0);
    if (!hasAny) {
      return rows.map((r) => ({ ...r, value: 0 }));
    }
    return rows;
  }, [stats]);

  const coursesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of courses) {
      const key = categoryFor(c);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [courses]);

  return {
    isLoading:
      quizLoading || coursesQ.isLoading || problemsQ.isLoading || libraryQ.isLoading,
    courses,
    quizzes,
    problems,
    libraryCount,
    stats,
    monthlyOutput,
    workloadDistribution,
    coursesByCategory,
  };
}
