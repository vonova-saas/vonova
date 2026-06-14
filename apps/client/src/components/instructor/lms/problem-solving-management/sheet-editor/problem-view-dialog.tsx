"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useProblemSolvingProblemQuery } from "@/hooks/instructor/use-problem-solving-management";

type ProblemViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemId: string | null;
};

export function ProblemViewDialog({
  open,
  onOpenChange,
  problemId,
}: ProblemViewDialogProps) {
  const { data: problem, isLoading } = useProblemSolvingProblemQuery(
    problemId ?? "",
    open && Boolean(problemId),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{problem?.title ?? "Problem"}</DialogTitle>
          <DialogDescription>
            Sheet-scoped problem details and test cases.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading problem...
          </div>
        ) : problem ? (
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </p>
              <p className="whitespace-pre-wrap text-sm">{problem.description}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Constraints
              </p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {problem.constraints}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Badge variant="outline">{problem.difficulty}</Badge>
              <Badge variant="outline">{problem.functionName}</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Test Cases
              </p>
              {problem.testCases.map((testCase, index) => (
                <Card key={`${problem._id}-case-${index}`} className="py-3">
                  <CardContent className="space-y-2 px-4 text-sm">
                    <p>
                      <span className="font-semibold">Input:</span>{" "}
                      <span className="font-mono text-xs">
                        {JSON.stringify(testCase.input)}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold">Expected:</span>{" "}
                      <span className="font-mono text-xs">
                        {JSON.stringify(testCase.expected)}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
