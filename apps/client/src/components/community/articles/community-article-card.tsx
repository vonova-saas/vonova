"use client";

import Link from "next/link";
import { PresignedMediaImage } from "@/components/shared/presigned-media-image";
import { getArticleById } from "@/services/app/community/articles.api";
import { formatDistanceToNow } from "date-fns";
import { BookOpen } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CommunityArticle } from "@/services/app/community/articles.api";
import type { CommunityProfileSummary } from "@/types/api/app/community/social.types";
import { plainTextFromMarkdown } from "@/components/community/articles/article-markdown";
import { cn } from "@/lib/utils";

function authorOf(
  article: CommunityArticle,
): CommunityProfileSummary | null {
  if (article.author && typeof article.author === "object") {
    return article.author as CommunityProfileSummary;
  }
  return null;
}

export function CommunityArticleCard({
  article,
  className,
}: {
  article: CommunityArticle;
  className?: string;
}) {
  const author = authorOf(article);
  const target = `/community/articles/${encodeURIComponent(article._id)}`;
  const desc = plainTextFromMarkdown(article.description ?? "", 200);
  const status = article.status ?? article.publishedStatus;

  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/80 bg-card/80 shadow-sm backdrop-blur-sm transition",
        "hover:border-violet-500/35 hover:shadow-lg hover:shadow-violet-500/10",
        className,
      )}
    >
      {article.coverImage ? (
        <Link href={target} className="relative block aspect-video bg-muted">
          <PresignedMediaImage
            src={article.coverImage}
            alt={article.title}
            width={800}
            height={450}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            onRefreshSrc={async () => {
              const fresh = await getArticleById(article._id);
              return fresh.coverImage ?? null;
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-80" />
        </Link>
      ) : (
        <Link
          href={target}
          className="flex aspect-video items-center justify-center bg-linear-to-br from-violet-600/25 via-indigo-600/20 to-fuchsia-500/25"
        >
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
        </Link>
      )}
      <CardContent className="space-y-3 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link href={target} className="block min-w-0 flex-1">
            <h2 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-foreground transition group-hover:text-violet-600 dark:group-hover:text-violet-400 md:text-xl">
              {article.title}
            </h2>
          </Link>
          {status ? (
            <Badge variant="secondary" className="shrink-0 text-xs capitalize">
              {status}
            </Badge>
          ) : null}
        </div>
        <Link href={target} className="block">
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            {desc}
          </p>
        </Link>
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          <Avatar className="h-8 w-8 ring-2 ring-background">
            <AvatarImage src={author?.profilePictureUrl} alt={author?.name} />
            <AvatarFallback className="text-xs">
              {(author?.name ?? "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm text-muted-foreground">
            <span className="font-medium text-foreground/90">
              {author?.name ?? "Unknown"}
            </span>
            {" · "}
            {article.createdAt
              ? formatDistanceToNow(new Date(article.createdAt), {
                  addSuffix: true,
                })
              : "just now"}
          </span>
        </div>
        {article.category?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {article.category.slice(0, 4).map((c) => (
              <Badge
                key={c}
                variant="outline"
                className="rounded-full border-violet-500/30 text-xs text-violet-700 dark:text-violet-300"
              >
                #{c}
              </Badge>
            ))}
          </div>
        ) : null}
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="w-full rounded-full font-medium md:h-10"
        >
          <Link href={target}>Read article</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
