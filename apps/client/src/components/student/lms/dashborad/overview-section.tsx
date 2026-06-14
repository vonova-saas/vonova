"use client";

import {
  BookOpen,
  Brain,
  GraduationCap,
  Layers3,
  MessageCircle,
  Play,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentDashboardData } from "@/hooks/student/lms/use-student-dashboard";

const PIE_COLORS = ["#6366f1", "#22c55e", "#3b82f6", "#f59e42"];

export default function OverviewSection() {
  const params = useParams();
  const studentId = (params?.studentId as string) || "";
  const base = studentId ? `/student/${studentId}` : "";

  const {
    isLoading,
    stats,
    monthlyAttempts,
    activityDistribution,
    perCourseProgress,
  } = useStudentDashboardData();

  const topProgress = perCourseProgress.slice(0, 5).map((c) => ({
    name: c.title.length > 14 ? `${c.title.slice(0, 14)}…` : c.title,
    progress: Math.round(c.progress),
  }));

  const statCards = [
    {
      title: "Courses enrolled",
      value: stats.coursesEnrolled,
      icon: GraduationCap,
      trend:
        stats.coursesCompleted > 0
          ? `${stats.coursesCompleted} completed`
          : stats.coursesEnrolled > 0
            ? "Active"
            : "No enrolls",
      trendUp: stats.coursesCompleted > 0,
    },
    {
      title: "Quizzes completed",
      value: stats.quizzesCompleted,
      icon: Layers3,
      trend:
        stats.quizzesCompleted > 0
          ? `${stats.averageQuizScore}% avg`
          : "Try one",
      trendUp: stats.averageQuizScore >= 60,
    },
    {
      title: "Library favorites",
      value: stats.booksFavorited,
      icon: BookOpen,
      trend: stats.booksFavorited > 0 ? "Saved" : "Browse",
      trendUp: stats.booksFavorited > 0,
    },
    {
      title: "Average progress",
      value: `${stats.averageProgress}%`,
      icon: Brain,
      trend:
        stats.averageProgress >= 50
          ? "On track"
          : stats.averageProgress > 0
            ? "Keep going"
            : "Start a lesson",
      trendUp: stats.averageProgress >= 50,
    },
    {
      title: "In progress",
      value: stats.coursesInProgress,
      icon: MessageCircle,
      trend:
        stats.coursesInProgress > 0
          ? `${stats.coursesInProgress} active`
          : "All clear",
      trendUp: stats.coursesInProgress > 0,
    },
  ];

  const quickActions = [
    { title: "Continue learning", icon: Play, href: `${base}/courses` },
    { title: "Take a quiz", icon: Plus, href: `${base}/quizzes` },
    {
      title: "Open AI assistant",
      icon: Brain,
      href: `${base}/ai-assistant`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-2 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="flex flex-col items-center gap-2 p-4 sm:p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                {isLoading ? (
                  <Skeleton className="mt-1 h-7 w-12" />
                ) : (
                  <div className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                    {stat.value}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[11px] font-medium sm:text-xs">
                  {stat.trendUp ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span
                    className={
                      stat.trendUp
                        ? "text-emerald-500"
                        : "text-muted-foreground"
                    }
                  >
                    {stat.trend}
                  </span>
                </div>
                <div className="text-center text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
                  {stat.title}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="flex h-auto items-center justify-center gap-2 rounded-2xl border-2 bg-card/70 p-4 text-sm font-medium shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-col sm:gap-2 sm:py-5"
            >
              <Icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
              <span>{action.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Analytics row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Line — monthly attempts */}
        <Card className="border-2 shadow-sm backdrop-blur-sm lg:col-span-2">
          <div className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
            <p className="text-base font-semibold text-foreground sm:text-lg">
              Quiz activity (last 7 months)
            </p>
            <p className="text-xs text-muted-foreground">
              Real submissions on your account
            </p>
          </div>
          <CardContent className="px-2 pb-4 pt-0 sm:px-4">
            <div className="h-[220px] min-h-[200px] w-full min-w-0 sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyAttempts}
                  margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                >
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="attempts"
                    stroke="#d97757"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#d97757",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie — activity distribution */}
        <Card className="border-2 shadow-sm backdrop-blur-sm">
          <div className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
            <p className="text-base font-semibold text-foreground sm:text-lg">
              Activity distribution
            </p>
            <p className="text-xs text-muted-foreground">
              Across your account
            </p>
          </div>
          <CardContent className="flex flex-col items-center gap-4 px-4 pb-5 pt-0 sm:flex-row sm:gap-2">
            <div className="h-[160px] w-[160px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {activityDistribution.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex w-full flex-col gap-1.5 text-sm">
              {activityDistribution.map((entry, idx) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between gap-2 text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-xs sm:text-sm">{entry.name}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums sm:text-sm">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar — top courses by progress */}
      <Card className="border-2 shadow-sm backdrop-blur-sm">
        <div className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
          <p className="text-base font-semibold text-primary sm:text-lg">
            Top courses by progress
          </p>
          <p className="text-xs text-muted-foreground">
            Your 5 most advanced enrollments
          </p>
        </div>
        <CardContent className="px-2 pb-4 pt-0 sm:px-4">
          {topProgress.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
              No enrollments yet — once you start a course, it shows up here.
            </div>
          ) : (
            <div className="h-[220px] w-full sm:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProgress}
                  margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                    formatter={(v) => [`${v ?? 0}%`, "Progress"]}
                  />
                  <Bar
                    dataKey="progress"
                    fill="#d97757"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
