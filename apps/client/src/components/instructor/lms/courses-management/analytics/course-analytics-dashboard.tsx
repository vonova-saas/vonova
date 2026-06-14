"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Download,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  downloadCourseAnalyticsCsv,
  useCourseAnalyticsCommunity,
  useCourseAnalyticsEngagement,
  useCourseAnalyticsOverview,
  useCourseAnalyticsQuizzes,
  useCourseAnalyticsStudents,
} from "@/hooks/instructor/lms/use-course-analytics";
import { toast } from "sonner";

function KpiCard({
  label,
  value,
  hint,
  delta,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: number;
}) {
  const up = delta != null && delta >= 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {(hint || delta != null) && (
        <CardContent className="pt-0 text-xs text-muted-foreground flex items-center gap-1">
          {delta != null && (
            <>
              {up ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
              )}
              <span className={up ? "text-emerald-600" : "text-rose-600"}>
                {delta > 0 ? "+" : ""}
                {delta}% (7d)
              </span>
            </>
          )}
          {hint && <span>{hint}</span>}
        </CardContent>
      )}
    </Card>
  );
}

function formatDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function CourseAnalyticsDashboard({
  courseId,
  instructorId,
}: {
  courseId: string;
  instructorId: string;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"progress" | "quiz" | "lastActive" | "joined">(
    "progress",
  );
  const [filter, setFilter] = useState<
    "all" | "inactive" | "completed" | "lowPerformers"
  >("all");
  const [exporting, setExporting] = useState(false);

  const overviewQ = useCourseAnalyticsOverview(courseId);
  const studentsQ = useCourseAnalyticsStudents(courseId, {
    page,
    limit: 20,
    search: search.trim() || undefined,
    sort,
    filter: filter === "all" ? undefined : filter,
  });
  const quizzesQ = useCourseAnalyticsQuizzes(courseId);
  const engagementQ = useCourseAnalyticsEngagement(courseId);
  const communityQ = useCourseAnalyticsCommunity(courseId);

  const overview = overviewQ.data;
  const dauChart = useMemo(
    () => engagementQ.data?.dailyActiveUsers ?? [],
    [engagementQ.data],
  );
  const histogram = useMemo(
    () => quizzesQ.data?.scoreHistogram ?? [],
    [quizzesQ.data],
  );

  async function handleExport() {
    setExporting(true);
    try {
      await downloadCourseAnalyticsCsv(courseId);
      toast.success("Export started");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  const backHref = `/instructor/${instructorId}/courses-management/${courseId}/edit`;
  const loading = overviewQ.isLoading;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to course
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {loading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              overview?.courseTitle ?? "Course analytics"
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Enrollment, progress, quizzes, engagement, and community activity.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting || loading}
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : overview ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Enrollments"
            value={String(overview.totalEnrollments)}
            delta={overview.growthEnrollments7dPct}
          />
          <KpiCard
            label="Active (7d)"
            value={String(overview.activeStudents7d)}
            delta={overview.growthActive7dPct}
          />
          <KpiCard
            label="Avg progress"
            value={`${overview.averageProgress}%`}
            hint={`${overview.completedStudents} completed`}
          />
          <KpiCard
            label="Avg quiz score"
            value={`${overview.averageQuizScore}%`}
            hint={`${overview.totalQuizAttempts} attempts`}
          />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily active learners</CardTitle>
            <CardDescription>Last 30 days (lesson activity)</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] min-h-[200px] min-w-0">
            {engagementQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : dauChart.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity in the last 30 days.</p>
            ) : (
              <div className="h-full min-h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dauChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quiz score distribution</CardTitle>
            <CardDescription>All attempts in this course</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] min-h-[200px] min-w-0">
            {quizzesQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : histogram.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quiz attempts yet.</p>
            ) : (
              <div className="h-full min-h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogram}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Lessons
            </CardDescription>
            <CardTitle className="text-xl">
              {overview?.lessonCompletionRate ?? 0}% completion
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {overview?.totalLessonsCompleted ?? 0} /{" "}
            {(overview?.totalLessons ?? 0) * (overview?.totalEnrollments ?? 0)}{" "}
            lesson completions
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Engagement
            </CardDescription>
            <CardTitle className="text-xl">
              {engagementQ.data?.weeklyActiveUsers ?? 0} weekly active
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Watch time:{" "}
            {formatDuration(engagementQ.data?.totalWatchSeconds ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Community
            </CardDescription>
            <CardTitle className="text-xl">
              {communityQ.data?.hasGroup
                ? `${communityQ.data.postsTotal ?? 0} posts`
                : "No group"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {communityQ.data?.hasGroup ? (
              <>
                {communityQ.data.messagesTotal ?? 0} chat messages ·{" "}
                {communityQ.data.commentsTotal ?? 0} comments
              </>
            ) : (
              "Link a course community group to see stats."
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </CardTitle>
          <CardDescription>
            {studentsQ.data?.total ?? 0} enrolled · page {page}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search by student id…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-xs"
            />
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as typeof sort)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="quiz">Quiz score</SelectItem>
                <SelectItem value="lastActive">Last active</SelectItem>
                <SelectItem value="joined">Joined</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filter}
              onValueChange={(v) => {
                setFilter(v as typeof filter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                <SelectItem value="inactive">Inactive 7d+</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="lowPerformers">Low performers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead className="text-right">Lessons</TableHead>
                  <TableHead className="text-right">Quiz avg</TableHead>
                  <TableHead className="text-right">Problems</TableHead>
                  <TableHead className="text-right">Last active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsQ.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : studentsQ.data?.items.length ? (
                  studentsQ.data.items.map((s) => (
                    <TableRow key={s.studentId}>
                      <TableCell className="font-mono text-xs">
                        {s.studentId.slice(-8)}
                      </TableCell>
                      <TableCell className="text-right">{s.progress}%</TableCell>
                      <TableCell className="text-right">
                        {s.lessonsCompleted}/{s.totalLessons}
                      </TableCell>
                      <TableCell className="text-right">{s.quizAverage}%</TableCell>
                      <TableCell className="text-right">
                        {s.problemsSolved}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {s.lastActiveAt
                          ? new Date(s.lastActiveAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No students match filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!studentsQ.data?.hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {quizzesQ.data?.quizzes.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quizzes</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead className="text-right">Avg</TableHead>
                  <TableHead className="text-right">Pass rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizzesQ.data.quizzes.map((q) => (
                  <TableRow key={q.quizId}>
                    <TableCell>{q.title}</TableCell>
                    <TableCell className="text-right">{q.attempts}</TableCell>
                    <TableCell className="text-right">{q.averageScore}%</TableCell>
                    <TableCell className="text-right">{q.passRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {overview?.recentActivity?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {overview.recentActivity.slice(0, 10).map((a, i) => (
                <li
                  key={`${a.at}-${i}`}
                  className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0"
                >
                  <span>{a.label}</span>
                  <span className="text-muted-foreground shrink-0">
                    {new Date(a.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
