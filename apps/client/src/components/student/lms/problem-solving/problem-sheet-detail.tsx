"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  Play,
} from "lucide-react";
import { useUserId } from "@/hooks";
import { useSheetProgress } from "@/hooks/student/use-sheet-progress";
import {
  useStudentProblemSheetQuery,
} from "@/hooks/student/use-problem-solving";
import { sheetProblemPath } from "@/lib/problem-solving/sheet-progress";
import type { ProblemSheetEntity } from "@/services/student/lms/problem-solving/problem-solving.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type SheetItem =
  | { kind: "problem"; id: string; index: number }
  | {
      kind: "embedded";
      index: number;
      title: string;
      description?: string;
      difficulty?: string;
    };

function buildSheetItems(sheet: ProblemSheetEntity): SheetItem[] {
  const items: SheetItem[] = [];
  let index = 0;
  for (const problem of sheet.problems ?? []) {
    const id = problem._id;
    items.push({ kind: "problem", id, index });
    index += 1;
  }
  for (const q of sheet.embeddedQuestions ?? []) {
    items.push({
      kind: "embedded",
      index,
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
    });
    index += 1;
  }
  return items;
}

function formatSubmissionStatus(status: string | null | undefined): string {
  if (!status) return "";
  return status.replace(/_/g, " ");
}

type ProblemSheetDetailProps = {
  sheetId: string;
};

export default function ProblemSheetDetail({ sheetId }: ProblemSheetDetailProps) {
  const router = useRouter();
  const userId = useUserId();
  const { data: sheet, isLoading, isError } = useStudentProblemSheetQuery(sheetId);
  const { currentIndex, setCurrentIndex, serverProgress: progress } =
    useSheetProgress(sheetId);

  const items = useMemo(
    () => (sheet ? buildSheetItems(sheet) : []),
    [sheet],
  );

  const problemTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of sheet?.problems ?? []) map.set(p._id, p.title);
    return map;
  }, [sheet?.problems]);

  const progressByProblemId = useMemo(() => {
    const map = new Map(
      (progress?.problemProgress ?? []).map((p) => [p.problemId, p]),
    );
    return map;
  }, [progress?.problemProgress]);

  const completedCount = progress?.solvedProblemsCount ?? 0;
  const totalProblems = progress?.totalProblems ?? 0;
  const progressPct = progress?.completionPercentage ?? 0;
  const sheetCompleted = progress?.completed ?? false;

  const firstUnsolvedIndex = useMemo(() => {
    const idx = items.findIndex(
      (item) =>
        item.kind === "problem" &&
        !progressByProblemId.get(item.id)?.solved,
    );
    return idx >= 0 ? idx : 0;
  }, [items, progressByProblemId]);

  const resumeIndex =
    currentIndex < items.length ? currentIndex : firstUnsolvedIndex;

  const startOrContinue = () => {
    const target =
      items[resumeIndex] ?? items[firstUnsolvedIndex] ?? items[0];
    if (!target || !userId) return;
    if (target.kind === "embedded") {
      setCurrentIndex(target.index);
      return;
    }
    setCurrentIndex(target.index);
    router.push(sheetProblemPath(userId, sheetId, target.id, target.index));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading sheet...
      </div>
    );
  }

  if (isError || !sheet) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-lg font-semibold">Sheet not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-full max-w-3xl px-4 pb-16 pt-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        onClick={() => router.push(`/student/${userId}/problem-solving`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        All problems
      </Button>

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <ClipboardList className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">
            Problem sheet
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{sheet.title}</h1>
        {sheet.description ? (
          <p className="mt-3 text-muted-foreground">{sheet.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {sheet.tags?.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          {sheet.timerMinutes ? (
            <Badge variant="outline">{sheet.timerMinutes} min timer</Badge>
          ) : null}
          {sheet.dueDate ? (
            <Badge variant="outline">
              Due {new Date(sheet.dueDate).toLocaleDateString()}
            </Badge>
          ) : null}
          {sheetCompleted ? (
            <Badge className="bg-green-600 hover:bg-green-600">
              <Award className="mr-1 h-3 w-3" />
              Sheet complete
            </Badge>
          ) : null}
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Your progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!progress ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing progress...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {completedCount} solved ·{" "}
                  {Math.max(0, totalProblems - completedCount)} remaining
                </span>
                <span className="font-medium tabular-nums">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </>
          )}
          <Button className="w-full sm:w-auto" onClick={startOrContinue}>
            <Play className="mr-2 h-4 w-4" />
            {sheetCompleted
              ? "Review sheet"
              : completedCount > 0
                ? "Continue solving"
                : "Start sheet"}
          </Button>
        </CardContent>
      </Card>

      <h2 className="mb-4 text-lg font-semibold">Questions</h2>
      <ol className="space-y-2">
        {items.map((item) => {
          const problemProgress =
            item.kind === "problem"
              ? progressByProblemId.get(item.id)
              : undefined;
          const done = problemProgress?.solved ?? false;
          const isCurrent = item.index === resumeIndex;
          const label =
            item.kind === "problem"
              ? problemTitleById.get(item.id) ?? `Problem ${item.index + 1}`
              : item.title;

          return (
            <li
              key={`${item.kind}-${item.index}`}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                isCurrent && "border-primary/40 bg-primary/5",
                done && "opacity-90",
              )}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Circle
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {item.index + 1}. {label}
                </p>
                {item.kind === "problem" && problemProgress ? (
                  <p className="text-xs text-muted-foreground">
                    {done ? "Complete" : "Not solved"}
                    {problemProgress.attemptsCount > 0
                      ? ` · ${problemProgress.attemptsCount} attempt${
                          problemProgress.attemptsCount === 1 ? "" : "s"
                        }`
                      : ""}
                    {problemProgress.lastSubmissionStatus
                      ? ` · last: ${formatSubmissionStatus(problemProgress.lastSubmissionStatus)}`
                      : ""}
                  </p>
                ) : item.kind === "embedded" ? (
                  <p className="text-xs text-muted-foreground">
                    Practice prompt
                  </p>
                ) : null}
              </div>
              {item.kind === "problem" && userId ? (
                <Link
                  href={sheetProblemPath(userId, sheetId, item.id, item.index)}
                  onClick={() => setCurrentIndex(item.index)}
                >
                  <Button size="sm" variant={done ? "outline" : "default"}>
                    {done ? "Again" : "Solve"}
                  </Button>
                </Link>
              ) : (
                <Badge variant="outline" className="shrink-0">
                  Prompt
                </Badge>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
