"use client";

import { useState } from "react";

const COMPLETED_PROBLEMS_KEY = "completed_problems";

export function useProblemCompletion() {
  const [completedProblemIds, setCompletedProblemIds] = useState<Set<string>>(() => {
    // Load completed problems from localStorage on mount
    const stored = localStorage.getItem(COMPLETED_PROBLEMS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      } catch {
        // Invalid data, ignore
        return new Set();
      }
    }
    return new Set();
  });

  const markAsCompleted = (problemId: string) => {
    setCompletedProblemIds((prev) => {
      const updated = new Set(prev);
      updated.add(problemId);
      localStorage.setItem(COMPLETED_PROBLEMS_KEY, JSON.stringify([...updated]));
      return updated;
    });
  };

  const isCompleted = (problemId: string) => {
    return completedProblemIds.has(problemId);
  };

  return {
    completedProblemIds,
    markAsCompleted,
    isCompleted,
  };
}
