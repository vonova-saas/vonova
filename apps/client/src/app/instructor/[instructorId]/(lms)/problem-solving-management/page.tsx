"use client";

import { useEffect, useState } from "react";
import ProblemSolvingManagement from "@/components/instructor/lms/problem-solving-management/problem-solving-management";

export default function ProblemSolvingManagementPage({
  params,
}: {
  params: Promise<{ instructorId: string }>;
}) {
  return (
    <ProblemSolvingManagementWrapper params={params} />
  );
}

function ProblemSolvingManagementWrapper({
  params,
}: {
  params: Promise<{ instructorId: string }>;
}) {
  const [instructorId, setInstructorId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setInstructorId(p.instructorId));
  }, [params]);

  if (!instructorId) {
    return null;
  }

  return <ProblemSolvingManagement instructorId={instructorId} />;
}
