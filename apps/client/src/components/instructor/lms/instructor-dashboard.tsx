"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCog,
  ClipboardCheck,
  Frame,
  Layers,
  Presentation,
  Sparkles,
  SquareTerminal,
  Video,
  Wand2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { useQuizStore } from "@/lib/stores";
import { cn } from "@/lib/utils";
import type { QuizType } from "@/types/api/student/lms/quizzes/quiz.type";

const DOT_GRID_STYLE = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
  backgroundSize: "18px 18px",
} as const;

const instructorOutputData = [
  { month: "Jan", value: 3 },
  { month: "Feb", value: 5 },
  { month: "Mar", value: 7 },
  { month: "Apr", value: 6 },
  { month: "May", value: 9 },
  { month: "Jun", value: 11 },
  { month: "Jul", value: 10 },
];

const instructorWorkloadDistributionData = [
  { name: "Course design", value: 34, color: "#4f6bff" },
  { name: "Quiz building", value: 27, color: "#24d05a" },
  { name: "Lesson prep", value: 21, color: "#2b8fff" },
  { name: "Presentation", value: 12, color: "#7e53ff" },
  { name: "Review/Q&A", value: 6, color: "#f5a623" },
];

const instructorCourseHealthData = [
  { area: "Frontend", score: 82 },
  { area: "Backend", score: 68 },
  { area: "Databases", score: 91 },
  { area: "DevOps", score: 57 },
  { area: "System Design", score: 74 },
];

function greetingForHour(date: Date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

type LaunchTileProps = {
  href: string;
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  className?: string;
  disabled?: boolean;
};

function LaunchTile({
  href,
  title,
  subtitle,
  icon: Icon,
  className,
  disabled,
}: LaunchTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-2xl border-2 p-5 shadow-md transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        disabled && "pointer-events-none opacity-45",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/25 opacity-50 blur-2xl transition-opacity group-hover:opacity-80"
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="rounded-xl bg-background/60 p-2.5 shadow-sm ring-1 ring-border/60 backdrop-blur-sm dark:bg-background/20">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="relative z-10 mt-4">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}

type ToolPairProps = {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  gradientClass: string;
  disabled?: boolean;
};

function ToolPairTile({
  href,
  title,
  description,
  icon: Icon,
  gradientClass,
  disabled,
}: ToolPairProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-1 flex-col gap-3 overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        disabled && "pointer-events-none opacity-45",
        gradientClass,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background/50 text-primary shadow-sm ring-1 ring-border/40 backdrop-blur-sm">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div>
        <p className="font-semibold leading-tight">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

type CompactLinkProps = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
};

function CompactNavLink({ href, label, icon: Icon, disabled }: CompactLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors",
        "hover:bg-muted/80 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "pointer-events-none opacity-45",
      )}
    >
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </Link>
  );
}

export default function InstructorDashboard() {
  const { user } = useAuthContext();
  const params = useParams();
  const instructorId =
    (params.instructorId as string) || user?._id || "";

  const { quizzesById, allIds, loading, fetchInstructorQuizzes } =
    useQuizStore();

  useEffect(() => {
    if (user?._id) {
      void fetchInstructorQuizzes(user._id);
    }
  }, [user?._id, fetchInstructorQuizzes]);

  const totalQuizzes = allIds.length;
  const totalQuestions = useMemo(() => {
    return allIds.reduce((sum, id) => {
      const q = quizzesById[id];
      return sum + (q?.questions?.length ?? 0);
    }, 0);
  }, [allIds, quizzesById]);

  const recentQuizzes = useMemo(() => {
    const list = allIds
      .map((id) => quizzesById[id])
      .filter(Boolean) as QuizType[];
    return list.slice(0, 4);
  }, [allIds, quizzesById]);

  const displayName = user?.name?.split(" ")[0] || "there";
  const now = new Date();
  const base = instructorId ? `/instructor/${instructorId}` : "";
  const disabledNav = !instructorId;
  const [activeTab, setActiveTab] = useState<"overview" | "workspace" | "quizzes">(
    "overview",
  );

  return (
    <div
      className="min-h-full w-full overflow-auto px-4 py-6 sm:px-6 md:px-8 md:py-8"
      style={DOT_GRID_STYLE}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:gap-10">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl border-2 border-border/80 bg-card/40 px-6 py-8 shadow-lg backdrop-blur-md sm:px-10 sm:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-chart-2/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent"
          />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="border border-primary/20 bg-primary/10 font-medium text-primary"
                >
                  Instructor
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatShortDate(now)}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl md:leading-[1.1]">
                <span className="bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent dark:from-foreground dark:to-foreground/75">
                  {greetingForHour(now)}, {displayName}
                </span>
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Shape courses, sharpen quizzes, and ship lessons that stick — all
                in one calm workspace.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-xl shadow-md"
                disabled={disabledNav}
              >
                <Link href={`${base}/quiz-managment/create`}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  New quiz
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border-2 bg-background/50 backdrop-blur-sm"
                disabled={disabledNav}
              >
                <Link href={`${base}/courses-management/create`}>
                  Start a course
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Inline stats */}
          <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-background/50 px-4 py-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Quizzes
              </p>
              {loading ? (
                <div className="mt-2 h-9 w-16 animate-pulse rounded-md bg-muted" />
              ) : (
                <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
                  {totalQuizzes}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-border/80 bg-background/50 px-4 py-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Questions
              </p>
              {loading ? (
                <div className="mt-2 h-9 w-20 animate-pulse rounded-md bg-muted" />
              ) : (
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                  {totalQuestions}
                </p>
              )}
            </div>
            <div className="col-span-2 rounded-2xl border border-dashed border-primary/25 bg-primary/6 px-4 py-4 sm:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-primary/90">
                Momentum
              </p>
              <p className="mt-2 text-sm leading-snug text-muted-foreground">
                Small edits today keep learners engaged tomorrow.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <Card className="relative overflow-hidden border-2 shadow-lg backdrop-blur-sm lg:col-span-7">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/18 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-chart-2/12 blur-3xl"
            />
            <CardHeader className="relative z-10 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Today&apos;s focus
                </span>
              </div>
              <CardTitle className="text-2xl sm:text-3xl">
                Ship something learners will remember
              </CardTitle>
              <CardDescription className="text-base">
                Pair a tight quiz with a fresh lesson — small iterations compound
                into standout courses.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 flex flex-wrap gap-3 pb-6">
              <Button asChild variant="secondary" disabled={disabledNav}>
                <Link href={`${base}/courses-management/create`}>
                  Draft a course
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" disabled={disabledNav}>
                <Link href={`${base}/presentation-builder`}>
                  Open presentation builder
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-primary/25 bg-linear-to-br from-primary/7 to-transparent shadow-md backdrop-blur-sm lg:col-span-5">
            <CardContent className="flex items-start gap-4 py-6">
              <div className="rounded-2xl bg-primary/15 p-3 text-primary shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold leading-snug">
                  Micro-tip: lead with one outcome
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Start each lesson with a single sentence: “After this, you can
                  ___.” It anchors attention before the details.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="w-full">
          <div className="flex justify-center">
            <div className="flex gap-2 rounded-[10px] border-2 px-2 py-2 shadow-md backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "relative rounded-[25px] px-6 py-2 text-base font-medium transition-colors duration-200 focus:outline-none",
                  activeTab === "overview"
                    ? "text-foreground after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:rounded-full after:bg-foreground after:content-['']"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("workspace")}
                className={cn(
                  "relative rounded-[25px] px-6 py-2 text-base font-medium transition-colors duration-200 focus:outline-none",
                  activeTab === "workspace"
                    ? "text-foreground after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:rounded-full after:bg-foreground after:content-['']"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Workspace
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("quizzes")}
                className={cn(
                  "relative rounded-[25px] px-6 py-2 text-base font-medium transition-colors duration-200 focus:outline-none",
                  activeTab === "quizzes"
                    ? "text-foreground after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:rounded-full after:bg-foreground after:content-['']"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Recent quizzes
              </button>
            </div>
          </div>

          <div className="mt-8">
            {activeTab === "overview" ? (
              <div className="space-y-5">
                <Card className="border-2 shadow-lg backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>At a glance</CardTitle>
                    <CardDescription>
                      Your core instructor momentum and quick actions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-border/80 bg-background/50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Quizzes
                        </p>
                        {loading ? (
                          <div className="mt-2 h-9 w-16 animate-pulse rounded-md bg-muted" />
                        ) : (
                          <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
                            {totalQuizzes}
                          </p>
                        )}
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Questions
                        </p>
                        {loading ? (
                          <div className="mt-2 h-9 w-20 animate-pulse rounded-md bg-muted" />
                        ) : (
                          <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                            {totalQuestions}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 rounded-2xl border border-dashed border-primary/25 bg-primary/6 px-4 py-4 sm:col-span-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-primary/90">
                          Momentum
                        </p>
                        <p className="mt-2 text-sm leading-snug text-muted-foreground">
                          Small edits today keep learners engaged tomorrow.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild disabled={disabledNav}>
                        <Link href={`${base}/quiz-managment/create`}>
                          <Wand2 className="mr-2 h-4 w-4" />
                          New quiz
                        </Link>
                      </Button>
                      <Button asChild variant="outline" disabled={disabledNav}>
                        <Link href={`${base}/courses-management/create`}>
                          Start a course
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <Card className="border-2 shadow-lg backdrop-blur-sm lg:col-span-8">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-muted-foreground">
                        Instructor Output (monthly)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={instructorOutputData}>
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#a1a1aa", fontSize: 12 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#a1a1aa", fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "8px",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#d97a57"
                            strokeWidth={3}
                            dot={{
                              r: 4,
                              fill: "#d97a57",
                              stroke: "#fff",
                              strokeWidth: 1.5,
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-2 shadow-lg backdrop-blur-sm lg:col-span-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-muted-foreground">
                        Instructor workload split
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4 pt-0">
                      <div className="h-[180px] w-[180px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={instructorWorkloadDistributionData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={46}
                              outerRadius={64}
                              paddingAngle={3}
                            >
                              {instructorWorkloadDistributionData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 text-sm">
                        {instructorWorkloadDistributionData.map((entry) => (
                          <div
                            key={entry.name}
                            className="flex items-center gap-2 text-muted-foreground"
                          >
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span>{entry.name}</span>
                            <span className="ml-1 font-medium">{entry.value}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2 shadow-lg backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-primary">
                      Course health by track
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={instructorCourseHealthData}>
                        <XAxis
                          dataKey="area"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#a1a1aa", fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#a1a1aa", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        />
                        <Bar dataKey="score" fill="#d97a57" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {activeTab === "workspace" ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                      Your workspace
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Core LMS areas first — tools and extras follow.
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Build &amp; teach
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <LaunchTile
                        href={`${base}/courses-management`}
                        title="Courses"
                        subtitle="Chapters, lessons, and publish flow"
                        icon={SquareTerminal}
                        disabled={disabledNav}
                        className="border-border/90 bg-linear-to-br from-card via-card to-primary/6"
                      />
                      <LaunchTile
                        href={`${base}/quiz-managment`}
                        title="Quizzes"
                        subtitle="Assessments tied to your material"
                        icon={ClipboardCheck}
                        disabled={disabledNav}
                        className="border-border/90 bg-linear-to-br from-card via-card to-primary/10"
                      />
                      <LaunchTile
                        href={`${base}/material-library-management`}
                        title="Material library"
                        subtitle="Files and assets you reuse everywhere"
                        icon={Layers}
                        disabled={disabledNav}
                        className="border-border/90 bg-linear-to-br from-card via-card to-muted/30"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Studio tools
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <ToolPairTile
                        href={`${base}/presentation-builder`}
                        title="Presentation builder"
                        description="Slides and structure without leaving Vonova"
                        icon={Presentation}
                        disabled={disabledNav}
                        gradientClass="border-border/90 bg-linear-to-br from-primary/12 via-card to-card"
                      />
                      <ToolPairTile
                        href={`${base}/course-recorder`}
                        title="Course recorder"
                        description="Capture lessons with a focused flow"
                        icon={Video}
                        disabled={disabledNav}
                        gradientClass="border-border/90 bg-linear-to-br from-chart-2/18 via-card to-card"
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 border-border/80 bg-muted/20 px-4 py-3 backdrop-blur-sm">
                    <p className="mb-2 text-center text-xs font-medium text-muted-foreground sm:text-left">
                      Also available
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start">
                      <CompactNavLink
                        href={`${base}/problem-solving-management`}
                        label="Problem solving"
                        icon={BrainCog}
                        disabled={disabledNav}
                      />
                      <span
                        className="hidden text-muted-foreground/50 sm:inline"
                        aria-hidden
                      >
                        ·
                      </span>
                      <CompactNavLink
                        href={`${base}/community`}
                        label="Community"
                        icon={Frame}
                        disabled={disabledNav}
                      />
                      <span
                        className="hidden text-muted-foreground/50 sm:inline"
                        aria-hidden
                      >
                        ·
                      </span>
                      <CompactNavLink
                        href={`${base}/quiz-managment`}
                        label="All quizzes"
                        icon={BookOpen}
                        disabled={disabledNav}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "quizzes" ? (
              <section>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Recent quizzes
                  </h2>
                  {instructorId ? (
                    <Link
                      href={`${base}/quiz-managment`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View all
                    </Link>
                  ) : null}
                </div>
                <Card className="border-2 shadow-lg backdrop-blur-sm">
                  <CardContent className="py-6">
                    {loading ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-24 animate-pulse rounded-xl bg-muted"
                          />
                        ))}
                      </div>
                    ) : recentQuizzes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                        <div className="rounded-full bg-primary/10 p-4 text-primary">
                          <BookOpen className="h-8 w-8" />
                        </div>
                        <p className="max-w-sm text-muted-foreground">
                          No quizzes yet — your first assessment sets the tone for the
                          whole course.
                        </p>
                        <Button
                          asChild
                          disabled={disabledNav}
                          size="lg"
                          className="rounded-xl"
                        >
                          <Link href={`${base}/quiz-managment/create`}>
                            Create your first quiz
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {recentQuizzes.map((q) => (
                          <li key={q._id}>
                            <Link
                              href={`${base}/quiz-managment/${q._id}/edit`}
                              className="group flex h-full flex-col rounded-xl border border-border bg-card/60 p-4 transition-all hover:border-primary/35 hover:bg-primary/4 hover:shadow-md"
                            >
                              <span className="line-clamp-2 font-medium leading-snug group-hover:text-primary">
                                {q.title}
                              </span>
                              <span className="mt-1 text-xs text-muted-foreground">
                                {q.topic}
                                {q.questions?.length != null
                                  ? ` · ${q.questions.length} questions`
                                  : ""}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
