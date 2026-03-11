"use client";

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PROBLEMS } from "./problems-data";
import ProblemDescription from "./problem-description";
import Playground from "./playground";

type ProblemWorkspaceProps = {
  problemId: string;
};

export default function ProblemWorkspace({ problemId }: ProblemWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();

  const problem = useMemo(() => {
    // Prefer reading the last segment from the URL to avoid any mismatch
    // between route params and actual path segments.
    let rawId = problemId;
    if (pathname) {
      const segments = pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1];
      if (last) rawId = last;
    }

    const normalizedId = decodeURIComponent(rawId).trim().toLowerCase();
    return PROBLEMS.find((p) => p.id.toLowerCase() === normalizedId);
  }, [problemId, pathname]);
  const [success, setSuccess] = useState(false);

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
    <div
      className="h-full w-full flex flex-col md:flex-row gap-4 p-4 md:p-6 overflow-auto"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
        backgroundSize: "18px 18px",
      }}
    >
      {/* Left: description */}
      <div className="md:w-1/2 w-full flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => router.back()}
            className="text-xs px-2 py-1 rounded-md border bg-background hover:bg-muted"
          >
            Back
          </button>
        </div>
        <ProblemDescription problem={problem} />
      </div>

      {/* Right: playground */}
      <div className="md:w-1/2 w-full flex flex-col gap-3">
        <Playground problem={problem} />
      </div>
    </div>
  );
}
