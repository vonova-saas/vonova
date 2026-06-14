"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Layers,
  MessageSquare,
  ShieldAlert,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { adminPlatformAnalytics } from "@/services/app/community/social.api";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";

const PIE_COLORS = [
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#06b6d4",
  "#a855f7",
];

export default function AdminAnalyticsPage() {
  const auth = useAuthContextOptional();
  const role = auth?.user?.role;
  const isAdmin = role === "ADMIN" || role === "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => adminPlatformAnalytics(),
    enabled: isAdmin,
    refetchInterval: 60_000,
  });

  const series = useMemo(() => {
    if (!data) return [] as Array<{ day: string; posts: number; messages: number; follows: number }>;
    const days = new Map<string, { day: string; posts: number; messages: number; follows: number }>();
    const ensure = (key: string) => {
      if (!days.has(key))
        days.set(key, { day: key, posts: 0, messages: 0, follows: 0 });
      return days.get(key)!;
    };
    for (const r of data.series.postsLast7) ensure(r._id).posts = r.count;
    for (const r of data.series.messagesLast7)
      ensure(r._id).messages = r.count;
    for (const r of data.series.followsLast7) ensure(r._id).follows = r.count;
    return Array.from(days.values()).sort((a, b) =>
      a.day.localeCompare(b.day),
    );
  }, [data]);

  const moderationPie = useMemo(() => {
    if (!data) return [];
    return data.moderation.byAction.map((m) => ({
      name: m._id,
      value: m.count,
    }));
  }, [data]);

  if (!auth?.isLoading && !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h1 className="text-2xl font-semibold">Admins only</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Platform analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Realtime-ish snapshot of community activity, growth, and moderation
          load.
        </p>
      </header>

      {isLoading || !data ? (
        <div className="grid h-48 place-items-center text-muted-foreground">
          Loading…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Users" value={data.totals.users} icon={UsersRound} />
            <KpiCard label="Posts" value={data.totals.posts} icon={Layers} />
            <KpiCard
              label="Messages"
              value={data.totals.messages}
              icon={MessageSquare}
            />
            <KpiCard
              label="DAU"
              value={data.activity.dau}
              icon={Activity}
              hint={`WAU ${data.activity.wau} · MAU ${data.activity.mau}`}
            />
          </div>

          <section className="rounded-2xl border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              7-day activity
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="g-posts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-msg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" stroke="currentColor" fontSize={11} />
                  <YAxis stroke="currentColor" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--background, white)",
                      border: "1px solid var(--border, #e2e8f0)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="posts"
                    stroke="#8b5cf6"
                    fill="url(#g-posts)"
                    name="Posts"
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="#06b6d4"
                    fill="url(#g-msg)"
                    name="Messages"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border bg-card p-4">
              <h2 className="mb-2 text-sm font-medium">Follow growth</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" stroke="currentColor" fontSize={11} />
                    <YAxis stroke="currentColor" fontSize={11} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="follows"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-4">
              <h2 className="mb-2 text-sm font-medium">Moderation actions</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moderationPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {moderationPie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border bg-card p-4">
              <h2 className="mb-2 text-sm font-medium">Top groups</h2>
              <ul className="divide-y">
                {data.topGroups.map((g) => (
                  <li
                    key={g._id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="truncate font-medium">{g.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {g.membersCount.toLocaleString()} members ·{" "}
                      {g.postsCount.toLocaleString()} posts
                    </span>
                  </li>
                ))}
                {data.topGroups.length === 0 && (
                  <li className="py-4 text-center text-xs text-muted-foreground">
                    No data
                  </li>
                )}
              </ul>
            </section>

            <section className="rounded-2xl border bg-card p-4">
              <h2 className="mb-2 text-sm font-medium">Top contributors</h2>
              <ul className="divide-y">
                {data.topAuthors.map((a) => (
                  <li
                    key={a._id}
                    className="flex items-center gap-2 py-2 text-sm"
                  >
                    <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
                      {a.user?.profilePictureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.user.profilePictureUrl}
                          alt={a.user.name ?? "user"}
                        />
                      ) : null}
                    </div>
                    <span className="truncate font-medium">
                      {a.user?.name ?? a.user?.username}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {a.posts} posts
                    </span>
                  </li>
                ))}
                {data.topAuthors.length === 0 && (
                  <li className="py-4 text-center text-xs text-muted-foreground">
                    No data
                  </li>
                )}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
      {hint && (
        <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
