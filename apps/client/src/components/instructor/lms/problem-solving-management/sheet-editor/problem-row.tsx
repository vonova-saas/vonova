"use client";

import { memo } from "react";
import { Edit, Eye, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SheetProblemSummary } from "@/types/api/instructor/lms/problem-solving/sheet-problem.type";

type ProblemRowProps = {
  problem: SheetProblemSummary;
  onEdit: (problemId: string) => void;
  onView: (problemId: string) => void;
  onDelete: (problemId: string) => void;
};

function difficultyClass(difficulty: string) {
  if (difficulty === "easy") return "bg-emerald-100 text-emerald-800";
  if (difficulty === "medium") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

export const ProblemRow = memo(function ProblemRow({
  problem,
  onEdit,
  onView,
  onDelete,
}: ProblemRowProps) {
  return (
    <Card className="py-3">
      <CardContent className="flex items-center gap-3 px-4">
        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {problem.order}. {problem.title}
            </span>
            <Badge className={difficultyClass(problem.difficulty)}>
              {problem.difficulty}
            </Badge>
          </div>
          {problem.tags.length > 0 ? (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {problem.tags.join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(problem._id)}
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(problem._id)}
            className="cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(problem._id)}
            className="cursor-pointer text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
