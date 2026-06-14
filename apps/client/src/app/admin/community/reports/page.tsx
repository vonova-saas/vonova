"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Flag, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import {
  adminApplyReportAction,
  adminListReports,
  adminUpdateReportStatus,
} from "@/services/app/community/reports.api";
import type {
  ContentReport,
  ModerationResolutionAction,
  ReportStatus,
} from "@/types/api/app/community/reports.type";
import { useSocketEvent } from "@/providers/community-socket-provider";
import { SOCKET_EVENTS } from "@/providers/community-socket-provider";

const STATUS_COLORS: Record<ReportStatus, string> = {
  OPEN: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  REVIEWING: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  RESOLVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-muted text-muted-foreground",
};

export default function AdminCommunityReportsPage() {
  const auth = useAuthContextOptional();
  const qc = useQueryClient();
  const role = String(auth?.user?.role ?? "").toUpperCase();
  const isAdmin = role === "ADMIN";

  const [status, setStatus] = useState<ReportStatus | "all">("OPEN");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ContentReport | null>(null);

  const queryKey = useMemo(
    () => ["admin", "reports", status, search, page],
    [status, search, page],
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      adminListReports({
        status: status === "all" ? undefined : status,
        search: search.trim() || undefined,
        page,
        limit: 20,
        sort: "score",
      }),
    enabled: isAdmin,
    refetchInterval: 30_000,
  });

  useSocketEvent(SOCKET_EVENTS.MODERATION_REPORT_UPDATED, () => {
    void qc.invalidateQueries({ queryKey: ["admin", "reports"] });
  });

  const statusMutation = useMutation({
    mutationFn: (s: ReportStatus) =>
      adminUpdateReportStatus(selected!._id, s),
    onSuccess: () => {
      toast.success("Status updated");
      void qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });

  const actionMutation = useMutation({
    mutationFn: (action: ModerationResolutionAction) =>
      adminApplyReportAction(selected!._id, action),
    onSuccess: () => {
      toast.success("Action applied");
      setSelected(null);
      void qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });

  if (!auth?.isLoading && !isAdmin) {
    return (
      <div className="mx-auto max-w-lg p-12 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h1 className="text-xl font-semibold">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need platform admin access to view the report queue.
        </p>
        <Button className="mt-6" asChild variant="outline">
          <Link href="/community">Back to community</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl space-y-6 bg-background p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Flag className="h-6 w-6" />
            Moderation reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Review user reports, preview content, and apply safety actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/community/admin/moderation">AI queue</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/community">Community</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search target id or description…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as ReportStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="REVIEWING">Reviewing</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Queue</CardTitle>
            <CardDescription>{data?.total ?? 0} reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : data?.items.length ? (
              data.items.map((r) => (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => setSelected(r)}
                  className={`w-full rounded-lg border p-3 text-left transition hover:bg-muted/50 ${
                    selected?._id === r._id ? "border-primary bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-xs">
                      {r.targetType}
                    </Badge>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {r.preview?.text || r.reason}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(r.createdAt), {
                      addSuffix: true,
                    })}
                    {r.autoModScore != null && r.autoModScore > 0
                      ? ` · risk ${r.autoModScore}`
                      : ""}
                  </p>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No reports match filters.
              </p>
            )}
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data?.hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Review</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Select a report to preview and act.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{selected.targetType}</Badge>
                  <Badge variant="secondary">{selected.reason}</Badge>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[selected.status]}`}
                  >
                    {selected.status}
                  </span>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  {selected.preview?.removed ? (
                    <p className="text-muted-foreground italic">
                      Content removed or unavailable
                    </p>
                  ) : (
                    <p className="whitespace-pre-wrap">
                      {selected.preview?.text || "—"}
                    </p>
                  )}
                </div>
                {selected.description ? (
                  <p className="text-xs text-muted-foreground">
                    Reporter note: {selected.description}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate("REVIEWING")}
                  >
                    Mark reviewing
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => statusMutation.mutate("REJECTED")}
                  >
                    Reject
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Quick actions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "NO_ACTION",
                        "WARN_USER",
                        "REMOVE_CONTENT",
                        "TEMP_MUTE",
                        "TEMP_BAN",
                        "PERMANENT_BAN",
                      ] as ModerationResolutionAction[]
                    ).map((a) => (
                      <Button
                        key={a}
                        size="sm"
                        variant={
                          a.includes("BAN") || a === "REMOVE_CONTENT"
                            ? "destructive"
                            : "secondary"
                        }
                        disabled={actionMutation.isPending}
                        onClick={() => actionMutation.mutate(a)}
                      >
                        {a.replace(/_/g, " ")}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
