"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ComponentType } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { useInstructorDashboardData } from "@/hooks/instructor/use-instructor-dashboard";
import { cn } from "@/lib/utils";
import type { QuizType } from "@/types/api/student/lms/quizzes/quiz.type";

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
  const instructorId = (params.instructorId as string) || user?._id || "";

  const {
    isLoading,
    stats,
    monthlyOutput,
    workloadDistribution,
    coursesByCategory,
    quizzes,
  } = useInstructorDashboardData();

  const recentQuizzes: QuizType[] = quizzes.slice(0, 4);

  const displayName = user?.name?.split(" ")[0] || "there";
  const now = new Date();
  const base = instructorId ? `/instructor/${instructorId}` : "";
  const disabledNav = !instructorId;
  const [activeTab, setActiveTab] = useState<
    "overview" | "workspace" | "quizzes"
  >("overview");

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
            Instructor hub
          </Badge>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {greetingForHour(now)}, {displayName}.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base md:text-lg">
            Shape courses and quizzes in one clear workspace. All numbers below
            are live.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
            <Button
              asChild
              size="lg"
              className="rounded-full px-6 sm:px-8"
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
              className="rounded-full border-primary/25 bg-background/60 px-6 backdrop-blur sm:px-8"
              disabled={disabledNav}
            >
              <Link href={`${base}/courses-management/create`}>
                Start a course
              </Link>
            </Button>
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-2 text-center sm:grid-cols-4 sm:gap-3 md:mt-12 md:gap-6">
            <HeroStat
              label="Courses"
              value={stats.totalCourses}
              sub={`${stats.publishedCourses} live`}
              loading={isLoading}
            />
            <HeroStat
              label="Quizzes"
              value={stats.totalQuizzes}
              sub={`${stats.totalQuestions} questions`}
              loading={isLoading}
            />
            <HeroStat
              label="Problems"
              value={stats.totalProblems}
              sub={stats.totalProblems > 0 ? "Ready" : "None yet"}
              loading={isLoading}
            />
            <HeroStat
              label="Today"
              value={formatShortDate(now)}
              sub=""
              loading={false}
              compact
            />
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-3 pt-8 sm:px-4 sm:gap-8 md:gap-10 md:pt-10">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 lg:gap-6">
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
              <CardTitle className="text-xl sm:text-2xl">
                Ship something learners will remember
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Pair a tight quiz with a fresh lesson — small iterations
                compound into standout courses.
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
                  Start each lesson with a single sentence: &ldquo;After this,
                  you can ___.&rdquo; It anchors attention before the details.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="w-full">
          <div className="flex justify-center overflow-x-auto pb-1">
            <div className="flex gap-1.5 rounded-[10px] border-2 px-1.5 py-1.5 shadow-md backdrop-blur-sm sm:gap-2 sm:px-2 sm:py-2">
              {(
                [
                  { key: "overview", label: "Overview" },
                  { key: "workspace", label: "Workspace" },
                  { key: "quizzes", label: "Recent quizzes" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative rounded-[25px] px-3 py-1.5 text-sm font-medium transition-colors duration-200 focus:outline-none sm:px-6 sm:py-2 sm:text-base",
                    activeTab === tab.key
                      ? "text-foreground after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-foreground after:content-['']"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            {activeTab === "overview" ? (
              <div className="space-y-5">
                <Card className="border-2 shadow-lg backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">
                      At a glance
                    </CardTitle>
                    <CardDescription>
                      Your core instructor momentum and quick actions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <StatTile
                        label="Quizzes"
                        value={stats.totalQuizzes}
                        loading={isLoading}
                        accent="text-primary"
                      />
                      <StatTile
                        label="Questions"
                        value={stats.totalQuestions}
                        loading={isLoading}
                      />
                      <StatTile
                        label="Courses"
                        value={stats.totalCourses}
                        loading={isLoading}
                        accent="text-emerald-500"
                      />
                      <StatTile
                        label="Problems"
                        value={stats.totalProblems}
                        loading={isLoading}
                        accent="text-sky-500"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild disabled={disabledNav}>
                        <Link href={`${base}/quiz-managment/create`}>
                          <Wand2 className="mr-2 h-4 w-4" />
                          New quiz
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        disabled={disabledNav}
                      >
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
                      <CardTitle className="text-base text-foreground">
                        Resources you shipped (last 7 months)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Courses · problems · quizzes you created
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 pt-0 sm:px-4">
                      <div className="h-[220px] min-h-[200px] w-full min-w-0 sm:h-[240px]">
                        <ResponsiveContainer width="100%" height={220} minWidth={0}>
                          <LineChart
                            data={monthlyOutput}
                            margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                          >
                            <XAxis
                              dataKey="month"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#a1a1aa", fontSize: 12 }}
                            />
                            <YAxis
                              allowDecimals={false}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#a1a1aa", fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid rgba(0,0,0,0.08)",
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
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 shadow-lg backdrop-blur-sm lg:col-span-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-foreground">
                        Workload split
                      </CardTitle>
                      <CardDescription className="text-xs">
                        By resource type
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-3 px-4 pt-0 sm:flex-row sm:gap-2">
                      <div className="h-[160px] w-[160px] shrink-0">
                        <ResponsiveContainer width={160} height={160} minWidth={0}>
                          <PieChart>
                            <Pie
                              data={workloadDistribution}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={46}
                              outerRadius={64}
                              paddingAngle={3}
                            >
                              {workloadDistribution.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex w-full flex-col gap-1.5 text-sm">
                        {workloadDistribution.map((entry) => (
                          <div
                            key={entry.name}
                            className="flex items-center justify-between gap-2 text-muted-foreground"
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                className="h-2.5 w-2.5 shrink-0"
                                viewBox="0 0 10 10"
                                aria-hidden
                              >
                                <circle cx="5" cy="5" r="5" fill={entry.color} />
                              </svg>
                              <span className="text-xs sm:text-sm">
                                {entry.name}
                              </span>
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

                <Card className="border-2 shadow-lg backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-primary">
                      Your courses by track
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Grouped by course category or level
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pt-0 sm:px-4">
                    {coursesByCategory.length === 0 ? (
                      <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
                        Create your first course to see this breakdown.
                      </div>
                    ) : (
                      <div className="h-[220px] min-h-[200px] w-full min-w-0 sm:h-[240px]">
                        <ResponsiveContainer width="100%" height={220} minWidth={0}>
                          <BarChart
                            data={coursesByCategory}
                            margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                          >
                            <XAxis
                              dataKey="area"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#a1a1aa", fontSize: 11 }}
                            />
                            <YAxis
                              allowDecimals={false}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#a1a1aa", fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid rgba(0,0,0,0.08)",
                              }}
                            />
                            <Bar
                              dataKey="count"
                              fill="#d97a57"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
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
                    {isLoading ? (
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
                          No quizzes yet — your first assessment sets the tone
                          for the whole course.
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

function HeroStat({
  label,
  value,
  sub,
  loading,
  compact,
}: {
  label: string;
  value: number | string;
  sub: string;
  loading: boolean;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 px-2 py-3 shadow-sm backdrop-blur-sm sm:px-3 sm:py-4 md:py-5">
      {loading ? (
        <Skeleton className="mx-auto h-7 w-14 sm:h-8 sm:w-16" />
      ) : (
        <div
          className={cn(
            "font-semibold tabular-nums",
            compact ? "text-sm sm:text-base md:text-lg" : "text-xl sm:text-2xl md:text-3xl",
          )}
        >
          {value}
        </div>
      )}
      <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs md:text-sm">
        {label}
      </div>
      {sub ? (
        <div className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function StatTile({
  label,
  value,
  loading,
  accent = "text-foreground",
}: {
  label: string;
  value: number;
  loading: boolean;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/50 px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className={cn("mt-1 text-2xl font-bold tabular-nums sm:text-3xl", accent)}>
          {value}
        </p>
      )}
    </div>
  );
}
