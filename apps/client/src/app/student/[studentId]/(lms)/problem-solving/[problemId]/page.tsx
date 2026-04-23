"use client";

import { use } from "react";
import ProblemWorkspace from "@/components/student/lms/problem-solving/problem-workspace";

export default function ProblemPage({
  params,
}: {
  params: Promise<{ studentId: string; problemId: string }>;
}) {
  const resolvedParams = use(params);
  return <ProblemWorkspace problemId={resolvedParams.problemId} />;
}
