"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import ProblemDescription from "./problem-description";
import Playground from "./playground";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProblemQuery } from "@/hooks/student/use-problem-solving";

type ProblemWorkspaceProps = {
  problemId: string;
};

export default function ProblemWorkspace({ problemId }: ProblemWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  let finalProblemId = problemId;
  if (pathname) {
    const segments = pathname.split("/").filter(Boolean);
    finalProblemId = decodeURIComponent(segments[segments.length - 1] ?? problemId);
  }
  const { data: problem, isLoading } = useProblemQuery(finalProblemId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading problem...
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 gap-4">
        <p className="text-lg font-semibold">Problem not found.</p>
        <p className="text-xs text-muted-foreground">Please check the URL and try again.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.back()}
            className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Problem List</span>
          <span className="text-muted-foreground/60">|</span>
          <h1 className="max-w-[300px] truncate text-base font-semibold md:max-w-md">
            {problem.title}
          </h1>
          <span className="rounded bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            {problem.testCases?.length ?? 0} cases
          </span>
        </div>
        <div className="text-xs text-muted-foreground">Problem Solving Workspace</div>
      </div>

      <div className="grid h-[calc(100vh-56px)] grid-cols-1 gap-0 md:grid-cols-5">
        <div className="h-full min-h-0 border-r border-border md:col-span-2">
          <ProblemDescription problem={problem} />
        </div>
        <div className="h-full min-h-0 md:col-span-3">
          <Playground problem={problem} />
        </div>
      </div>
    </div>
  );
}
