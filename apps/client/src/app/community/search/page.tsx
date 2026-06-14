"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Hash, Loader2, Search, Users, Group as GroupIcon, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  searchCommunity,
  type SearchType,
} from "@/services/app/community/social.api";
import { PresignedMediaImage } from "@/components/shared/presigned-media-image";
import { S3_PRESIGNED_QUERY_STALE_MS } from "@/lib/lms/presigned-url";

const RECENT_KEY = "community.recentSearches.v1";

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function pushRecent(q: string) {
  if (typeof window === "undefined") return;
  const cur = loadRecent();
  const next = [q, ...cur.filter((x) => x !== q)].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

// Next.js statically prerenders client pages at build time. `useSearchParams`
// reads from the request URL and therefore needs to live under a Suspense
// boundary so the prerender can bail out gracefully. We keep the actual
// content in `SearchPageInner` and wrap it once at the page root.
export default function CommunitySearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageFallback() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Search community</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            disabled
            placeholder="Search people, posts, groups, #hashtags…"
            className="pl-9"
          />
        </div>
      </div>
    </div>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const initialType = (params.get("type") as SearchType) ?? "all";

  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState<SearchType>(initialType);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => setRecent(loadRecent()), []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedQ) next.set("q", debouncedQ);
    if (type !== "all") next.set("type", type);
    router.replace(`/community/search${next.toString() ? `?${next}` : ""}`, {
      scroll: false,
    });
  }, [debouncedQ, type, router]);

  const enabled = debouncedQ.length > 0;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["community", "search", debouncedQ, type],
    queryFn: () => searchCommunity({ q: debouncedQ, type, limit: 20 }),
    enabled,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
  });

  const qc = useQueryClient();
  const refreshProfilePicture = useCallback(
    async (userId: string) => {
      const r = await qc.fetchQuery({
        queryKey: ["community", "search", debouncedQ, type],
        queryFn: () => searchCommunity({ q: debouncedQ, type, limit: 20 }),
      });
      const user = r?.users?.find((x) => x._id === userId);
      return user?.profilePictureUrl ?? null;
    },
    [qc, debouncedQ, type],
  );

  useEffect(() => {
    if (debouncedQ && data) {
      pushRecent(debouncedQ);
      setRecent(loadRecent());
    }
  }, [debouncedQ, data]);

  const counts = useMemo(
    () => ({
      users: data?.users?.length ?? 0,
      posts: data?.posts?.length ?? 0,
      groups: data?.groups?.length ?? 0,
      hashtags: data?.hashtags?.length ?? 0,
    }),
    [data],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Search community</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people, posts, groups, #hashtags…"
            className="pl-9"
          />
          {isFetching && enabled && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {!enabled && recent.length > 0 && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Recent searches
            </p>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setQ(r)}
                  className="rounded-full border bg-card px-3 py-1 text-xs hover:bg-muted"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Tabs value={type} onValueChange={(v) => setType(v as SearchType)}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="users">
            People {counts.users ? `(${counts.users})` : ""}
          </TabsTrigger>
          <TabsTrigger value="posts">
            Posts {counts.posts ? `(${counts.posts})` : ""}
          </TabsTrigger>
          <TabsTrigger value="groups">
            Groups {counts.groups ? `(${counts.groups})` : ""}
          </TabsTrigger>
          <TabsTrigger value="hashtags">
            Hashtags {counts.hashtags ? `(${counts.hashtags})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 pt-4">
          <PeopleSection
            data={data?.users ?? []}
            onRefreshAvatar={refreshProfilePicture}
          />
          <PostsSection data={data?.posts ?? []} />
          <GroupsSection data={data?.groups ?? []} />
          <HashtagsSection data={data?.hashtags ?? []} />
        </TabsContent>
        <TabsContent value="users" className="pt-4">
          <PeopleSection
            data={data?.users ?? []}
            onRefreshAvatar={refreshProfilePicture}
          />
        </TabsContent>
        <TabsContent value="posts" className="pt-4">
          <PostsSection data={data?.posts ?? []} />
        </TabsContent>
        <TabsContent value="groups" className="pt-4">
          <GroupsSection data={data?.groups ?? []} />
        </TabsContent>
        <TabsContent value="hashtags" className="pt-4">
          <HashtagsSection data={data?.hashtags ?? []} />
        </TabsContent>
      </Tabs>

      {enabled && !isLoading && !isFetching && data && counts.users + counts.posts + counts.groups + counts.hashtags === 0 && (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Nothing matched &ldquo;{debouncedQ}&rdquo;.
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{title}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

function PeopleSection({
  data,
  onRefreshAvatar,
}: {
  data: Array<{
    _id: string;
    name?: string;
    username?: string;
    profilePictureUrl?: string;
    headline?: string;
  }>;
  onRefreshAvatar: (userId: string) => Promise<string | null>;
}) {
  if (!data.length) return null;
  return (
    <section>
      <SectionHeader icon={Users} title="People" count={data.length} />
      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((u) => (
          <Link
            key={u._id}
            href={u.username ? `/community/profile/${u.username}` : "#"}
            className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted/40"
          >
            <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
              {u.profilePictureUrl ? (
                <PresignedMediaImage
                  src={u.profilePictureUrl}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-cover"
                  alt={u.name ?? "User"}
                  onRefreshSrc={() => onRefreshAvatar(u._id)}
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{u.name ?? u.username}</div>
              <div className="truncate text-xs text-muted-foreground">
                {u.headline ?? `@${u.username ?? ""}`}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PostsSection({
  data,
}: {
  data: Array<{
    _id: string;
    content: string;
    hashtags?: string[];
    author?: {
      name?: string;
      username?: string;
      profilePictureUrl?: string;
    };
    createdAt: string;
  }>;
}) {
  if (!data.length) return null;
  return (
    <section>
      <SectionHeader icon={FileText} title="Posts" count={data.length} />
      <div className="space-y-2">
        {data.map((p) => (
          <article
            key={p._id}
            className="rounded-xl border bg-card p-3 text-sm"
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {p.author?.name ?? p.author?.username ?? "Anonymous"}
              </span>
              <span>•</span>
              <time>{new Date(p.createdAt).toLocaleString()}</time>
            </div>
            <p className="line-clamp-3 whitespace-pre-wrap">{p.content}</p>
            {p.hashtags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {p.hashtags.map((h) => (
                  <span
                    key={h}
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px]"
                  >
                    #{h}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function GroupsSection({
  data,
}: {
  data: Array<{ _id: string; name: string; description?: string }>;
}) {
  if (!data.length) return null;
  return (
    <section>
      <SectionHeader icon={GroupIcon} title="Groups" count={data.length} />
      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((g) => (
          <Link
            key={g._id}
            href={`/community/groups/${g._id}`}
            className="rounded-xl border bg-card p-3 hover:bg-muted/40"
          >
            <div className="font-medium">{g.name}</div>
            {g.description && (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {g.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function HashtagsSection({
  data,
}: {
  data: Array<{ tag: string; count: number }>;
}) {
  if (!data.length) return null;
  return (
    <section>
      <SectionHeader icon={Hash} title="Hashtags" count={data.length} />
      <div className="flex flex-wrap gap-2">
        {data.map((h) => (
          <Link
            key={h.tag}
            href={`/community/search?q=${encodeURIComponent(`#${h.tag}`)}&type=posts`}
            className="rounded-full border bg-card px-3 py-1 text-xs hover:bg-muted"
          >
            #{h.tag}
            <span className="ml-1 text-muted-foreground">({h.count})</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
