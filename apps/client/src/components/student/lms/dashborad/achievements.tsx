"use client";

import { useMemo } from "react";
import { Award, BookOpen, Flame, GraduationCap, Layers3, Trophy } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildAttemptsHeatmap,
  useStudentDashboardData,
} from "@/hooks/student/lms/use-student-dashboard";

const COLOR_SCALE = [
  "bg-muted/40 border-border/30",
  "bg-emerald-500/30 border-emerald-500/40",
  "bg-emerald-500/55 border-emerald-500/60",
  "bg-emerald-500/80 border-emerald-500/80",
  "bg-emerald-500 border-emerald-500",
] as const;

function bucketize(v: number): number {
  if (v <= 0) return 0;
  if (v === 1) return 1;
  if (v === 2) return 2;
  if (v < 5) return 3;
  return 4;
}

export default function Achievements() {
  const { attempts, stats, isLoading } = useStudentDashboardData();

  const days = useMemo(() => buildAttemptsHeatmap(attempts), [attempts]);

  // Group into 52 columns × 7 rows for a GitHub-style grid.
  const weeks = useMemo(() => {
    const w: number[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      w.push(days.slice(i, i + 7).map((d) => bucketize(d.value)));
    }
    return w;
  }, [days]);

  // Compute current streak (consecutive days ending today with at least 1 attempt).
  const streak = useMemo(() => {
    let count = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].value > 0) count++;
      else break;
    }
    return count;
  }, [days]);

  const achievements = [
    {
      icon: Trophy,
      iconClass: "text-amber-500",
      label: "Quiz champion",
      description: `${stats.quizzesCompleted} quiz${stats.quizzesCompleted === 1 ? "" : "zes"} submitted`,
      unlocked: stats.quizzesCompleted >= 1,
    },
    {
      icon: GraduationCap,
      iconClass: "text-sky-500",
      label: "Course explorer",
      description: `${stats.coursesEnrolled} enrolled · ${stats.coursesCompleted} completed`,
      unlocked: stats.coursesEnrolled >= 1,
    },
    {
      icon: Layers3,
      iconClass: "text-emerald-500",
      label: "Streak in motion",
      description: `${streak}-day learning streak`,
      unlocked: streak >= 1,
    },
    {
      icon: BookOpen,
      iconClass: "text-violet-500",
      label: "Library bookmark",
      description: `${stats.booksFavorited} favorite${stats.booksFavorited === 1 ? "" : "s"}`,
      unlocked: stats.booksFavorited >= 1,
    },
  ];

  return (
    <Card className="rounded-2xl border border-border/60 bg-card/70 shadow-lg backdrop-blur-sm">
      <CardTitle className="px-5 pt-5 text-lg font-semibold sm:px-6 sm:pt-6 sm:text-xl">
        Achievements &amp; streaks
      </CardTitle>
      <CardContent className="space-y-6 px-5 pb-5 sm:px-6 sm:pb-6">
        {/* Achievement badges */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-primary sm:text-base">
              Milestones
            </h3>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {achievements.map((ach) => {
                const Icon = ach.icon;
                return (
                  <div
                    key={ach.label}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 shadow-sm transition-all sm:px-4 ${
                      ach.unlocked
                        ? "border-border/50 bg-muted/40"
                        : "border-dashed border-border/40 bg-background/20 opacity-60"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${ach.iconClass}`} />
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-semibold text-primary">
                        {ach.label}
                      </div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {ach.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-primary sm:text-base">
              Quiz activity heatmap
            </h3>
          </div>
          <div className="mb-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              {stats.quizzesCompleted} attempt
              {stats.quizzesCompleted === 1 ? "" : "s"} in the last 52 weeks
              {streak > 0 ? ` · ${streak}-day streak` : ""}
            </span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              {COLOR_SCALE.map((cls, i) => (
                <span
                  key={i}
                  className={`inline-block h-2.5 w-2.5 rounded-sm border ${cls}`}
                />
              ))}
              <span>More</span>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/50 bg-background/40 p-3">
            <div className="flex min-w-max gap-[3px]">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {week.map((bucket, dayIdx) => (
                    <span
                      key={dayIdx}
                      className={`block h-2.5 w-2.5 rounded-sm border transition-colors duration-200 ${COLOR_SCALE[bucket]}`}
                      title={`${bucket === 0 ? "No" : bucket} attempt${bucket === 1 ? "" : "s"}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Each cell is one day; color intensity reflects the number of quizzes
            you submitted.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
