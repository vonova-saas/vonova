"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useAiSubscription,
  useAiUsageStats,
} from "@/hooks/app/community/use-social";
import {
  FEATURE_COST,
  getMonthlyCreditAllowance,
} from "@/lib/ai/credits";
import { AiCreditsPanel } from "@/components/shared/ai-credits/ai-credits-panel";

type AiCreditsNavButtonProps = {
  className?: string;
  upgradeHref?: string;
};

export function AiCreditsNavButton({
  className,
  upgradeHref = "/pricing",
}: AiCreditsNavButtonProps) {
  const sub = useAiSubscription();
  const stats = useAiUsageStats();

  const plan = sub.data?.plan ?? stats.data?.plan ?? "FREE";

  const fallbackUsed = useMemo(() => {
    const rows = stats.data?.today ?? [];
    return rows.reduce((acc, entry) => {
      if (!entry || typeof entry !== "object") return acc;
      if (typeof entry.credits === "number") return acc + entry.credits;
      const key = entry._id;
      if (typeof key !== "string" || !(key in FEATURE_COST)) {
        return acc + (entry.count || 0);
      }
      const cost = FEATURE_COST[key as keyof typeof FEATURE_COST];
      return acc + cost * (entry.count || 0);
    }, 0);
  }, [stats.data]);

  const allowance =
    stats.data?.limit && stats.data.limit > 0
      ? stats.data.limit
      : getMonthlyCreditAllowance(plan);
  const used = stats.data?.used ?? fallbackUsed;
  const remaining =
    stats.data?.remaining ?? Math.max(0, allowance - used);

  const label =
    sub.isLoading || stats.isLoading
      ? "AI credits…"
      : `${plan} · ${remaining.toLocaleString()}/${allowance.toLocaleString()} left`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-9 shrink-0 gap-1 rounded-lg border-border bg-background/80 px-3 text-xs font-medium tabular-nums shadow-sm backdrop-blur-sm hover:bg-muted/80",
            className,
          )}
          aria-label="Open AI credits details"
        >
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(100vw-2rem,22rem)] border-border/80 p-0 shadow-lg"
        align="end"
        sideOffset={8}
      >
        <div className="max-h-[min(70vh,32rem)] overflow-y-auto p-3 sm:p-4">
          <AiCreditsPanel
            variant="full"
            upgradeHref={upgradeHref}
            className="border-0 shadow-none"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
