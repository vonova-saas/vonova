"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import ProblemWorkspace from "@/components/student/lms/problem-solving/problem-workspace";

export default function ProblemPage({
  params,
}: {
  params: Promise<{ studentId: string; problemId: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? undefined;
  const qIndexRaw = searchParams.get("qIndex");
  const questionIndex =
    qIndexRaw !== null && qIndexRaw !== "" ? Number.parseInt(qIndexRaw, 10) : 0;

  return (
    <ProblemWorkspace
      problemId={resolvedParams.problemId}
      sheetId={sheetId}
      questionIndex={Number.isFinite(questionIndex) ? questionIndex : 0}
    />
  );
}
