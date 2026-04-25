"use client";

import { useMemo } from "react";
import { useSolvedProblemsQuery } from "./use-problem-solving";

export function useProblemCompletion() {
  const { data: solvedProblemIds = [] } = useSolvedProblemsQuery();

  const completedProblemIds = useMemo(() => new Set(solvedProblemIds), [solvedProblemIds]);

  const isCompleted = (problemId: string) => {
    return completedProblemIds.has(problemId);
  };

  return {
    completedProblemIds,
    isCompleted,
  };
}
