"use client";

import { BookOpen, GraduationCap, Layers3, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentDashboardData } from "@/hooks/student/lms/use-student-dashboard";

function formatRelative(ts: string): string {
  if (!ts) return "";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function ActivityFeed() {
  const { recentActivity, isLoading } = useStudentDashboardData();

  return (
    <Card className="rounded-3xl border border-border/55 bg-linear-to-b from-card/90 via-card/75 to-card/65 shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg tracking-tight sm:text-xl">
          Recent activity
        </CardTitle>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Synced from your real quiz attempts and enrollments.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-background/30 p-10 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Take a quiz or enroll in a course and your activity will appear
              here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => {
              const isQuiz = activity.kind === "quiz";
              const Icon = isQuiz ? Layers3 : GraduationCap;
              const iconColor = isQuiz ? "text-emerald-500" : "text-sky-500";
              const badgeClass = isQuiz
                ? "bg-emerald-500/12 text-emerald-500 border-emerald-500/25"
                : "bg-sky-500/12 text-sky-500 border-sky-500/25";

              return (
                <div
                  key={activity.id}
                  className="group relative flex flex-col gap-2 rounded-2xl border border-border/40 bg-background/35 p-3 transition-colors duration-200 hover:bg-background/55 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
                >
                  {idx !== recentActivity.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-6 top-[3.15rem] hidden h-6 w-px bg-border/60 sm:block"
                    />
                  )}
                  <div className="rounded-xl border border-border/60 bg-background/75 p-2.5">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="line-clamp-1 text-sm font-semibold leading-snug text-foreground/95">
                      {activity.title}
                    </p>
                    <p className="line-clamp-1 mt-0.5 text-xs text-muted-foreground">
                      {activity.subtitle}
                      {activity.timestamp ? (
                        <span className="ml-1">
                          · {formatRelative(activity.timestamp)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span
                    className={`self-start rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${badgeClass} sm:self-center`}
                  >
                    {activity.kind}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {!isLoading && recentActivity.length > 0 ? (
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            <span>Showing the {recentActivity.length} most recent items</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
