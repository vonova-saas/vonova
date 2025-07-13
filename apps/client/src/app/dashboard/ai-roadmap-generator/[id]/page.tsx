"use client";
import { Flow } from "@/components/dashboard/student/ai-roadmap/flow-components/Flow";

export default function RoadmapPage({ params }: { params: { id: string } }) {
  return <Flow roadmapId={params.id} />;
}
