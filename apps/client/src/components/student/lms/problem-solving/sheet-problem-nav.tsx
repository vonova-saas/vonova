"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ClipboardList } from "lucide-react";
import { useUserId } from "@/hooks";
import { useSheetProgress } from "@/hooks/student/use-sheet-progress";
import {
  useStudentProblemSheetQuery,
} from "@/hooks/student/use-problem-solving";
import { sheetProblemPath } from "@/lib/problem-solving/sheet-progress";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type SheetProblemNavProps = {
  sheetId: string;
  problemId: string;
  questionIndex: number;
};

export default function SheetProblemNav({
  sheetId,
  problemId,
  questionIndex,
}: SheetProblemNavProps) {
  const router = useRouter();
  const userId = useUserId();
  const { data: sheet } = useStudentProblemSheetQuery(sheetId);
  const { setCurrentIndex, serverProgress: sheetProgress } = useSheetProgress(sheetId);

  const problemIds = sheet?.problems?.map((problem) => problem._id) ?? [];
  const total = sheetProgress?.totalProblems ?? problemIds.length;
  const completedCount = sheetProgress?.solvedProblemsCount ?? 0;
  const progressPct = sheetProgress?.completionPercentage ?? 0;
  const completedProblemIds = useMemo(
    () => new Set(sheetProgress?.solvedProblemIds ?? []),
    [sheetProgress?.solvedProblemIds],
  );

  useEffect(() => {
    setCurrentIndex(questionIndex);
  }, [questionIndex, setCurrentIndex]);

  const nextProblemId = useMemo(() => {
    const currentIdx = problemIds.indexOf(problemId);
    if (currentIdx < 0) return null;
    for (let i = currentIdx + 1; i < problemIds.length; i += 1) {
      const id = problemIds[i];
      if (!completedProblemIds.has(id)) return { id, index: i };
    }
    for (let i = 0; i < problemIds.length; i += 1) {
      const id = problemIds[i];
      if (id !== problemId && !completedProblemIds.has(id)) return { id, index: i };
    }
    return null;
  }, [problemIds, problemId, completedProblemIds]);

  const solved = completedProblemIds.has(problemId);
  const wasSolvedRef = useRef(solved);

  useEffect(() => {
    const newlySolved = solved && !wasSolvedRef.current;
    wasSolvedRef.current = solved;
    if (!newlySolved || !nextProblemId || !userId) return;
    const t = window.setTimeout(() => {
      router.push(
        sheetProblemPath(userId, sheetId, nextProblemId.id, nextProblemId.index),
      );
    }, 1200);
    return () => window.clearTimeout(t);
  }, [solved, nextProblemId, userId, sheetId, router]);

  if (!sheet || !userId) return null;

  return (
    <div className="flex flex-col gap-2 border-b border-border bg-muted/30 px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/student/${userId}/problem-solving/sheets/${sheetId}`}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          {sheet.title}
        </Link>
        <span className="text-xs text-muted-foreground">
          Question {questionIndex + 1} · {completedCount}/{total} solved
        </span>
      </div>
      <Progress value={progressPct} className="h-1" />
      {solved && nextProblemId ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            Accepted — moving to next question…
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            asChild
          >
            <Link
              href={sheetProblemPath(
                userId,
                sheetId,
                nextProblemId.id,
                nextProblemId.index,
              )}
            >
              Next
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
