"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown, Eye, Lock, Loader2 } from "lucide-react";
import { useState } from "react";

/* -------------------------------------------------------------------------- */
/* Visibility badges                                                          */
/* -------------------------------------------------------------------------- */

export type ResourceVisibility =
  | "PUBLIC"
  | "PRIVATE"
  | "PREMIUM"
  | "DRAFT"
  | string;

export function VisibilityBadge({
  value,
  className,
}: {
  value: ResourceVisibility | undefined | null;
  className?: string;
}) {
  if (!value) return null;
  const v = String(value).toUpperCase();
  const styles: Record<string, string> = {
    PUBLIC:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    PRIVATE:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    PREMIUM:
      "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    DRAFT:
      "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  };
  const cls = styles[v] ?? "border-border bg-muted text-foreground";
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-wide",
        cls,
        className,
      )}
    >
      {v}
    </Badge>
  );
}

export function DifficultyBadge({
  value,
  className,
}: {
  value: string | undefined | null;
  className?: string;
}) {
  if (!value) return null;
  const v = String(value).toLowerCase();
  const styles: Record<string, string> = {
    easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    medium:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    hard: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };
  const cls = styles[v] ?? "border-border bg-muted text-foreground";
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-wide",
        cls,
        className,
      )}
    >
      {v}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Saving indicator                                                            */
/* -------------------------------------------------------------------------- */

export function SavingIndicator({
  saving,
  saved,
  className,
}: {
  saving?: boolean;
  saved?: boolean;
  className?: string;
}) {
  if (saving) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400",
          className,
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (saved) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in-0 slide-in-from-right-2",
          className,
        )}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Saved
      </span>
    );
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Section card (Materials / Quizzes / Problems)                               */
/* -------------------------------------------------------------------------- */

export function ResourceSectionCard({
  icon,
  title,
  description,
  count,
  badgeColor = "primary",
  saving,
  saved,
  action,
  defaultOpen = true,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  count: number;
  badgeColor?: "primary" | "violet" | "emerald" | "amber" | "sky";
  saving?: boolean;
  saved?: boolean;
  action?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const colorClasses: Record<NonNullable<typeof badgeColor>, string> = {
    primary: "bg-primary/10 text-primary border-primary/25",
    violet:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25",
    emerald:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    amber:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
  };

  return (
    <Card className="overflow-hidden border-border/60 shadow-xs transition-all hover:shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                  colorClasses[badgeColor],
                )}
                aria-hidden
              >
                {icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">
                    {title}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="h-5 rounded-full px-2 text-[11px] font-semibold tabular-nums"
                  >
                    {count}
                  </Badge>
                  <SavingIndicator saving={saving} saved={saved} />
                </div>
                <CardDescription className="mt-0.5 line-clamp-2">
                  {description}
                </CardDescription>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {action}
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full"
                  aria-label={open ? "Collapse section" : "Expand section"}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      open ? "rotate-180" : "rotate-0",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state inside a section                                                */
/* -------------------------------------------------------------------------- */

export function ResourceEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-border/70 bg-linear-to-br from-muted/30 via-background to-muted/20 px-4 py-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background shadow-xs">
        {icon}
      </div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
        {description}
      </p>
      <div className="mt-4 inline-flex">{action}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Visibility field (Public vs Private radio cards)                            */
/* -------------------------------------------------------------------------- */

export type VisibilityChoice = "PUBLIC" | "PRIVATE";

export function VisibilityField({
  value,
  onChange,
  resourceLabel,
  managementLabel,
  className,
  disabled,
}: {
  value: VisibilityChoice;
  onChange: (next: VisibilityChoice) => void;
  /** Singular noun used in copy, e.g. "quiz", "material", "problem". */
  resourceLabel: string;
  /** Where this surfaces when public, e.g. "Quiz Management library". */
  managementLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const options: Array<{
    id: VisibilityChoice;
    title: string;
    description: string;
    icon: ReactNode;
    accent: string;
  }> = [
    {
      id: "PRIVATE",
      title: "Private to this course",
      description: `Only students enrolled in this course can open the ${resourceLabel} (via this lesson). Hidden from public listings.`,
      icon: <Lock className="h-4 w-4" />,
      accent:
        "border-amber-500/40 bg-amber-500/8 text-amber-700 dark:text-amber-300",
    },
    {
      id: "PUBLIC",
      title: "Public",
      description: `Anyone can discover the ${resourceLabel} in the ${managementLabel}. Still appears under this lesson.`,
      icon: <Eye className="h-4 w-4" />,
      accent:
        "border-emerald-500/40 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300",
    },
  ];

  return (
    <fieldset
      className={cn("space-y-2", className)}
      disabled={disabled}
      aria-label={`${resourceLabel} visibility`}
    >
      <div className="flex items-center justify-between">
        <legend className="text-sm font-medium">Visibility</legend>
        <span className="text-[11px] text-muted-foreground">
          Always visible under this lesson
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              data-selected={selected}
              onClick={() => onChange(opt.id)}
              className={cn(
                "group relative flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                "hover:shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-foreground/40 bg-foreground/3 shadow-xs"
                  : "border-border/70 bg-card hover:border-border",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                  selected
                    ? opt.accent
                    : "border-border bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {opt.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{opt.title}</span>
                  {selected ? (
                    <span className="inline-flex h-4 items-center rounded-full bg-foreground/10 px-1.5 text-[10px] font-semibold uppercase tracking-wide">
                      Selected
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  {opt.description}
                </span>
              </span>
              <span
                className={cn(
                  "mt-1 inline-block h-3.5 w-3.5 shrink-0 rounded-full border",
                  selected
                    ? "border-foreground bg-foreground"
                    : "border-border bg-background",
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/* -------------------------------------------------------------------------- */
/* Resource list skeleton                                                      */
/* -------------------------------------------------------------------------- */

export function ResourceListSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i}>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}
