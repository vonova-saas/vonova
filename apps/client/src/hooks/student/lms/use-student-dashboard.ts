"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getMyEnrollmentsQueryFn,
  type StudentEnrollmentRow,
} from "@/services/student/lms/courses/real-courses.api";
import { useStudentQuizAttempts } from "@/hooks/student/lms/use-quizzes";
import { useMyFavorites } from "@/hooks/student/lms/use-materials";
import type { StudentQuizAttempt } from "@/types/api/student/lms/quizzes/quiz.type";

const MONTH_LABELS = [
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

export type StudentDashboardData = {
  isLoading: boolean;
  isError: boolean;

  enrollments: StudentEnrollmentRow[];
  attempts: StudentQuizAttempt[];
  favoritesCount: number;

  stats: {
    coursesEnrolled: number;
    coursesCompleted: number;
    coursesInProgress: number;
    averageProgress: number;
    quizzesCompleted: number;
    averageQuizScore: number;
    booksFavorited: number;
  };

  /** Last 7 months: count of quiz attempts per month. */
  monthlyAttempts: { month: string; attempts: number }[];

  /** Per-course progress, sorted desc. Used by the Progress section + Activity bar. */
  perCourseProgress: {
    courseId: string;
    title: string;
    slug: string;
    progress: number;
    status: string;
  }[];

  /** Distribution of activity across categories for the pie chart. */
  activityDistribution: {
    name: "Courses" | "Quizzes" | "Library" | "Community";
    value: number;
  }[];

  /** Recent activity items (sorted desc by time). */
  recentActivity: {
    id: string;
    kind: "quiz" | "course";
    title: string;
    subtitle: string;
    timestamp: string;
    score?: number | null;
  }[];
};

function startOfDayUTC(d: Date): Date {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  return x;
}

function lastNMonths(n: number): { label: string; year: number; month: number }[] {
  const now = new Date();
  const out: { label: string; year: number; month: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1);
    out.push({
      label: MONTH_LABELS[d.getUTCMonth()],
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
    });
  }
  return out;
}

export function useStudentDashboardData(): StudentDashboardData {
  const enrollmentsQ = useQuery({
    queryKey: ["my-enrollments", "dashboard"],
    queryFn: getMyEnrollmentsQueryFn,
    staleTime: 60_000,
  });
  const attemptsQ = useStudentQuizAttempts();
  const favoritesQ = useMyFavorites();

  const enrollments = useMemo(
    () => (enrollmentsQ.data ?? []).filter((r) => Boolean(r.course?._id)),
    [enrollmentsQ.data],
  );
  const attempts = useMemo<StudentQuizAttempt[]>(() => {
    const raw = attemptsQ.data?.data;
    return Array.isArray(raw) ? raw : [];
  }, [attemptsQ.data]);

  const favoritesCount = useMemo(() => {
    const raw = favoritesQ.data as
      | { data?: unknown[] }
      | unknown[]
      | undefined;
    if (Array.isArray(raw)) return raw.length;
    if (raw && Array.isArray(raw.data)) return raw.data.length;
    return 0;
  }, [favoritesQ.data]);

  const stats = useMemo(() => {
    const coursesEnrolled = enrollments.length;
    const coursesCompleted = enrollments.filter(
      (e) => e.status === "COMPLETED" || (e.progress ?? 0) >= 100,
    ).length;
    const coursesInProgress = enrollments.filter(
      (e) =>
        e.status !== "COMPLETED" &&
        (e.progress ?? 0) > 0 &&
        (e.progress ?? 0) < 100,
    ).length;
    const averageProgress = coursesEnrolled
      ? Math.round(
          enrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0) /
            coursesEnrolled,
        )
      : 0;
    const quizzesCompleted = attempts.length;
    const averageQuizScore = quizzesCompleted
      ? Math.round(
          attempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) /
            quizzesCompleted,
        )
      : 0;

    return {
      coursesEnrolled,
      coursesCompleted,
      coursesInProgress,
      averageProgress,
      quizzesCompleted,
      averageQuizScore,
      booksFavorited: favoritesCount,
    };
  }, [enrollments, attempts, favoritesCount]);

  const monthlyAttempts = useMemo(() => {
    const buckets = lastNMonths(7).map((m) => ({
      ...m,
      attempts: 0,
    }));
    for (const a of attempts) {
      const ts = a.createdAt ?? a.submittedAt;
      if (!ts) continue;
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) continue;
      const idx = buckets.findIndex(
        (b) => b.year === d.getUTCFullYear() && b.month === d.getUTCMonth(),
      );
      if (idx >= 0) buckets[idx].attempts += 1;
    }
    return buckets.map((b) => ({ month: b.label, attempts: b.attempts }));
  }, [attempts]);

  const perCourseProgress = useMemo(() => {
    return enrollments
      .map((e) => ({
        courseId: e.course._id,
        title: e.course.title,
        slug: e.course.slug,
        progress: e.progress ?? 0,
        status: e.status,
      }))
      .sort((a, b) => b.progress - a.progress);
  }, [enrollments]);

  const activityDistribution = useMemo(() => {
    const courses = stats.coursesEnrolled;
    const quizzes = stats.quizzesCompleted;
    const library = stats.booksFavorited;
    const community = 0;
    const total = courses + quizzes + library + community;
    if (total === 0) {
      return [
        { name: "Courses" as const, value: 0 },
        { name: "Quizzes" as const, value: 0 },
        { name: "Library" as const, value: 0 },
        { name: "Community" as const, value: 0 },
      ];
    }
    return [
      { name: "Courses" as const, value: courses },
      { name: "Quizzes" as const, value: quizzes },
      { name: "Library" as const, value: library },
      { name: "Community" as const, value: community },
    ];
  }, [stats]);

  const recentActivity = useMemo(() => {
    const fromAttempts = attempts.map((a) => ({
      id: `quiz-${a.id}`,
      kind: "quiz" as const,
      title: "Quiz submitted",
      subtitle:
        typeof a.quiz === "string"
          ? `Score ${a.score}/${a.total}`
          : `Score ${a.score}/${a.total}`,
      timestamp: a.submittedAt || a.createdAt || a.updatedAt,
      score: a.percentage ?? null,
    }));
    const fromEnrollments = enrollments.map((e) => ({
      id: `course-${e.course._id}`,
      kind: "course" as const,
      title:
        e.status === "COMPLETED"
          ? `Completed ${e.course.title}`
          : `In progress: ${e.course.title}`,
      subtitle: `${Math.round(e.progress ?? 0)}% complete`,
      timestamp: e.course.updatedAt ?? e.course.createdAt ?? "",
      score: null as number | null,
    }));
    return [...fromAttempts, ...fromEnrollments]
      .filter((x) => x.timestamp)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 6);
  }, [attempts, enrollments]);

  return {
    isLoading:
      enrollmentsQ.isLoading || attemptsQ.isLoading || favoritesQ.isLoading,
    isError: enrollmentsQ.isError || attemptsQ.isError,
    enrollments,
    attempts,
    favoritesCount,
    stats,
    monthlyAttempts,
    perCourseProgress,
    activityDistribution,
    recentActivity,
  };
}

/** Build a 364-day activity heatmap (52 weeks × 7 days) from real quiz attempts. */
export function buildAttemptsHeatmap(
  attempts: StudentQuizAttempt[],
): { value: number; date: Date }[] {
  const days: { value: number; date: Date }[] = [];
  const today = startOfDayUTC(new Date());
  for (let i = 364 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    days.push({ date: d, value: 0 });
  }

  const indexByEpoch = new Map<number, number>();
  days.forEach((d, i) => indexByEpoch.set(d.date.getTime(), i));

  for (const a of attempts) {
    const ts = a.submittedAt ?? a.createdAt;
    if (!ts) continue;
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) continue;
    const day = startOfDayUTC(d).getTime();
    const idx = indexByEpoch.get(day);
    if (idx != null) days[idx].value += 1;
  }
  return days;
}
