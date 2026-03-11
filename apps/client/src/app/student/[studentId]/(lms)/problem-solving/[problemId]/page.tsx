"use client";

import ProblemWorkspace from "@/components/student/lms/problem-solving/problem-workspace";

export default function ProblemPage({ params }: { params: { studentId: string; problemId: string } }) {
  return <ProblemWorkspace problemId={params.problemId} />;
}
