"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Loader2, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import { useCommunityArticles } from "@/hooks/app/community/use-social";
import { CommunityArticleCard } from "@/components/community/articles/community-article-card";
import {
  ARTICLE_CATEGORIES,
  type ArticleCategory,
} from "@/services/app/community/articles.api";

export default function CommunityArticlesPage() {
  const auth = useAuthContextOptional();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ArticleCategory | "">("");

  const { data, isLoading } = useCommunityArticles({
    search: search.trim() || undefined,
    category: category || undefined,
  });

  const articles = data?.articles ?? data?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Articles
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Long-form posts from students and instructors.
          </p>
        </div>
        {auth?.isAuthenticated && (
          <Button asChild size="lg" className="gap-2 rounded-full px-6 shadow-md">
            <Link href="/community/articles/new">
              <Plus className="h-5 w-5" />
              Write
            </Link>
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="h-12 pl-10 text-base md:h-14 md:text-lg"
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) =>
            setCategory(v === "__all__" ? "" : (v as ArticleCategory))
          }
        >
          <SelectTrigger className="h-12 w-full text-base sm:w-[200px] md:h-14">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {ARTICLE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <Card className="border-dashed p-14 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">
            No articles yet.{" "}
            {auth?.isAuthenticated && (
              <Link
                href="/community/articles/new"
                className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
              >
                Be the first to publish one.
              </Link>
            )}
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:gap-6">
          {articles.map((article) => (
            <CommunityArticleCard key={article._id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
