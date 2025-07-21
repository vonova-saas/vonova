"use client";
import Roadmap from "@/components/dashboard/student/ai-roadmap/roadmap/roadmap";
import { Suspense } from "react";
import { ReactFlowProvider } from "reactflow";

export default function AIRoadmapGeneratorPage() {
  return (
    <Suspense fallback={<></>}>
      <ReactFlowProvider>
        <Roadmap />
      </ReactFlowProvider>
    </Suspense>
  );
}
