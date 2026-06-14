"use client";

import { useMemo } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SheetProblemSummary } from "@/types/api/instructor/lms/problem-solving/sheet-problem.type";
import { ProblemRow } from "./problem-row";

type ProblemListProps = {
  problems: SheetProblemSummary[];
  onAddProblem: () => void;
  onEdit: (problemId: string) => void;
  onView: (problemId: string) => void;
  onDelete: (problemId: string) => void;
};

export function ProblemList({
  problems,
  onAddProblem,
  onEdit,
  onView,
  onDelete,
}: ProblemListProps) {
  const sortedProblems = useMemo(
    () => [...problems].sort((a, b) => a.order - b.order),
    [problems],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Problems</CardTitle>
        <Button className="cursor-pointer" onClick={onAddProblem}>
          <Plus className="mr-2 h-4 w-4" />
          Add Problem
        </Button>
      </CardHeader>
      <CardContent>
        {sortedProblems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No problems in this sheet yet.</p>
            <p className="text-sm">Click &quot;Add Problem&quot; to create your first problem.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedProblems.map((problem) => (
              <ProblemRow
                key={problem._id}
                problem={problem}
                onEdit={onEdit}
                onView={onView}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
