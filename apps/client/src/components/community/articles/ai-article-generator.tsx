"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  generateArticleWithAIMutationFn,
  type GenerateArticleWithAIResponse,
} from "@/services/app/community/community.api";
import {
  useAiCanUse,
  useConsumeAiCredits,
} from "@/hooks/app/community/use-social";
import { getFeatureCost } from "@/lib/ai/credits";
import {
  ARTICLE_CATEGORIES,
  type ArticleCategory,
} from "@/services/app/community/articles.api";

export type AiArticleDraft = {
  title: string;
  description: string;
  body: string;
  category: ArticleCategory;
};

type AiArticleGeneratorProps = {
  onApply: (draft: AiArticleDraft) => void;
  className?: string;
};

const FEATURE = "ARTICLE_GENERATION";

function mapGeneratedCategory(
  raw: GenerateArticleWithAIResponse["category"],
): ArticleCategory {
  // The AI service returns a smaller category set than our composer accepts;
  // map them onto the canonical list and fall back to "backend" if the model
  // ever returns something unexpected.
  return ARTICLE_CATEGORIES.includes(raw as ArticleCategory)
    ? (raw as ArticleCategory)
    : "backend";
}

export function AiArticleGenerator({
  onApply,
  className,
}: AiArticleGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [preview, setPreview] = useState<GenerateArticleWithAIResponse | null>(
    null,
  );

  const gate = useAiCanUse(FEATURE);
  const consume = useConsumeAiCredits();
  const cost = getFeatureCost(FEATURE);
  const MIN_TOPIC_LENGTH = 3;

  const generate = useMutation({
    mutationFn: (input: string) => generateArticleWithAIMutationFn(input),
    onSuccess: (data) => {
      setPreview(data);
      // Debit the user's AI credit balance after the vendor call succeeds so
      // failed generations don't burn credits. The server enforces gating
      // again before the deduction is persisted.
      consume.mutate(
        {
          feature: FEATURE,
          creditsUsed: cost,
          meta: { topic: topic.trim().slice(0, 200) },
        },
        {
          onSuccess: () => gate.refetch(),
        },
      );
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message ?? "Failed to generate article");
    },
  });

  const allowed = gate.data?.allowed ?? true;
  const remaining = gate.data?.remaining;
  const plan = gate.data?.plan;
  const trimmedTopic = topic.trim();

  const canSubmit =
    trimmedTopic.length >= MIN_TOPIC_LENGTH && allowed && !generate.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPreview(null);
    generate.mutate(topic.trim());
  }

  function apply() {
    if (!preview) return;
    onApply({
      title: preview.title,
      description: preview.summary,
      body: preview.body,
      category: mapGeneratedCategory(preview.category),
    });
    toast.success("AI draft applied — review and edit before publishing.");
  }

  return (
    <Card
      className={cn(
        "border-violet-200 bg-linear-to-br from-violet-50/60 to-transparent dark:border-violet-900/40 dark:from-violet-950/30",
        className,
      )}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-violet-100 p-1.5 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Generate with AI</p>
              <p className="text-xs text-muted-foreground">
                Describe a topic and we&apos;ll draft a full article you can
                edit.
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {cost} credits
            {typeof remaining === "number" ? ` · ${remaining} left` : ""}
            {plan ? ` · ${plan}` : ""}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <Label htmlFor="ai-topic" className="text-xs text-muted-foreground">
            Topic or prompt
          </Label>
          <div className="flex items-stretch gap-2">
            <Input
              id="ai-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Optimising React Query cache invalidation for nested feeds"
              maxLength={200}
              disabled={generate.isPending}
            />
            <Button
              type="submit"
              disabled={!canSubmit}
              className="shrink-0 gap-2"
            >
              {generate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Generate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter a short topic or prompt with at least {MIN_TOPIC_LENGTH} characters.
          </p>
          {!allowed && (
            <p className="text-xs text-amber-600">
              You don&apos;t have enough AI credits for this action ({cost}{" "}
              credits).{" "}
              <a href="/pricing" className="underline">
                Upgrade for a higher monthly allowance
              </a>
              .
            </p>
          )}
        </form>

        {preview && (
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                Draft preview
              </p>
              <Badge variant="outline" className="text-[10px]">
                #{mapGeneratedCategory(preview.category)}
              </Badge>
            </div>
            <h3 className="text-sm font-semibold">{preview.title}</h3>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {preview.summary}
            </p>
            <p className="line-clamp-4 whitespace-pre-wrap text-xs text-foreground/80">
              {preview.body}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreview(null)}
              >
                Discard
              </Button>
              <Button type="button" size="sm" onClick={apply}>
                Use this draft
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
