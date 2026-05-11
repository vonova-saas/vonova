"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowUpRight, GraduationCap, Sparkles } from "lucide-react";
import { useStudentDashboardData } from "@/hooks/student/lms/use-student-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

const BAR_COLORS = [
  "from-[#F2996A] to-[#F0784A]",
  "from-[#16C47F] to-[#11A56C]",
  "from-[#4A90E2] to-[#2F6DCE]",
  "from-[#A855F7] to-[#7E22CE]",
  "from-[#F59E0B] to-[#D97706]",
] as const;

const BAR_TEXT = [
  "text-[#F2996A]",
  "text-[#16C47F]",
  "text-[#4A90E2]",
  "text-[#A855F7]",
  "text-[#F59E0B]",
] as const;

export default function ProgressSection() {
  const params = useParams();
  const studentId = (params?.studentId as string) || "";
  const base = studentId ? `/student/${studentId}` : "";

  const { perCourseProgress, stats, isLoading } = useStudentDashboardData();
  const items = perCourseProgress.slice(0, 5);

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-border/50 bg-linear-to-b from-card/90 via-card/70 to-card/60 p-5 shadow-xl backdrop-blur-sm sm:p-6 md:p-7">
      <div className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Live progress
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
            Your courses
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Per-course completion synced from your enrollments.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
          {stats.averageProgress}% avg
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-background/30 p-10 text-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <GraduationCap className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium">No active enrollments yet.</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Browse the catalogue and enroll in a course to start tracking your
            progress.
          </p>
          <Link
            href={`${base}/courses`}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse courses
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {items.map((c, i) => {
            const percent = Math.round(c.progress);
            return (
              <Link
                key={c.courseId}
                href={`${base}/courses/${c.slug}`}
                className="block rounded-2xl border border-border/40 bg-background/30 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-background/50 hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="line-clamp-1 text-sm font-medium text-foreground/90">
                    {c.title}
                  </span>
                  <span
                    className={`shrink-0 text-sm font-semibold ${BAR_TEXT[i % BAR_TEXT.length]}`}
                  >
                    {percent}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/80">
                  <div
                    className={`h-full rounded-full bg-linear-to-r ${BAR_COLORS[i % BAR_COLORS.length]}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {c.status === "COMPLETED"
                    ? "Course completed"
                    : percent === 0
                      ? "Just enrolled"
                      : `${100 - percent}% left to target`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
