import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

/**
 * Shared "site marketing" page shell so every footer page feels cohesive:
 *   Hero (gradient + soft blurs + badge + headline + actions)
 *   → MarketingSection (eyebrow + title + body + grid)
 *   → MarketingFeatureCard / MarketingStatCard for content
 *
 * Each footer page composes these so we don't repeat 100 lines of layout.
 */

interface HeroAction {
  label: string;
  href: string;
  variant?: "default" | "outline" | "secondary";
  icon?: LucideIcon;
  external?: boolean;
}

export function MarketingHero({
  eyebrow,
  badge,
  title,
  description,
  actions = [],
  meta,
  align = "center",
}: {
  eyebrow?: string;
  badge?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: HeroAction[];
  /** Small line under the actions (e.g. "Updated June 2026"). */
  meta?: string;
  align?: "center" | "start";
}) {
  return (
    <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
      />
      <div
        className={cn(
          "relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24",
          align === "center" && "md:text-center",
        )}
      >
        <Badge
          variant="secondary"
          className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-medium"
        >
          <Sparkles className="mr-1 inline h-3.5 w-3.5" />
          {badge ?? "Vonova"}
        </Badge>
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "mt-4 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        ) : null}
        {actions.length > 0 ? (
          <div
            className={cn(
              "mt-7 flex flex-wrap items-center gap-3",
              align === "center" && "justify-center",
            )}
          >
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <Button
                  key={a.href + a.label}
                  asChild
                  size="lg"
                  variant={a.variant ?? "default"}
                  className={cn(
                    "rounded-full px-6",
                    (a.variant ?? "default") === "default" &&
                      "bg-linear-to-r from-primary to-primary/90 shadow-lg transition-all duration-200 hover:from-primary/90 hover:to-primary hover:shadow-xl",
                    (a.variant ?? "default") === "outline" &&
                      "border-primary/25 bg-background/60 backdrop-blur",
                  )}
                >
                  <Link
                    href={a.href}
                    target={a.external ? "_blank" : undefined}
                    rel={a.external ? "noopener noreferrer" : undefined}
                  >
                    {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
                    {a.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        ) : null}
        {meta ? (
          <p
            className={cn(
              "mt-6 text-xs text-muted-foreground",
              align === "center" && "text-center",
            )}
          >
            {meta}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function MarketingSection({
  eyebrow,
  title,
  description,
  children,
  className,
  id,
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-12 sm:py-16", className)}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {eyebrow || title || description ? (
          <div className="mb-8 max-w-3xl">
            {eyebrow ? (
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

export function MarketingFeatureCard({
  icon: Icon,
  title,
  description,
  tag,
  accent = "primary",
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  tag?: string;
  accent?: "primary" | "sky" | "violet" | "emerald" | "amber" | "rose";
  className?: string;
}) {
  const accentClass = {
    primary: "border-primary/30 bg-primary/10 text-primary",
    sky: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    violet:
      "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    emerald:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  }[accent];

  return (
    <div
      className={cn(
        "group relative h-full rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
    >
      {tag ? (
        <span className="absolute right-4 top-4 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {tag}
        </span>
      ) : null}
      {Icon ? (
        <span
          className={cn(
            "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border",
            accentClass,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function MarketingStatCard({
  label,
  value,
  accent = "text-foreground",
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 text-center shadow-sm backdrop-blur-sm md:py-5">
      <div className={cn("text-3xl font-semibold tabular-nums", accent)}>
        {value}
      </div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground md:text-xs">
        {label}
      </div>
    </div>
  );
}

export function MarketingCTABand({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions: HeroAction[];
}) {
  return (
    <section className="relative overflow-hidden border-t bg-linear-to-br from-primary/10 via-background to-muted/30">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
      />
      <div className="relative mx-auto flex max-w-5xl flex-col items-start gap-6 px-4 py-12 sm:px-6 sm:py-16 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h3 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h3>
          {description ? (
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Button
                key={a.href + a.label}
                asChild
                size="lg"
                variant={a.variant ?? "default"}
                className={cn(
                  "rounded-full px-6",
                  (a.variant ?? "default") === "default" &&
                    "bg-linear-to-r from-primary to-primary/90 shadow-lg transition-all duration-200 hover:from-primary/90 hover:to-primary hover:shadow-xl",
                  (a.variant ?? "default") === "outline" &&
                    "border-primary/25 bg-background/60 backdrop-blur",
                )}
              >
                <Link
                  href={a.href}
                  target={a.external ? "_blank" : undefined}
                  rel={a.external ? "noopener noreferrer" : undefined}
                >
                  {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
                  {a.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
