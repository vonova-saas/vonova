"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAiSubscription,
  useAiUsageStats,
} from "@/hooks/app/community/use-social";
import {
  FEATURE_COST,
  getMonthlyCreditAllowance,
  formatUtcMonthlyResetShort,
  getNextUtcMonthStart,
} from "@/lib/ai/credits";

type AICreditsBadgeProps = {
  variant?: "inline" | "card";
  className?: string;
  upgradeHref?: string;
};

function useCreditsSnapshot() {
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
  const percent =
    allowance > 0 ? Math.min(100, Math.round((used / allowance) * 100)) : 0;
  const resetLabel = formatUtcMonthlyResetShort(getNextUtcMonthStart());

  return {
    plan,
    allowance,
    used,
    remaining,
    percent,
    resetLabel,
    isLoading: sub.isLoading || stats.isLoading,
  };
}

export function AICreditsBadge({
  variant = "inline",
  className,
  upgradeHref = "/pricing",
}: AICreditsBadgeProps) {
  const { plan, allowance, used, remaining, percent, resetLabel, isLoading } =
    useCreditsSnapshot();

  if (variant === "inline") {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "gap-1.5 rounded-full px-3 py-1 text-xs font-medium tabular-nums",
          plan === "PRO"
            ? "border-amber-300/40 bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
            : "bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-200",
          className,
        )}
      >
        {plan === "PRO" ? (
          <Crown className="h-3.5 w-3.5" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {isLoading ? (
          <span>AI credits…</span>
        ) : (
          <span>
            {plan} · {remaining.toLocaleString()} / {allowance.toLocaleString()}{" "}
            left
          </span>
        )}
      </Badge>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {plan === "PRO" ? (
              <Crown className="h-4 w-4 text-amber-500" />
            ) : (
              <Sparkles className="h-4 w-4 text-violet-500" />
            )}
            <p className="text-sm font-semibold">AI Credits</p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {plan}
          </Badge>
        </div>

        <div className="space-y-1">
          <Progress value={percent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {used.toLocaleString()} / {allowance.toLocaleString()} used this month
            {" · "}
            {remaining.toLocaleString()} remaining
          </p>
          <p className="text-[11px] text-muted-foreground">
            Resets {resetLabel} (monthly, UTC)
          </p>
        </div>

        {plan !== "PRO" && (
          <Link
            href={upgradeHref}
            className="block rounded-md bg-violet-600 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Upgrade to PRO
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
