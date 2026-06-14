"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import { useCreateArticle } from "@/hooks/app/community/use-social";
import {
  ARTICLE_CATEGORIES,
  type ArticleCategory,
} from "@/services/app/community/articles.api";
import { cn } from "@/lib/utils";
import {
  AiArticleGenerator,
  type AiArticleDraft,
} from "@/components/community/articles/ai-article-generator";

export default function CreateArticlePage() {
  const router = useRouter();
  const auth = useAuthContextOptional();
  const create = useCreateArticle();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<
    ArticleCategory[]
  >([]);
  const [cover, setCover] = useState<File | null>(null);
  const [aiAssisted, setAiAssisted] = useState(false);

  function applyAiDraft(draft: AiArticleDraft) {
    setTitle(draft.title);
    setDescription(draft.description);
    setBody(draft.body);
    setSelectedCategories((prev) =>
      prev.includes(draft.category) ? prev : [...prev, draft.category],
    );
    setAiAssisted(true);
  }

  if (auth && auth.isAuthenticated === false) {
    // The composer is restricted to authenticated users; bounce non-logged
    // visitors back to the articles browse page rather than rendering a
    // form they can't submit.
    if (typeof window !== "undefined") {
      router.replace("/community/articles");
    }
    return null;
  }

  function toggleCategory(cat: ArticleCategory) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  const canSubmit =
    title.trim().length >= 4 &&
    description.trim().length >= 10 &&
    body.trim().length >= 20 &&
    selectedCategories.length > 0 &&
    !create.isPending;

  function submit() {
    if (!canSubmit) return;
    create.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        contentBlocks: [
          {
            type: "text",
            order: 1,
            content: body.trim(),
          },
        ],
        category: selectedCategories,
        coverImage: cover ?? undefined,
      },
      {
        onSuccess: (article) => {
          router.push(`/community/articles/${article._id}`);
        },
      },
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Write an article</h1>
          <p className="text-sm text-muted-foreground">
            Share long-form notes, tutorials, or breakdowns with the community.
          </p>
        </div>
        {aiAssisted && (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Sparkles className="h-3 w-3" />
            AI-assisted
          </Badge>
        )}
      </header>

      <AiArticleGenerator onApply={applyAiDraft} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A short, descriptive title"
              maxLength={140}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One or two sentences summarising the article."
              maxLength={320}
              className="min-h-[72px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Article body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the full article here. You can format with line breaks."
              className="min-h-[260px] font-[450] leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              {body.trim().length} characters · minimum 20
            </p>
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-1.5">
              {ARTICLE_CATEGORIES.map((c) => {
                const active = selectedCategories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCategory(c)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      active
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-border bg-muted text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    #{c}
                  </button>
                );
              })}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Pick at least one category.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Cover image (optional)</Label>
            {cover ? (
              <div className="flex items-center gap-3 rounded-lg border p-2">
                <Badge variant="secondary" className="gap-1">
                  <ImagePlus className="h-3 w-3" />
                  {cover.name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(cover.size / 1024).toFixed(0)} KB
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 gap-1 text-xs"
                  onClick={() => setCover(null)}
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            ) : (
              <Input
                id="cover"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setCover(f);
                }}
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-3">
            <Button
              variant="ghost"
              onClick={() => router.push("/community/articles")}
            >
              Cancel
            </Button>
            <Button onClick={submit} disabled={!canSubmit}>
              {create.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Publish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
