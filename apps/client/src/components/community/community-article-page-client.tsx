"use client";

import { useAuthContext } from "@/context/app/auth/auth-context";
import { deleteArticle, fetchArticleBySlug, updateArticle } from "@/services/app/community/community.api";
import type { ArticleContentBlock, CommunityArticle } from "@/types/api/app/community/community.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, BookOpen, Clock3, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function getArticleImage(article?: CommunityArticle): string | undefined {
  if (!article) return undefined;
  if (article.coverImage) return article.coverImage.trim();
  if (article.images?.[0]) return article.images[0].trim();
  const fromBlock = article.contentBlocks?.find((b) => b.type === "image" && b.url);
  return fromBlock?.url?.trim();
}

function getArticleGalleryImages(article?: CommunityArticle): string[] {
  if (!article) return [];
  const blockImages = (article.contentBlocks ?? [])
    .filter((b) => b.type === "image" && typeof b.url === "string")
    .map((b) => String(b.url).trim());
  const all = [article.coverImage ?? "", ...(article.images ?? []), ...blockImages]
    .map((v) => v.trim())
    .filter(Boolean);
  return Array.from(new Set(all));
}

function readMinutes(article?: CommunityArticle): number {
  if (!article?.wordCount) return 1;
  return Math.max(1, Math.ceil(article.wordCount / 200));
}

function renderBlock(block: ArticleContentBlock, index: number) {
  if (block.type === "heading") {
    return (
      <h2 key={index} className="mt-8 text-2xl font-semibold tracking-tight">
        {block.content}
      </h2>
    );
  }

  if (block.type === "paragraph") {
    const paragraphs = (block.content ?? "").split("\n").filter(Boolean);
    return (
      <div key={index} className="mt-5 space-y-4">
        {paragraphs.map((line, i) => (
          <p key={`${index}-${i}`} className="text-base leading-8 text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote
        key={index}
        className="mt-6 rounded-xl border-l-4 border-primary/40 bg-muted/30 p-4 italic text-muted-foreground"
      >
        {block.content}
      </blockquote>
    );
  }

  if (block.type === "code") {
    return (
      <pre key={index} className="mt-6 overflow-x-auto rounded-xl border bg-muted/40 p-4 text-sm">
        <code>{block.code}</code>
      </pre>
    );
  }

  if (block.type === "image" && block.url) {
    return (
      <figure key={index} className="mt-6 space-y-2">
        <img
          src={encodeURI(block.url)}
          alt={block.alt || ""}
          className="w-full rounded-xl border object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        {block.caption ? <figcaption className="text-center text-sm text-muted-foreground">{block.caption}</figcaption> : null}
      </figure>
    );
  }

  return null;
}

function blockToMarkdown(block: ArticleContentBlock): string {
  if (block.type === "heading") {
    return `## ${block.content ?? ""}`.trim();
  }
  if (block.type === "quote") {
    return `> ${block.content ?? ""}`.trim();
  }
  if (block.type === "code") {
    return `\`\`\`\n${block.code ?? ""}\n\`\`\``;
  }
  if (block.type === "image" && block.url) {
    const alt = block.alt ?? "";
    const base = `![${alt}](${encodeURI(block.url)})`;
    return block.caption ? `${base}\n*${block.caption}*` : base;
  }
  return String(block.content ?? "").trim();
}

function buildArticleMarkdown(article: CommunityArticle): string {
  const blocks = article.contentBlocks ?? [];
  const merged = blocks.map(blockToMarkdown).filter(Boolean).join("\n\n").trim();
  if (merged) {
    return merged
      .replace(/^```(?:markdown|md)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }
  return "";
}

type Props = {
  area: "student" | "instructor";
  userId: string;
  slug: string;
};

export default function CommunityArticlePageClient({ area, userId, slug }: Props) {
  const { user, role } = useAuthContext();
  const router = useRouter();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["community", "article", "slug", slug],
    queryFn: () => fetchArticleBySlug(slug),
    enabled: Boolean(slug),
  });

  const article = query.data;
  const heroImage = getArticleImage(article);
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBody, setEditBody] = useState("");
  const [galleryImageErrors, setGalleryImageErrors] = useState<Record<string, boolean>>({});
  const backHref = `/${area}/${userId}/community`;
  const authorName =
    article && typeof article.author === "object"
      ? article.author?.name || article.author?.email || "Community member"
      : "Community member";
  const markdownBody = article ? buildArticleMarkdown(article) : "";

  const updateArticleMut = useMutation({
    mutationFn: () => {
      if (!article?._id) {
        throw new Error("Article is not loaded");
      }
      return updateArticle({
        id: article._id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: article.category,
        contentBlocks: [{ type: "paragraph", order: 0, content: editBody.trim() || " " }],
      });
    },
    onSuccess: () => {
      setEditOpen(false);
      void qc.invalidateQueries({ queryKey: ["community", "article", "slug", slug] });
      void qc.invalidateQueries({ queryKey: ["community", "articles"] });
    },
  });
  const deleteArticleMut = useMutation({
    mutationFn: () => {
      if (!article?._id) {
        throw new Error("Article is not loaded");
      }
      return deleteArticle(article._id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["community", "articles"] });
      router.push(`/${area}/${userId}/community/articles`);
    },
  });

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-10 w-3/4 rounded-lg" />
        <Skeleton className="h-6 w-1/2 rounded-lg" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError || !article) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-6">
            <p className="text-lg font-semibold">Could not load this article</p>
            <p className="text-sm text-muted-foreground">
              {(query.error as Error)?.message || "Please go back and try again."}
            </p>
            <Button asChild variant="outline">
              <Link href={backHref}>Back to community</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = getArticleGalleryImages(article);
  const articleAuthorId =
    typeof article.author === "string"
      ? article.author
      : article.author && typeof article.author === "object"
        ? article.author._id
        : undefined;
  const isAdmin = typeof role === "string" && role.toUpperCase().includes("ADMIN");
  const canManageArticle = isAdmin || Boolean(user?._id && articleAuthorId && user?._id === articleAuthorId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button asChild variant="ghost" className="mb-6 rounded-full">
        <Link href={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Community
        </Link>
      </Button>

      <article className="overflow-hidden rounded-3xl border bg-card/70 shadow-lg">
        <div className="relative h-60 w-full bg-muted md:h-80">
          {heroImage && !heroImageFailed ? (
            <img
              src={encodeURI(heroImage)}
              alt={article.title}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setHeroImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 to-muted">
              <BookOpen className="h-12 w-12 text-primary/60" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {article.category?.map((cat) => (
              <Badge key={cat} variant="secondary" className="rounded-full capitalize">
                {cat}
              </Badge>
            ))}
            <Badge variant="outline" className="rounded-full capitalize bg-background/80">
              {article.publishedStatus}
            </Badge>
          </div>
        </div>

        <div className="space-y-6 p-6 md:p-8">
          <header className="space-y-3">
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{article.title}</h1>
            <p className="text-lg text-muted-foreground">{article.description}</p>
            {canManageArticle ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditTitle(article.title ?? "");
                    setEditDescription(article.description ?? "");
                    setEditBody(markdownBody);
                    setEditOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteArticleMut.mutate()}
                  disabled={deleteArticleMut.isPending}
                >
                  Delete
                </Button>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <UserCircle2 className="h-4 w-4" />
                {authorName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" />
                {readMinutes(article)} min read
              </span>
              <span>{article.createdAt ? formatDistanceToNow(new Date(article.createdAt), { addSuffix: true }) : ""}</span>
            </div>
          </header>

          <Separator />

          <section className="prose prose-neutral dark:prose-invert max-w-none">
            {markdownBody ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ ...props }) => (
                    <h1 {...props} className="mt-10 mb-4 text-balance text-3xl font-extrabold tracking-tight md:text-4xl" />
                  ),
                  h2: ({ ...props }) => (
                    <h2 {...props} className="mt-10 mb-3 text-2xl font-bold tracking-tight md:text-3xl" />
                  ),
                  h3: ({ ...props }) => (
                    <h3 {...props} className="mt-8 mb-3 text-xl font-semibold tracking-tight md:text-2xl" />
                  ),
                  p: ({ ...props }) => <p {...props} className="leading-8 text-muted-foreground" />,
                  blockquote: ({ ...props }) => (
                    <blockquote
                      {...props}
                      className="my-6 rounded-xl border-l-4 border-primary/50 bg-muted/30 px-5 py-4 italic text-muted-foreground"
                    />
                  ),
                  ul: ({ ...props }) => <ul {...props} className="my-4 list-disc space-y-2 pl-6" />,
                  ol: ({ ...props }) => <ol {...props} className="my-4 list-decimal space-y-2 pl-6" />,
                  hr: ({ ...props }) => <hr {...props} className="my-8 border-border/70" />,
                  table: ({ ...props }) => (
                    <div className="my-6 overflow-x-auto rounded-xl border">
                      <table {...props} className="w-full border-collapse text-sm" />
                    </div>
                  ),
                  th: ({ ...props }) => <th {...props} className="bg-muted/40 px-4 py-2 text-left font-semibold" />,
                  td: ({ ...props }) => <td {...props} className="border-t px-4 py-2 align-top" />,
                  img: ({ ...props }) => (
                    <img
                      {...props}
                      className="my-6 w-full rounded-xl border object-cover shadow-sm"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ),
                  a: ({ ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary underline decoration-primary/40 underline-offset-4"
                    />
                  ),
                  pre: ({ ...props }) => (
                    <pre
                      {...props}
                      className="my-6 overflow-x-auto rounded-xl border border-primary/20 bg-muted/60 p-4 text-sm shadow-sm"
                    />
                  ),
                  code: ({ ...props }) => (
                    <code {...props} className="rounded bg-muted px-1.5 py-0.5 text-[0.92em] font-medium" />
                  ),
                }}
              >
                {markdownBody}
              </ReactMarkdown>
            ) : (
              (article.contentBlocks ?? []).map((block, i) => renderBlock(block, i))
            )}
          </section>

          {images?.length > 0 && (
            <section className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Article images</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {images.map((img, index) => (
                  galleryImageErrors[img] ? (
                    <div
                      key={`${img}-${index}`}
                      className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground"
                    >
                      Could not load image preview.
                      <a
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 underline underline-offset-2"
                      >
                        Open image
                      </a>
                    </div>
                  ) : (
                    <img
                      key={`${img}-${index}`}
                      src={img}
                      alt={`article-image-${index}`}
                      loading="lazy"
                      className="block h-auto w-full rounded-xl border"
                      onError={() =>
                        setGalleryImageErrors((prev) => ({
                          ...prev,
                          [img]: true,
                        }))
                      }
                    />
                  )
                ))}
              </div>
            </section>
          )}
        </div>
      </article>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="flex max-h-[78vh] w-[min(92vw,56rem)] max-w-4xl flex-col overflow-hidden rounded-2xl p-0">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>Edit article</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="min-h-[90px] resize-y"
            />
            <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="min-h-[220px] resize-y" />
          </div>
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateArticleMut.mutate()} disabled={updateArticleMut.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

