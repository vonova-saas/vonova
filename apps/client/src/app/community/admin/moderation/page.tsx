"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  adminModerationQueue,
  adminModerationResolve,
  adminModerationStats,
  type AiModerationAction,
  type AiModerationResult,
  type AiModerationSeverity,
} from "@/services/app/community/social.api";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import {
  SOCKET_EVENTS,
  useSocketEvent,
} from "@/providers/community-socket-provider";

const SEVERITIES: Array<AiModerationSeverity | "ALL"> = [
  "ALL",
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
];

const ACTIONS: Array<AiModerationAction> = [
  "ALLOW",
  "FLAG",
  "SHADOW_BLOCK",
  "DELETE",
  "ESCALATE",
];

const severityColor: Record<AiModerationSeverity, string> = {
  CRITICAL: "bg-rose-500/15 text-rose-600 border-rose-500/40",
  HIGH: "bg-amber-500/15 text-amber-600 border-amber-500/40",
  MEDIUM: "bg-sky-500/15 text-sky-600 border-sky-500/40",
  LOW: "bg-emerald-500/15 text-emerald-600 border-emerald-500/40",
};

export default function AdminModerationPage() {
  const auth = useAuthContextOptional();
  const role = auth?.user?.role;
  const isAdmin = role === "ADMIN" || role === "admin";

  const qc = useQueryClient();
  const [severity, setSeverity] = useState<AiModerationSeverity | "ALL">("ALL");
  const [reviewed, setReviewed] = useState<"pending" | "done" | "all">(
    "pending",
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: [
      "admin",
      "moderation",
      "queue",
      severity,
      reviewed,
    ],
    queryFn: () =>
      adminModerationQueue({
        severity: severity === "ALL" ? undefined : severity,
        reviewed,
        limit: 30,
      }),
    enabled: isAdmin,
    refetchInterval: 30_000,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin", "moderation", "stats"],
    queryFn: () => adminModerationStats(),
    enabled: isAdmin,
    refetchInterval: 60_000,
  });

  // Live updates when new moderation events fire on the backend.
  useSocketEvent("moderation:resolved" as typeof SOCKET_EVENTS.POST_NEW, () => {
    qc.invalidateQueries({ queryKey: ["admin", "moderation"] });
  });

  const resolve = useMutation({
    mutationFn: ({
      resultId,
      action,
    }: {
      resultId: string;
      action: AiModerationAction;
    }) => adminModerationResolve(resultId, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "moderation"] });
    },
  });

  const grouped = useMemo(() => {
    const items = data?.items ?? [];
    return {
      critical: items.filter((i) => i.severity === "CRITICAL"),
      high: items.filter((i) => i.severity === "HIGH"),
      others: items.filter(
        (i) => i.severity !== "HIGH" && i.severity !== "CRITICAL",
      ),
    };
  }, [data]);

  if (!auth?.isLoading && !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h1 className="text-2xl font-semibold">Admins only</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to view the moderation dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            AI moderation queue
          </h1>
          <p className="text-sm text-muted-foreground">
            Review automated decisions and approve, escalate, or override them.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </header>

      <StatGrid stats={stats} />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Severity:</span>
        {SEVERITIES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeverity(s)}
            className={cn(
              "rounded-full border px-3 py-1",
              severity === s
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {s}
          </button>
        ))}
        <span className="ml-4 text-muted-foreground">State:</span>
        {(["pending", "done", "all"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReviewed(r)}
            className={cn(
              "rounded-full border px-3 py-1 capitalize",
              reviewed === r
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <p className="font-medium">All clear</p>
          <p className="text-sm text-muted-foreground">
            Nothing in the moderation queue matches your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.critical.length > 0 && (
            <Section title="Critical" tone="rose">
              {grouped.critical.map((item) => (
                <ModerationRow
                  key={item._id}
                  item={item}
                  onResolve={(action) =>
                    resolve.mutate({ resultId: item._id, action })
                  }
                  busy={resolve.isPending}
                />
              ))}
            </Section>
          )}
          {grouped.high.length > 0 && (
            <Section title="High" tone="amber">
              {grouped.high.map((item) => (
                <ModerationRow
                  key={item._id}
                  item={item}
                  onResolve={(action) =>
                    resolve.mutate({ resultId: item._id, action })
                  }
                  busy={resolve.isPending}
                />
              ))}
            </Section>
          )}
          {grouped.others.length > 0 && (
            <Section title="Other" tone="muted">
              {grouped.others.map((item) => (
                <ModerationRow
                  key={item._id}
                  item={item}
                  onResolve={(action) =>
                    resolve.mutate({ resultId: item._id, action })
                  }
                  busy={resolve.isPending}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function StatGrid({
  stats,
}: {
  stats?: Awaited<ReturnType<typeof adminModerationStats>>;
}) {
  const bySeverity = stats?.bySeverity ?? [];
  const byAction = stats?.byAction ?? [];
  const total24 = stats?.last24h ?? 0;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard label="Last 24h" value={total24} icon={AlertTriangle} />
      <StatCard
        label="Critical"
        value={bySeverity.find((s) => s._id === "CRITICAL")?.count ?? 0}
        icon={ShieldAlert}
        tone="rose"
      />
      <StatCard
        label="Shadow blocked"
        value={byAction.find((a) => a._id === "SHADOW_BLOCK")?.count ?? 0}
        icon={Trash2}
      />
      <StatCard
        label="Cleared"
        value={byAction.find((a) => a._id === "ALLOW")?.count ?? 0}
        icon={CheckCircle2}
        tone="emerald"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "rose" | "emerald";
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "rose" && "text-rose-500",
            tone === "emerald" && "text-emerald-500",
          )}
        />
        {label}
      </div>
      <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "rose" | "amber" | "muted";
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={cn(
          "mb-2 text-sm font-medium uppercase tracking-wide",
          tone === "rose" && "text-rose-600",
          tone === "amber" && "text-amber-600",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ModerationRow({
  item,
  onResolve,
  busy,
}: {
  item: AiModerationResult;
  onResolve: (action: AiModerationAction) => void;
  busy?: boolean;
}) {
  const sample = item.rawResponse?.sample ?? "";
  const reasons = item.rawResponse?.reasons ?? [];
  const reviewed = !!item.reviewedAt;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-card p-4",
        reviewed && "opacity-70",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge
          className={cn("border", severityColor[item.severity])}
          variant="outline"
        >
          {item.severity}
        </Badge>
        <Badge variant="outline">{item.targetType}</Badge>
        <Badge variant="outline" className="font-mono">
          AI: {item.action}
        </Badge>
        {item.categories.map((c) => (
          <Badge key={c} variant="secondary">
            {c}
          </Badge>
        ))}
        <span className="ml-auto">
          {new Date(item.createdAt).toLocaleString()}
        </span>
      </div>
      {sample && (
        <p className="mb-2 line-clamp-3 rounded-lg bg-muted/40 p-2 text-sm">
          &ldquo;{sample}&rdquo;
        </p>
      )}
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>
          Confidence:{" "}
          <span className="font-mono">
            {(item.confidence * 100).toFixed(0)}%
          </span>
        </span>
        {reasons.length > 0 && <span>· Reasons: {reasons.join(", ")}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <Button
            key={action}
            type="button"
            size="sm"
            variant={action === "DELETE" ? "destructive" : "outline"}
            disabled={busy}
            onClick={() => onResolve(action)}
          >
            {action.replace("_", " ").toLowerCase()}
          </Button>
        ))}
      </div>
      {reviewed && (
        <p className="mt-2 text-xs text-emerald-600">
          Resolved as {item.reviewedAction}
        </p>
      )}
    </motion.article>
  );
}
