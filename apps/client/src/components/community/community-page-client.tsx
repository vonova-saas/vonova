"use client";

import { useAuthContext } from "@/context/app/auth/auth-context";
import {
  createArticle,
  createComment,
  createPost,
  deleteComment,
  deletePost,
  fetchArticles,
  fetchComments,
  fetchPosts,
  fetchPostsByUser,
  sharePost,
  toggleCommentLike,
  togglePostLike,
} from "@/services/app/community/community.api";
import type {
  CommunityArticle,
  CommunityArticleCategory,
  CommunityAuthor,
  CommunityComment,
  CommunityPost,
} from "@/types/api/app/community/community.types";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Heart,
  Loader2,
  MessageCircle,
  PenLine,
  Share2,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks";
import { cn } from "@/lib/utils";

const CATEGORIES: CommunityArticleCategory[] = [
  "architecture",
  "devops",
  "backend",
  "databases",
  "frontend",
  "mobile",
  "ai",
  "security",
];

function authorName(author: CommunityArticle["author"] | CommunityPost["author"]): string {
  if (!author || typeof author === "string") return "Member";
  return author.name || author.email || "Member";
}

function authorPic(author: CommunityArticle["author"] | CommunityPost["author"]): string | undefined {
  if (!author || typeof author === "string") return undefined;
  return author.avatar || author.profilePicture;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "V";
}

function readMinutes(article: CommunityArticle): number | null {
  if (article.wordCount && article.wordCount > 0) {
    return Math.max(1, Math.ceil(article.wordCount / 200));
  }
  return null;
}

function pickArticleCardImage(article: CommunityArticle): string | undefined {
  if (article.coverImage) return article.coverImage.trim();
  if (article.images?.[0]) return article.images[0].trim();
  const firstImageBlock = article.contentBlocks?.find((b) => b.type === "image" && b.url);
  return firstImageBlock?.url?.trim();
}

function ArticlePreviewImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const safeSrc = src ? encodeURI(src) : "";

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 to-muted">
        <BookOpen className="h-10 w-10 text-primary/60" />
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function pickPostImage(post: CommunityPost): string | undefined {
  if (post.image) return post.image.trim();
  if (post.images?.[0]) return post.images[0].trim();
  return undefined;
}

function resolveOriginalPost(post: CommunityPost): CommunityPost | null {
  if (post.originalPost && typeof post.originalPost === "object") return post.originalPost;
  if (post.sharedPost && typeof post.sharedPost === "object") return post.sharedPost;
  if ((post as unknown as { original_post?: CommunityPost }).original_post) {
    return (post as unknown as { original_post?: CommunityPost }).original_post ?? null;
  }
  if ((post as unknown as { repost?: CommunityPost }).repost) {
    return (post as unknown as { repost?: CommunityPost }).repost ?? null;
  }
  return null;
}

async function fetchAllRepostUsersForPost(postId: string): Promise<CommunityAuthor[]> {
  const seen = new Set<string>();
  const users: CommunityAuthor[] = [];
  const limit = 50;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const payload = await fetchPosts(page, limit);
    totalPages = Math.max(1, payload.totalPages ?? 1);
    for (const post of payload.posts ?? []) {
      const original = resolveOriginalPost(post);
      if (!original || original._id !== postId) continue;
      if (!post.author || typeof post.author === "string") continue;
      const key = post.author._id ?? post.author.email ?? post.author.name ?? "";
      if (!key || seen.has(key)) continue;
      seen.add(key);
      users.push(post.author);
    }
    page += 1;
  }

  return users;
}

function isMostlyArabic(text?: string): boolean {
  if (!text) return false;
  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinCount = (text.match(/[A-Za-z]/g) || []).length;
  return arabicCount > latinCount && arabicCount > 6;
}

function FeedEndSentinel({
  hasNext,
  isFetchingNext,
  onLoadMore,
}: {
  hasNext: boolean;
  isFetchingNext: boolean;
  onLoadMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasNext) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNext) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNext, isFetchingNext, onLoadMore]);

  if (!hasNext) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="flex min-h-14 items-center justify-center text-sm text-muted-foreground"
      aria-hidden
    >
      {isFetchingNext ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
    </div>
  );
}

export type CommunityPageClientProps = {
  area: "student" | "instructor";
  userId: string;
};

export default function CommunityPageClient({ area, userId }: CommunityPageClientProps) {
  const { user, role } = useAuthContext();
  const { toast } = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const isAdmin = role === "ADMIN";

  const [tab, setTab] = useState<"articles" | "feed">("feed");
  const [articlePage, setArticlePage] = useState(1);
  const [category, setCategory] = useState<CommunityArticleCategory | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCats, setNewCats] = useState<CommunityArticleCategory[]>(["frontend"]);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [postContent, setPostContent] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postComposerOpen, setPostComposerOpen] = useState(false);
  const [postScope, setPostScope] = useState<"all" | "mine">("all");
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentFiles, setCommentFiles] = useState<Record<string, File | null>>({});
  const postPhotoInputRef = useRef<HTMLInputElement>(null);

  const articleParams = useMemo(
    () => ({
      page: articlePage,
      limit: 9,
      ...(category !== "all" ? { category } : {}),
    }),
    [articlePage, category],
  );

  const articlesQuery = useQuery({
    queryKey: ["community", "articles", articleParams],
    queryFn: () => fetchArticles(articleParams),
    retry: 2,
    staleTime: 30_000,
  });

  const postsInfinite = useInfiniteQuery({
    queryKey: ["community", "posts", postScope, userId || "session"],
    queryFn: ({ pageParam }) =>
      postScope === "mine"
        ? fetchPostsByUser(userId, pageParam, 10)
        : fetchPosts(pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.page ?? 1;
      const totalPages = lastPage.totalPages ?? 0;
      if (totalPages <= 0) {
        return undefined;
      }
      return page < totalPages ? page + 1 : undefined;
    },
    retry: 2,
    staleTime: 30_000,
    enabled: postScope === "all" ? true : Boolean(userId),
  });

  const feedPosts = useMemo(() => {
    const rows = postsInfinite.data?.pages.flatMap((p) => p.posts) ?? [];
    const seen = new Set<string>();
    return rows.filter((p) => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });
  }, [postsInfinite.data?.pages]);

  const postsTotal = postsInfinite.data?.pages[0]?.total;

  const repostUsersByPostId = useMemo(() => {
    const byPost = new Map<string, CommunityAuthor[]>();
    for (const post of feedPosts) {
      const original = resolveOriginalPost(post);
      if (!original?._id) continue;
      if (!post.author || typeof post.author === "string") continue;
      const current = byPost.get(original._id) ?? [];
      if (!current.some((u) => u._id && post.author && typeof post.author === "object" && u._id === post.author._id)) {
        current.push(post.author);
      }
      byPost.set(original._id, current);
    }
    return byPost;
  }, [feedPosts]);

  const loadMorePosts = useCallback(() => {
    if (postsInfinite.hasNextPage && !postsInfinite.isFetchingNextPage) {
      void postsInfinite.fetchNextPage();
    }
  }, [postsInfinite]);

  const commentsQuery = useQuery({
    queryKey: ["community", "comments", expandedPostId],
    queryFn: () => fetchComments(expandedPostId as string, 1, 30),
    enabled: Boolean(expandedPostId),
  });

  const createArticleMut = useMutation({
    mutationFn: () =>
      createArticle({
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCats,
        contentBlocks: [
          { type: "paragraph", order: 0, content: newBody.trim() || " " },
        ],
        coverFiles: coverFile ? [coverFile] : undefined,
      }),
    onSuccess: () => {
      toast({ title: "Article submitted", description: "Your article was created." });
      setCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewBody("");
      setCoverFile(null);
      void qc.invalidateQueries({ queryKey: ["community", "articles"] });
    },
    onError: (e: unknown) => {
      const raw =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "";
      const msg =
        /E11000 duplicate key|dup key/i.test(raw)
          ? "That article URL (slug) is already taken. Change the title or try again."
          : raw || "Could not create article.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });


  const createPostMut = useMutation({
    mutationFn: () => createPost(postContent.trim(), postFile ?? undefined),
    onSuccess: () => {
      setPostContent("");
      setPostFile(null);
      setPostComposerOpen(false);
      toast({ title: "Posted" });
      void qc.invalidateQueries({ queryKey: ["community", "posts"] });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not publish post.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const likePostMut = useMutation({
    mutationFn: (postId: string) => togglePostLike(postId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["community", "posts"] }),
  });

  const sharePostMut = useMutation({
    mutationFn: (postId: string) => sharePost(postId),
    onSuccess: async (data) => {
      if (data.shareableLink && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(data.shareableLink);
        toast({ title: "Link copied", description: "Share link is on your clipboard." });
      }
      void qc.invalidateQueries({ queryKey: ["community", "posts"] });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not share.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deletePostMut = useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      toast({ title: "Post deleted" });
      void qc.invalidateQueries({ queryKey: ["community", "posts"] });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not delete post.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const createCommentMut = useMutation({
    mutationFn: ({ postId, text, image }: { postId: string; text: string; image?: File }) =>
      createComment(postId, text, image),
    onSuccess: (_, v) => {
      setCommentDrafts((d) => ({ ...d, [v.postId]: "" }));
      setCommentFiles((files) => ({ ...files, [v.postId]: null }));
      void qc.invalidateQueries({ queryKey: ["community", "comments", v.postId] });
      void qc.invalidateQueries({ queryKey: ["community", "posts"] });
      toast({ title: "Comment added" });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not comment.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteCommentMut = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["community", "comments", expandedPostId] });
      void qc.invalidateQueries({ queryKey: ["community", "posts"] });
      toast({ title: "Comment removed" });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not remove comment.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const likeCommentMut = useMutation({
    mutationFn: (commentId: string) => toggleCommentLike(commentId),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["community", "comments", expandedPostId] }),
  });

  const scrollToArticles = useCallback(() => {
    setTab("articles");
    document.getElementById("community-articles")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const hubLabel = area === "instructor" ? "Instructor hub" : "Student hub";

  return (
    <div className="min-h-full w-full pb-16">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
          <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            {hubLabel}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Learn together. Share what you build.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            A calm, editorial space for guides and conversations—similar in spirit to EqraaTech:
            curated articles, practical posts, and a community that grows with every lesson.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="rounded-full px-8" onClick={scrollToArticles}>
              <BookOpen className="mr-2 h-4 w-4" />
              Browse articles
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-primary/25 bg-background/60 backdrop-blur"
              onClick={() => {
                setTab("feed");
                document.getElementById("community-feed")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              Open the feed
            </Button>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
            {[
              { label: "Articles", value: articlesQuery.data?.pagination.total ?? "—" },
              { label: "Feed posts", value: postsTotal ?? "—" },
              { label: "You", value: user?.name ? initials(user.name) : "In" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5"
              >
                <div className="text-2xl font-semibold tabular-nums md:text-3xl">{s.value}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        {articlesQuery.isError ? (
          <Alert variant="destructive" className="mb-8">
            <AlertTitle>Community API unavailable</AlertTitle>
            <AlertDescription>
              {(articlesQuery.error as Error)?.message ||
                "Could not load articles. Confirm the gateway exposes /api/v1/community/articles."}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Explore topics</h2>
            <p className="text-sm text-muted-foreground">
              Filter published articles by track—same category rhythm as EqraaTech’s guides.
            </p>
          </div>
          <Button
            className="w-fit rounded-full"
            onClick={() => setCreateOpen(true)}
            variant="default"
          >
            <PenLine className="mr-2 h-4 w-4" />
            New article
          </Button>
        </div>

        <ScrollArea className="pb-4">
          <div className="flex w-max gap-2 pb-1">
            <Button
              type="button"
              size="sm"
              variant={category === "all" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => {
                setCategory("all");
                setArticlePage(1);
              }}
            >
              All
            </Button>
            {CATEGORIES.map((c) => (
              <Button
                key={c}
                type="button"
                size="sm"
                variant={category === c ? "default" : "outline"}
                className="rounded-full capitalize"
                onClick={() => {
                  setCategory(c);
                  setArticlePage(1);
                }}
              >
                {c}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <Tabs
          id="community-articles"
          value={tab}
          onValueChange={(v) => setTab(v as "articles" | "feed")}
          className="mt-8"
        >
          <TabsList className="h-auto w-full justify-start gap-1 rounded-2xl border border-border/60 bg-muted/40 p-1.5 md:w-auto">
            <TabsTrigger
              value="articles"
              className="rounded-xl px-5 py-2.5 data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Articles
            </TabsTrigger>
            <TabsTrigger
              value="feed"
              className="rounded-xl px-5 py-2.5 data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Community feed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-8 space-y-8">
            {articlesQuery.isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {(articlesQuery.data?.data ?? []).map((article) => {
                  const mins = readMinutes(article);
                  const cardImage = pickArticleCardImage(article);
                  return (
                    <button
                      key={article._id}
                      type="button"
                      className="text-left"
                      onClick={() =>
                        router.push(`/${area}/${userId}/community/articles/${encodeURIComponent(article.slug)}`)
                      }
                    >
                      <Card className="h-full overflow-hidden rounded-2xl border-border/70 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="relative aspect-16/10 w-full bg-muted">
                          <ArticlePreviewImage src={cardImage} alt={article.title} />
                          <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                            {article.category?.slice(0, 2).map((cat) => (
                              <Badge
                                key={cat}
                                variant="secondary"
                                className="rounded-full bg-background/85 capitalize backdrop-blur"
                              >
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <CardHeader className="space-y-2 pb-2">
                          {article.publishedStatus ? (
                            <div className="px-6 pt-4">
                              <Badge
                                variant={article.publishedStatus === "published" ? "default" : "outline"}
                                className="rounded-full capitalize"
                              >
                                {article.publishedStatus}
                              </Badge>
                            </div>
                          ) : null}
                          <CardTitle className="line-clamp-2 text-lg leading-snug">
                            {article.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {article.description}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={authorPic(article.author)} />
                              <AvatarFallback>{initials(authorName(article.author))}</AvatarFallback>
                            </Avatar>
                            {authorName(article.author)}
                          </span>
                          <span>
                            {article.createdAt
                              ? formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })
                              : ""}
                            {mins ? ` · ${mins} min` : ""}
                          </span>
                        </CardFooter>
                      </Card>
                    </button>
                  );
                })}
              </div>
            )}
            {!articlesQuery.isLoading && (articlesQuery.data?.data?.length ?? 0) === 0 ? (
              <Alert>
                <AlertTitle>No articles yet</AlertTitle>
                <AlertDescription>
                  Nothing matched this filter. Try another category or click New article.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex items-center justify-center gap-4 pb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={!articlesQuery.data?.pagination.hasPrev}
                onClick={() => setArticlePage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {articlesQuery.data?.pagination.page ?? articlePage} of{" "}
                {Math.max(1, articlesQuery.data?.pagination.totalPages ?? 1)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={!articlesQuery.data?.pagination.hasNext}
                onClick={() => setArticlePage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="feed" className="mt-8 space-y-6">
            <div id="community-feed" className="space-y-4">
              <Card className="rounded-2xl border-border/70 shadow-sm">
                <CardContent className="space-y-4 p-4 md:p-5">
                  <div className="flex w-full max-w-[1000px] flex-wrap items-center gap-3 sm:flex-nowrap">
                    <Avatar className="h-11 w-11">
                      <AvatarImage />
                      <AvatarFallback>{initials(user?.name || "You")}</AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full min-w-0 justify-start rounded-full px-5 text-base text-muted-foreground sm:flex-1"
                      onClick={() => setPostComposerOpen(true)}
                    >
                      Start a post
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="justify-center rounded-lg border bg-muted/20 py-5 text-base"
                      onClick={() => {
                        toast({
                          title: "Video posting",
                          description: "Video endpoint is not available yet. You can post text and photo now.",
                        });
                      }}
                    >
                      <Video className="mr-2 h-5 w-5 text-emerald-500" />
                      Video
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="justify-center rounded-lg border bg-muted/20 py-5 text-base"
                      onClick={() => {
                        postPhotoInputRef.current?.click();
                        setPostComposerOpen(true);
                      }}
                    >
                      <ImagePlus className="mr-2 h-5 w-5 text-blue-500" />
                      Photo
                    </Button>
                  </div>
                  <input
                    ref={postPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-label="Select post photo"
                    title="Select post photo"
                    onChange={(e) => setPostFile(e.target.files?.[0] ?? null)}
                  />
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-full border bg-muted/20 p-1">
                  <Button
                    size="sm"
                    variant={postScope === "all" ? "default" : "ghost"}
                    className="rounded-full px-4"
                    onClick={() => setPostScope("all")}
                  >
                    All posts
                  </Button>
                  <Button
                    size="sm"
                    variant={postScope === "mine" ? "default" : "ghost"}
                    className="rounded-full px-4"
                    onClick={() => setPostScope("mine")}
                  >
                    My posts
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {postScope === "mine" ? "Showing your posts" : "Showing all community posts"}
                </span>
              </div>

              <div className="space-y-4">
                {postsInfinite.isError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Could not load the feed</AlertTitle>
                    <AlertDescription>
                      {(postsInfinite.error as Error)?.message ||
                        "Check the network tab or confirm GET /api/v1/community/posts is available."}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {postsInfinite.isPending ? (
                  <Skeleton className="h-40 w-full rounded-2xl" />
                ) : feedPosts.length === 0 ? (
                  <Card className="rounded-2xl border-dashed">
                    <CardContent className="p-8 text-center">
                      <p className="text-lg font-semibold">No posts yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Be the first to publish an update to this community.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  feedPosts.map((post) => {
                    console.log("POST DATA:", post);
                    const originalPost = resolveOriginalPost(post);
                    if (originalPost) {
                      return (
                        <RepostWrapper
                          key={post._id}
                          repost={post}
                          originalPost={originalPost}
                          userId={user?._id}
                          isAdmin={isAdmin}
                          expanded={expandedPostId === originalPost._id}
                          onToggleComments={() =>
                            setExpandedPostId((id) => (id === originalPost._id ? null : originalPost._id))
                          }
                          comments={commentsQuery.data?.comments ?? []}
                          commentsLoading={Boolean(
                            expandedPostId === originalPost._id && commentsQuery.isFetching,
                          )}
                          commentText={commentDrafts[originalPost._id] ?? ""}
                          commentImage={commentFiles[originalPost._id] ?? null}
                          onCommentChange={(t) =>
                            setCommentDrafts((d) => ({
                              ...d,
                              [originalPost._id]: t,
                            }))
                          }
                          onCommentImageChange={(f) =>
                            setCommentFiles((files) => ({
                              ...files,
                              [originalPost._id]: f,
                            }))
                          }
                          onSubmitComment={() => {
                            const t = (commentDrafts[originalPost._id] ?? "").trim();
                            const image = commentFiles[originalPost._id] ?? undefined;
                            if (!t) return;
                            createCommentMut.mutate({ postId: originalPost._id, text: t, image });
                          }}
                          onDeletePost={() => deletePostMut.mutate(post._id)}
                          onLike={() => likePostMut.mutate(originalPost._id)}
                          onShare={() => sharePostMut.mutate(originalPost._id)}
                          onDeleteComment={(id) => deleteCommentMut.mutate(id)}
                          onLikeComment={(id) => likeCommentMut.mutate(id)}
                          repostUsers={repostUsersByPostId.get(originalPost._id) ?? []}
                        />
                      );
                    }

                    return (
                      <PostCard
                        key={post._id}
                        post={post}
                        userId={user?._id}
                        isAdmin={isAdmin}
                        expanded={expandedPostId === post._id}
                        onToggleComments={() =>
                          setExpandedPostId((id) => (id === post._id ? null : post._id))
                        }
                        comments={commentsQuery.data?.comments ?? []}
                        commentsLoading={Boolean(expandedPostId === post._id && commentsQuery.isFetching)}
                        commentText={commentDrafts[post._id] ?? ""}
                        commentImage={commentFiles[post._id] ?? null}
                        onCommentChange={(t) =>
                          setCommentDrafts((d) => ({
                            ...d,
                            [post._id]: t,
                          }))
                        }
                        onCommentImageChange={(f) =>
                          setCommentFiles((files) => ({
                            ...files,
                            [post._id]: f,
                          }))
                        }
                        onSubmitComment={() => {
                          const t = (commentDrafts[post._id] ?? "").trim();
                          const image = commentFiles[post._id] ?? undefined;
                          if (!t) return;
                          createCommentMut.mutate({ postId: post._id, text: t, image });
                        }}
                        onDeletePost={() => deletePostMut.mutate(post._id)}
                        onLike={() => likePostMut.mutate(post._id)}
                        onShare={() => sharePostMut.mutate(post._id)}
                        onDeleteComment={(id) => deleteCommentMut.mutate(id)}
                        onLikeComment={(id) => likeCommentMut.mutate(id)}
                        repostUsers={repostUsersByPostId.get(post._id) ?? []}
                      />
                    );
                  })
                )}
                <FeedEndSentinel
                  hasNext={Boolean(postsInfinite.hasNextPage)}
                  isFetchingNext={postsInfinite.isFetchingNextPage}
                  onLoadMore={loadMorePosts}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={postComposerOpen} onOpenChange={setPostComposerOpen}>
        <DialogContent className="flex h-[82vh] max-w-4xl flex-col overflow-hidden rounded-2xl p-0">
          <div className="shrink-0 border-b px-6 py-4 pr-14">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage />
                <AvatarFallback>{initials(user?.name || "You")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{user?.name || "You"}</p>
                <p className="text-sm text-muted-foreground">Post to anyone</p>
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <Textarea
              placeholder="What do you want to talk about?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[50vh] resize-none border-0 p-0 text-3xl leading-tight shadow-none focus-visible:ring-0"
            />
            {postFile ? (
              <div className="mt-4 rounded-xl border bg-muted/20 p-3 text-sm">
                Attached photo: <span className="font-medium">{postFile.name}</span>
              </div>
            ) : null}
          </div>
          <div className="shrink-0 border-t px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => {
                    toast({
                      title: "Video posting",
                      description: "Video endpoint is not available yet. You can post text and photo now.",
                    });
                  }}
                >
                  <Video className="mr-2 h-4 w-4 text-emerald-500" />
                  Video
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => postPhotoInputRef.current?.click()}
                >
                  <ImagePlus className="mr-2 h-4 w-4 text-blue-500" />
                  Photo
                </Button>
              </div>
              <Button
                type="button"
                className="rounded-full px-6"
                disabled={!postContent.trim() || createPostMut.isPending}
                onClick={() => createPostMut.mutate()}
              >
                {createPostMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="flex max-h-[min(90vh,44rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0">
          <div className="shrink-0 px-6 pt-6 pr-14">
            <DialogHeader>
              <DialogTitle>New article</DialogTitle>
            </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ca-title">Title</Label>
                <Input
                  id="ca-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ca-desc">Summary</Label>
                <Textarea
                  id="ca-desc"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="max-h-32 min-h-[80px] resize-y overflow-y-auto rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ca-body">Body</Label>
                <Textarea
                  id="ca-body"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="min-h-[140px] max-h-[min(40vh,18rem)] resize-y overflow-y-auto rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const on = newCats.includes(c);
                    return (
                      <Button
                        key={c}
                        type="button"
                        size="sm"
                        variant={on ? "default" : "outline"}
                        className="rounded-full capitalize"
                        onClick={() =>
                          setNewCats((prev) =>
                            on ? prev.filter((x) => x !== c) : [...prev, c],
                          )
                        }
                      >
                        {c}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ca-cover">Cover image (optional)</Label>
                <Input
                  id="ca-cover"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t bg-background px-6 py-4">
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={
                  !newTitle.trim() ||
                  !newDescription.trim() ||
                  newCats.length === 0 ||
                  createArticleMut.isPending
                }
                onClick={() => createArticleMut.mutate()}
              >
                {createArticleMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

type PostCardProps = {
  post: CommunityPost;
  userId?: string;
  isAdmin: boolean;
  expanded: boolean;
  onToggleComments: () => void;
  comments: CommunityComment[];
  commentsLoading: boolean;
  commentText: string;
  commentImage: File | null;
  onCommentChange: (t: string) => void;
  onCommentImageChange: (f: File | null) => void;
  onSubmitComment: () => void;
  onDeletePost: () => void;
  onLike: () => void;
  onShare: () => void;
  onDeleteComment: (id: string) => void;
  onLikeComment: (id: string) => void;
  repostUsers: CommunityAuthor[];
};

type RepostWrapperProps = Omit<PostCardProps, "post"> & {
  repost: CommunityPost;
  originalPost: CommunityPost;
};

function RepostWrapper({
  repost,
  originalPost,
  userId,
  isAdmin,
  expanded,
  onToggleComments,
  comments,
  commentsLoading,
  commentText,
  commentImage,
  onCommentChange,
  onCommentImageChange,
  onSubmitComment,
  onDeletePost,
  onLike,
  onShare,
  onDeleteComment,
  onLikeComment,
  repostUsers,
}: RepostWrapperProps) {
  return (
    <Card id={`post-${repost._id}`} className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        This post is not eligible to be boosted.
      </div>
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={authorPic(repost.author)} />
            <AvatarFallback>{initials(authorName(repost.author))}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{authorName(repost.author)}</span>
          <span className="text-sm text-muted-foreground">reposted this</span>
        </div>
      </div>
      <div className="p-3">
        <PostCard
          post={originalPost}
          userId={userId}
          isAdmin={isAdmin}
          expanded={expanded}
          onToggleComments={onToggleComments}
          comments={comments}
          commentsLoading={commentsLoading}
          commentText={commentText}
          commentImage={commentImage}
          onCommentChange={onCommentChange}
          onCommentImageChange={onCommentImageChange}
          onSubmitComment={onSubmitComment}
          onDeletePost={onDeletePost}
          onLike={onLike}
          onShare={onShare}
          onDeleteComment={onDeleteComment}
          onLikeComment={onLikeComment}
          repostUsers={repostUsers}
        />
      </div>
    </Card>
  );
}

function PostCard({
  post,
  userId,
  isAdmin,
  expanded,
  onToggleComments,
  comments,
  commentsLoading,
  commentText,
  commentImage,
  onCommentChange,
  onCommentImageChange,
  onSubmitComment,
  onDeletePost,
  onLike,
  onShare,
  onDeleteComment,
  onLikeComment,
  repostUsers,
}: PostCardProps) {
  const commentImageInputRef = useRef<HTMLInputElement>(null);
  const [commentImageErrors, setCommentImageErrors] = useState<Record<string, boolean>>({});
  const [repostsOpen, setRepostsOpen] = useState(false);
  const [repostUsersList, setRepostUsersList] = useState<CommunityAuthor[]>(repostUsers);
  const [repostsLoading, setRepostsLoading] = useState(false);
  const authorId =
    typeof post.author === "object" && post.author ? post.author._id : undefined;
  const canDeletePost = Boolean(userId && authorId && userId === authorId) || isAdmin;

  const liked =
    Boolean(userId && post.likes?.some((id) => id.toString() === userId.toString())) ||
    false;
  const postImage = pickPostImage(post);
  const contentIsArabic = isMostlyArabic(post.content);

  useEffect(() => {
    setRepostUsersList(repostUsers);
  }, [repostUsers]);

  const openReposts = async () => {
    setRepostsOpen(true);
    if ((post.sharesCount ?? 0) <= 0) return;
    if (repostUsersList.length > 0) return;
    setRepostsLoading(true);
    try {
      const users = await fetchAllRepostUsersForPost(post._id);
      setRepostUsersList(users);
    } finally {
      setRepostsLoading(false);
    }
  };

  return (
    <Card id={`post-${post._id}`} className="rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={authorPic(post.author)} />
          <AvatarFallback>{initials(authorName(post.author))}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{authorName(post.author)}</span>
            {typeof post.author === "object" && post.author?.role ? (
              <Badge variant="outline" className="rounded-full text-[10px] uppercase">
                {post.author.role}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {post.createdAt
              ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
              : ""}
          </p>
        </div>
        {canDeletePost ? (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onDeletePost}>
            Remove
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 pb-2">
        {post.content?.trim() ? (
          <p
            dir={contentIsArabic ? "rtl" : "ltr"}
            className={cn(
              "whitespace-pre-wrap text-sm leading-relaxed",
              contentIsArabic ? "text-right" : "text-left",
            )}
          >
            {post.content}
          </p>
        ) : null}
        {postImage ? (
          <img
            src={encodeURI(postImage)}
            alt=""
            className="max-h-80 w-full rounded-xl border object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
      </CardContent>
      <CardFooter className="block border-t px-4 pb-2 pt-2">
        <div className="mb-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>{post.likesCount ?? 0} likes</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="underline-offset-2 hover:underline"
              onClick={onToggleComments}
            >
              {post.commentsCount ?? 0} comments
            </button>
            <span>·</span>
            <button
              type="button"
              className="underline-offset-2 hover:underline"
              onClick={() => void openReposts()}
            >
              {post.sharesCount ?? 0} reposts
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 border-t pt-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 rounded-md text-muted-foreground hover:bg-muted/60",
              liked && "text-rose-500",
            )}
            onClick={onLike}
          >
            <Heart className={cn("mr-1.5 h-4 w-4", liked && "fill-current")} />
            Like
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 rounded-md text-muted-foreground hover:bg-muted/60"
            onClick={onToggleComments}
          >
            <MessageCircle className="mr-1.5 h-4 w-4" />
            Comment
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 rounded-md text-muted-foreground hover:bg-muted/60"
            onClick={onShare}
          >
            <Share2 className="mr-1.5 h-4 w-4" />
            Repost
          </Button>
        </div>
      </CardFooter>
      {expanded ? (
        <div className="border-t px-4 pb-4 pt-3">
          <div className="mb-3 flex items-start gap-2">
            <Avatar className="mt-0.5 h-8 w-8">
              <AvatarImage src={typeof post.author === "object" ? authorPic(post.author) : undefined} />
              <AvatarFallback>{initials(authorName(post.author))}</AvatarFallback>
            </Avatar>
            <div className="w-full rounded-full border bg-background px-2.5 py-1.5">
              <div className="flex items-center gap-2">
                <input
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => onCommentChange(e.target.value)}
                  className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-muted-foreground"
                  onClick={() => commentImageInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
                <input
                  ref={commentImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label="Attach comment photo"
                  title="Attach comment photo"
                  onChange={(e) => onCommentImageChange(e.target.files?.[0] ?? null)}
                />
                <Button type="button" size="sm" className="h-7 rounded-full px-3 text-xs" onClick={onSubmitComment}>
                  Reply
                </Button>
              </div>
            </div>
          </div>
          {commentsLoading ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : (
            <div className="space-y-3">
              {comments.map((c) => {
                const cid =
                  typeof c.author === "object" && c.author ? c.author._id : undefined;
                const canDel = Boolean(userId && cid && userId === cid) || isAdmin;
                return (
                  <div
                    key={c._id}
                    className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{authorName(c.author)}</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => onLikeComment(c._id)}
                        >
                          <Heart className="h-3.5 w-3.5" />
                        </Button>
                        {canDel ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive"
                            onClick={() => onDeleteComment(c._id)}
                          >
                            ×
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <p
                      dir={isMostlyArabic(c.text) ? "rtl" : "ltr"}
                      className={cn(
                        "mt-1 text-muted-foreground",
                        isMostlyArabic(c.text) ? "text-right" : "text-left",
                      )}
                    >
                      {c.text}
                    </p>
                    {c.image ? (
                      <div className="mt-2 rounded-lg border border-border/70 bg-background/60 p-2">
                        {commentImageErrors[c._id] ? (
                          <div className="rounded-md border border-dashed border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                            Could not load image preview.
                            <a
                              href={c.image}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-1 underline underline-offset-2"
                            >
                              Open image
                            </a>
                          </div>
                        ) : (
                          <img
                            src={encodeURI(c.image)}
                            alt="Comment attachment"
                            className="max-h-72 w-full rounded-md object-contain"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setCommentImageErrors((prev) => ({
                                ...prev,
                                [c._id]: true,
                              }))
                            }
                          />
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          {commentImage ? (
            <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Attached image: <span className="font-medium">{commentImage.name}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      <Dialog open={repostsOpen} onOpenChange={setRepostsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>People who reposted</DialogTitle>
          </DialogHeader>
          {repostsLoading ? (
            <p className="text-sm text-muted-foreground">Loading repost records...</p>
          ) : repostUsersList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No repost records found in available API pages.
            </p>
          ) : (
            <div className="space-y-2">
              {repostUsersList.map((u, i) => (
                <div
                  key={`${u._id ?? u.email ?? u.name ?? "user"}-${i}`}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar || u.profilePicture} />
                    <AvatarFallback>{initials(u.name || u.email || "Member")}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium">{u.name || u.email || "Member"}</div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
