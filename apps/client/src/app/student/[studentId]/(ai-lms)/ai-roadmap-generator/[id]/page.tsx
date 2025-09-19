"use client";
import { use } from "react";
import { Flow } from "@/components/student/ai-lms/ai-roadmap/flow-components/Flow";

export default function RoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <Flow roadmapId={resolvedParams.id} />;
}
