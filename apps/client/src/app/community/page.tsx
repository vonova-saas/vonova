"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/community/social/post-card";
import { PostComposer } from "@/components/community/social/post-composer";
import { useCommunityFeed } from "@/hooks/app/community/use-social";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

type FeedScope = "for-you" | "explore";

export default function CommunityFeedPage() {
  const auth = useAuthContextOptional();
  const [scope, setScope] = useState<FeedScope>(
    auth?.isAuthenticated ? "for-you" : "explore",
  );

  useEffect(() => {
    if (!auth?.isAuthenticated) setScope("explore");
  }, [auth?.isAuthenticated]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useCommunityFeed(scope);

  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {auth?.isAuthenticated && <PostComposer />}

      <Tabs value={scope} onValueChange={(v) => setScope(v as FeedScope)}>
        <TabsList className="rounded-full">
          <TabsTrigger value="for-you" disabled={!auth?.isAuthenticated} className="rounded-full">
            For you
          </TabsTrigger>
          <TabsTrigger value="explore" className="rounded-full">
            Explore
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
          No posts yet. Follow people or visit Explore.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      <div ref={sentinel} />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
    </div>
  );
}
