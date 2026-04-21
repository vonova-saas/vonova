"use client";

import { fetchArticleBySlug } from "@/services/app/community/community.api";
import type { ArticleContentBlock, CommunityArticle } from "@/types/api/app/community/community.types";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, BookOpen, Clock3, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function getArticleImage(article?: CommunityArticle): string | undefined {
  if (!article) return undefined;
  if (article.coverImage) return article.coverImage.trim();
  if (article.images?.[0]) return article.images[0].trim();
  const fromBlock = article.contentBlocks?.find((b) => b.type === "image" && b.url);
  return fromBlock?.url?.trim();
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

type Props = {
  area: "student" | "instructor";
  userId: string;
  slug: string;
};

export default function CommunityArticlePageClient({ area, userId, slug }: Props) {
  const query = useQuery({
    queryKey: ["community", "article", "slug", slug],
    queryFn: () => fetchArticleBySlug(slug),
    enabled: Boolean(slug),
  });

  const article = query.data;
  const heroImage = getArticleImage(article);
  const backHref = `/${area}/${userId}/community`;
  const authorName =
    article && typeof article.author === "object"
      ? article.author?.name || article.author?.email || "Community member"
      : "Community member";

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
          {heroImage ? (
            <img
              src={encodeURI(heroImage)}
              alt={article.title}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
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
            {(article.contentBlocks ?? []).map((block, i) => renderBlock(block, i))}
          </section>
        </div>
      </article>
    </div>
  );
}

