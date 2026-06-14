"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";
import { shouldBypassNextImageOptimization } from "@/lib/lms/course-thumbnail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCommunityArticle,
  useUpdateArticle,
  useDeleteArticle,
} from "@/hooks/app/community/use-social";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import { ArticleMarkdown } from "@/components/community/articles/article-markdown";
import { CommunityMediaLightbox } from "@/components/community/social/community-media-lightbox";
import type {
  ArticleContentBlock,
  ArticleCategory,
  CommunityArticle,
} from "@/services/app/community/articles.api";
import type { CommunityProfileSummary } from "@/types/api/app/community/social.types";

function authorOf(a: CommunityArticle): CommunityProfileSummary | null {
  if (a.author && typeof a.author === "object") {
    return a.author as CommunityProfileSummary;
  }
  return null;
}

export default function CommunityArticleDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const auth = useAuthContextOptional();
  const { data, isLoading, isError, refetch } = useCommunityArticle(id);
  const delArticle = useDeleteArticle();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const updateArticle = useUpdateArticle(id);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBody, setEditBody] = useState("");

  const [lightbox, setLightbox] = useState<{
    urls: string[];
    index: number;
  } | null>(null);

  const sortedBlocks = useMemo((): ArticleContentBlock[] => {
    if (!data?.contentBlocks?.length) return [];
    return [...data.contentBlocks].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
  }, [data]);

  const galleryUrls = useMemo(() => {
    const u: string[] = [];
    if (data?.coverImage) u.push(data.coverImage);
    for (const b of sortedBlocks) {
      if (b.type === "image" && b.url) u.push(b.url);
    }
    return Array.from(new Set(u.filter(Boolean)));
  }, [data?.coverImage, sortedBlocks]);

  const openImage = useCallback(
    (url: string) => {
      const i = galleryUrls.indexOf(url);
      if (i < 0) return;
      setLightbox({ urls: galleryUrls, index: i });
    },
    [galleryUrls],
  );

  const refreshArticleGalleryUrl = useCallback(
    async (index: number) => {
      const r = await refetch();
      const art = r.data;
      if (!art) return null;
      const blocks = [...(art.contentBlocks ?? [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );
      const u: string[] = [];
      if (art.coverImage) u.push(art.coverImage);
      for (const b of blocks) {
        if (b.type === "image" && b.url) u.push(b.url);
      }
      const urls = Array.from(new Set(u.filter(Boolean)));
      return urls[index] ?? null;
    },
    [refetch],
  );

  const buildUpdatedBlocks = useCallback((): ArticleContentBlock[] => {
    const blocks = sortedBlocks.map((b, i) => ({ ...b, order: b.order ?? i }));
    const ti = blocks.findIndex(
      (b) => b.type === "text" || b.type === "paragraph",
    );
    if (ti >= 0) {
      blocks[ti] = { ...blocks[ti], content: editBody.trim() };
      return blocks;
    }
    const maxOrder = blocks.reduce((m, b) => Math.max(m, b.order ?? 0), 0);
    return [
      ...blocks,
      { type: "text", order: maxOrder + 1, content: editBody.trim() },
    ];
  }, [sortedBlocks, editBody]);

  useEffect(() => {
    if (!data || !editOpen) return;
    setEditTitle(data.title);
    setEditDescription(data.description);
    const blocks = [...(data.contentBlocks ?? [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    const firstText = blocks.find(
      (b) => b.type === "text" || b.type === "paragraph",
    );
    setEditBody(firstText?.content ?? "");
  }, [data, editOpen]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <Card className="mx-auto max-w-3xl p-10 text-center text-sm text-muted-foreground">
        Article not found.
        <div className="mt-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/community/articles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to articles
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  const article = data;
  const author = authorOf(article);
  const me = auth?.user?._id;
  const isOwner =
    !!me &&
    !!author?._id &&
    String(author._id) === String(me) &&
    auth.isAuthenticated;

  return (
    <article className="mx-auto max-w-3xl space-y-6 md:max-w-4xl md:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild size="sm" variant="ghost" className="-ml-2 gap-2">
          <Link href="/community/articles">
            <ArrowLeft className="h-4 w-4" />
            Articles
          </Link>
        </Button>
        {isOwner ? (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2 text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          {article.title}
        </h1>
        {article.description?.trim() ? (
          <div className="rounded-2xl border border-violet-500/15 bg-linear-to-br from-violet-500/10 via-transparent to-fuchsia-500/10 p-5 md:p-6">
            <ArticleMarkdown
              markdown={article.description}
              className="prose-base md:prose-lg"
            />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={author?.profilePictureUrl} alt={author?.name} />
            <AvatarFallback>
              {(author?.name ?? "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{author?.name ?? "Unknown"}</span>
          <span className="text-xs text-muted-foreground">
            ·{" "}
            {article.createdAt
              ? formatDistanceToNow(new Date(article.createdAt), {
                  addSuffix: true,
                })
              : ""}
          </span>
          {article.category?.length ? (
            <div className="ml-1 flex flex-wrap gap-1">
              {article.category.map((c) => (
                <Badge key={c} variant="secondary" className="text-[10px]">
                  #{c}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      {article.coverImage ? (
        <button
          type="button"
          aria-label="Open cover image in gallery"
          className="relative block w-full overflow-hidden rounded-2xl border bg-muted text-left ring-offset-2 transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          onClick={() => openImage(article.coverImage!)}
        >
          <Image
            src={article.coverImage}
            alt={article.title}
            width={1200}
            height={675}
            className="h-full w-full object-cover"
            unoptimized={shouldBypassNextImageOptimization(article.coverImage)}
          />
        </button>
      ) : null}

      <CardContent className="space-y-8 px-0 md:space-y-10">
        {sortedBlocks.map((block, i) => (
          <ArticleBlock key={i} block={block} onOpenImage={openImage} />
        ))}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          showCloseButton
          className={cn(
            "fixed left-1/2 top-6 z-50 flex max-h-[min(88vh,880px)] w-[min(100%-1.25rem,720px)] max-w-[720px] -translate-x-1/2 translate-y-0 flex-col gap-0 overflow-hidden rounded-xl border-0 p-0 shadow-2xl sm:max-w-[720px]",
          )}
        >
          <DialogHeader className="shrink-0 space-y-1 border-b bg-card px-6 py-4 pr-14 text-left">
            <DialogTitle>Edit article</DialogTitle>
            <p className="text-sm font-normal text-muted-foreground">
              Title and description are plain text. Main text supports{" "}
              <span className="font-medium text-foreground">Markdown</span>{" "}
              (headings, lists, fenced code blocks).
            </p>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-background px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="art-title">Title</Label>
                <Input
                  id="art-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-11 text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="art-desc">Description</Label>
                <Textarea
                  id="art-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  placeholder="Short summary (shown on cards and SEO)"
                  className="min-h-[100px] max-h-[28vh] resize-y overflow-y-auto text-sm leading-relaxed field-sizing-fixed"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="art-body">Main text (Markdown)</Label>
                <Textarea
                  id="art-body"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={12}
                  spellCheck={false}
                  placeholder="Write in Markdown…"
                  className="min-h-[200px] max-h-[min(42vh,360px)] resize-y overflow-y-auto font-mono text-[13px] leading-relaxed field-sizing-fixed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Updates the first text or paragraph block. Images, code, and
                  other blocks stay as they are until you edit the article in a
                  full editor.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t bg-muted/30 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                updateArticle.isPending ||
                editTitle.trim().length < 4 ||
                editDescription.trim().length < 10
              }
              onClick={() => {
                const cats = (article.category ?? []) as ArticleCategory[];
                updateArticle.mutate(
                  {
                    title: editTitle.trim(),
                    description: editDescription.trim(),
                    contentBlocks: buildUpdatedBlocks(),
                    category: cats.length ? cats : ["webdev"],
                  },
                  {
                    onSuccess: () => setEditOpen(false),
                  },
                );
              }}
            >
              {updateArticle.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this article?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the article for all readers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={delArticle.isPending}
              onClick={() =>
                delArticle.mutate(id, {
                  onSuccess: () => router.push("/community/articles"),
                })
              }
            >
              {delArticle.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CommunityMediaLightbox
        open={lightbox !== null}
        onOpenChange={(o) => {
          if (!o) setLightbox(null);
        }}
        urls={lightbox?.urls ?? []}
        initialIndex={lightbox?.index ?? 0}
        onRefreshAtIndex={refreshArticleGalleryUrl}
      />
    </article>
  );
}

function ArticleCodeBlock({
  code,
  language,
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const lang = (language || "text").toLowerCase();
  const lines = code.split("\n").length;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-border bg-muted/30 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
        <span className="font-mono">{lang}</span>
        <span className="flex flex-wrap items-center gap-2">
          {filename ? (
            <span className="rounded bg-background/60 px-2 py-0.5 font-sans">
              {filename}
            </span>
          ) : null}
          {lines > 1 ? <span>{lines} lines</span> : null}
        </span>
      </div>
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={lang}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          padding: "1rem 1.1rem",
          fontSize: "0.875rem",
          lineHeight: 1.55,
          background: "transparent",
        }}
        showLineNumbers={lines > 4}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function ArticleBlock({
  block,
  onOpenImage,
}: {
  block: ArticleContentBlock;
  onOpenImage?: (url: string) => void;
}) {
  const type = String(block.type).toLowerCase() as ArticleContentBlock["type"];

  switch (type) {
    case "text":
    case "paragraph":
      return (
        <ArticleMarkdown
          markdown={block.content ?? ""}
          className="text-foreground"
        />
      );
    case "heading":
      return block.content?.trim() ? (
        <ArticleMarkdown
          markdown={`## ${block.content.trim().replace(/^#+\s*/, "")}`}
          className="text-foreground"
        />
      ) : null;
    case "quote":
      return (
        <blockquote className="rounded-r-xl border-l-4 border-violet-500 bg-muted/40 px-4 py-3 italic">
          “{block.content}”
          {block.quoteAuthor && (
            <footer className="mt-1 text-xs not-italic text-muted-foreground">
              — {block.quoteAuthor}
              {block.quoteSource ? `, ${block.quoteSource}` : null}
            </footer>
          )}
        </blockquote>
      );
    case "code":
      return (
        <ArticleCodeBlock
          code={block.code ?? ""}
          language={block.language}
          filename={block.filename}
        />
      );
    case "link":
      return block.url ? (
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-violet-600 hover:underline"
        >
          {block.caption || block.url}
        </a>
      ) : null;
    case "image":
      return block.url ? (
        <button
          type="button"
          aria-label={
            block.caption
              ? `Open image: ${block.caption}`
              : "Open image in gallery"
          }
          className="relative block w-full overflow-hidden rounded-xl border ring-offset-2 transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          onClick={() => onOpenImage?.(block.url!)}
        >
          <Image
            src={block.url}
            alt={block.alt || block.caption || ""}
            width={1200}
            height={675}
            className="h-auto w-full object-contain"
            unoptimized={shouldBypassNextImageOptimization(block.url)}
          />
        </button>
      ) : null;
    default:
      return null;
  }
}
