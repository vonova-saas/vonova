"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAiSubscription,
  useAiUsageStats,
} from "@/hooks/app/community/use-social";
import {
  FEATURE_COST,
  FEATURE_COST_ROWS,
  formatUtcMonthlyResetShort,
  getMonthlyCreditAllowance,
  getNextUtcMonthStart,
} from "@/lib/ai/credits";

export type AiCreditsPanelProps = {
  variant?: "full" | "inline";
  showFeatureCosts?: boolean;
  className?: string;
  upgradeHref?: string;
};

export function AiCreditsPanel({
  variant = "full",
  showFeatureCosts = true,
  className,
  upgradeHref = "/pricing",
}: AiCreditsPanelProps) {
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
  const resetAt = getNextUtcMonthStart();
  const resetLabel = formatUtcMonthlyResetShort(resetAt);

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "mx-auto w-full max-w-xl rounded-xl border bg-background/70 px-4 py-3 text-left backdrop-blur-sm",
          className,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            {plan === "PRO" ? (
              <Crown className="h-4 w-4 text-amber-500" />
            ) : (
              <Sparkles className="h-4 w-4 text-violet-500" />
            )}
            <span>AI Credits</span>
            <Badge variant="secondary" className="rounded-full text-[10px]">
              {plan}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {used.toLocaleString()} / {allowance.toLocaleString()} used ·{" "}
            {remaining.toLocaleString()} left
          </span>
        </div>
        <Progress value={percent} className="mt-2 h-1.5" />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Monthly pool · resets {resetLabel} (UTC)
        </p>
        {showFeatureCosts && (
          <ul className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
            {FEATURE_COST_ROWS.map((row) => (
              <li key={row.feature}>
                {row.label} → {row.cost} credits
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {plan === "PRO" ? (
              <Crown className="h-5 w-5 text-amber-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-violet-500" />
            )}
            <div>
              <p className="text-sm font-semibold leading-tight">AI Credits</p>
              <p className="text-xs text-muted-foreground">
                Current plan: {plan}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {plan}
          </Badge>
        </div>

        <div className="space-y-2">
          <Progress value={percent} className="h-2.5" />
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {used.toLocaleString()} / {allowance.toLocaleString()} used
            </span>
            <span className="tabular-nums font-medium text-foreground">
              {remaining.toLocaleString()} remaining
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Monthly limit · resets on {resetLabel} at 00:00 UTC
          </p>
        </div>

        {showFeatureCosts && (
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <p className="mb-2 text-xs font-medium text-foreground">
              Feature costs
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {FEATURE_COST_ROWS.map((row) => (
                <li
                  key={row.feature}
                  className="flex justify-between gap-4 tabular-nums"
                >
                  <span>{row.label}</span>
                  <span>{row.cost} credits</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {plan !== "PRO" && (
          <Link
            href={upgradeHref}
            className="block rounded-md bg-violet-600 px-3 py-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Upgrade for more credits
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
