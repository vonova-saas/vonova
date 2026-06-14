"use client";

import { use } from "react";
import ProblemSheetDetail from "@/components/student/lms/problem-solving/problem-sheet-detail";

export default function ProblemSheetPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = use(params);
  return <ProblemSheetDetail sheetId={sheetId} />;
}
