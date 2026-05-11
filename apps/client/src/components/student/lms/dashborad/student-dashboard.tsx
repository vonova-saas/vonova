"use client";

import DashboardTabs from "./dashboard-tabs";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { useStudentDashboardData } from "@/hooks/student/lms/use-student-dashboard";

function greetingForHour(date: Date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function StudentDashboard() {
  const { user } = useAuthContext();
  const displayName = user?.name?.split(" ")[0] || "Student";
  const now = new Date();

  const { stats, isLoading } = useStudentDashboardData();

  const heroStats = [
    {
      label: "Courses",
      value: stats.coursesEnrolled,
      sub: `${stats.coursesCompleted} completed`,
    },
    {
      label: "Quizzes",
      value: stats.quizzesCompleted,
      sub: stats.averageQuizScore > 0 ? `${stats.averageQuizScore}% avg` : "No scores yet",
    },
    {
      label: "Progress",
      value: `${stats.averageProgress}%`,
      sub: stats.coursesInProgress > 0 ? `${stats.coursesInProgress} in flight` : "Steady",
    },
  ];

  return (
    <div className="min-h-full w-full pb-16">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14 md:py-20 md:text-center">
          <Badge
            variant="secondary"
            className="mb-4 rounded-full px-3 py-1 text-xs font-medium"
          >
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            Student hub
          </Badge>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {greetingForHour(now)}, {displayName}.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base md:text-lg">
            Stay on track. Your learning numbers below update in real time.
          </p>
          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-2 text-center sm:gap-3 md:mt-12 md:gap-6">
            {heroStats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border/60 bg-card/70 px-2 py-3 shadow-sm backdrop-blur-sm sm:px-3 sm:py-4 md:py-5"
              >
                {isLoading ? (
                  <Skeleton className="mx-auto h-7 w-14 sm:h-8 sm:w-16" />
                ) : (
                  <div className="text-xl font-semibold tabular-nums sm:text-2xl md:text-3xl">
                    {s.value}
                  </div>
                )}
                <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs md:text-sm">
                  {s.label}
                </div>
                <div className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-3 pt-8 sm:px-4 sm:pt-10">
        <DashboardTabs />
      </div>
    </div>
  );
}
