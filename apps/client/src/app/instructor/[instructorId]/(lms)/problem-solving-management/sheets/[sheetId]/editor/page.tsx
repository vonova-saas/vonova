"use client";

import { useEffect, useState } from "react";
import SheetEditor from "@/components/instructor/lms/problem-solving-management/sheet-editor";

export default function SheetEditorPage({
  params,
}: {
  params: Promise<{ instructorId: string; sheetId: string }>;
}) {
  const [resolvedParams, setResolvedParams] = useState<{
    instructorId: string;
    sheetId: string;
  } | null>(null);

  useEffect(() => {
    params.then((p) => setResolvedParams(p));
  }, [params]);

  if (!resolvedParams) {
    return null;
  }

  return (
    <SheetEditor
      sheetId={resolvedParams.sheetId}
      instructorId={resolvedParams.instructorId}
    />
  );
}
