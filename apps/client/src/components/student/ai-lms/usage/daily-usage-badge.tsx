"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { getMyUsageQueryFn } from "@/services/student/lms-ai/roadmap-generator/roadmap.api";

type UsageBucket = {
  used: number;
  limit: number | null;
  remaining: number | null;
};

type UsageResponse = {
  date: string;
  timezone: string;
  ai_roadmap: UsageBucket;
  pdf_summary: UsageBucket;
  pdf_voice: UsageBucket;
};

function formatRemaining(remaining: number | null) {
  return remaining === null ? "∞" : String(remaining);
}

export default function DailyUsageBadge() {
  const { data } = useQuery<UsageResponse>({
    queryKey: ["me-usage"],
    queryFn: getMyUsageQueryFn,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const chips = useMemo(() => {
    const usage = data;
    return [
      {
        key: "ai_roadmap",
        label: "Roadmaps",
        remaining: formatRemaining(usage?.ai_roadmap?.remaining ?? null),
      },
      {
        key: "pdf_summary",
        label: "PDF Uploads",
        remaining: formatRemaining(usage?.pdf_summary?.remaining ?? null),
      },
      {
        key: "pdf_voice",
        label: "Voice Chats",
        remaining: formatRemaining(usage?.pdf_voice?.remaining ?? null),
      },
    ];
  }, [data]);

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border bg-background/70 px-3 py-2 backdrop-blur-sm">
      <span className="text-xs font-medium text-muted-foreground">
        Daily quota ({data?.timezone ?? "UTC"})
      </span>
      {chips.map((chip) => (
        <Badge key={chip.key} variant="secondary" className="rounded-full">
          {chip.label}: {chip.remaining}
        </Badge>
      ))}
    </div>
  );
}

