"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

export const ALL_CATEGORY = "all" as const;

export type CategoryValue = string | typeof ALL_CATEGORY;

export interface CategoryPillsProps {
  /** Available categories (without the "all" entry — it is added automatically). */
  categories: string[];
  /** Currently selected value, or "all". */
  value: CategoryValue;
  onChange: (next: CategoryValue) => void;
  /** Optional label rendered above the pill row. */
  className?: string;
  /** Hide the component entirely if there are no categories to show. */
  hideWhenEmpty?: boolean;
  /** Override the label of the "all" pill. */
  allLabel?: string;
  /** Optional per-id label (e.g. LMS enum → "Data Science"). */
  getCategoryLabel?: (categoryId: string) => string;
}

const defaultFormatLabel = (raw: string) =>
  raw
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const pillButtonClass = (active: boolean) =>
  cn(
    "shrink-0 scroll-m-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200",
    "snap-start select-none",
    active
      ? "border-primary/80 bg-primary text-primary-foreground shadow-md ring-2 ring-primary/25 hover:bg-primary/95"
      : "border-border/70 bg-card/70 text-foreground/90 shadow-sm backdrop-blur-sm hover:border-primary/45 hover:bg-primary/8 hover:text-foreground hover:shadow-md active:scale-[0.98]",
  );

export function CategoryPills({
  categories,
  value,
  onChange,
  className,
  hideWhenEmpty = true,
  allLabel = "All",
  getCategoryLabel,
}: CategoryPillsProps) {
  const labelFor = getCategoryLabel ?? defaultFormatLabel;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateScrollFades = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth - clientWidth > 2;
    setShowLeftFade(overflow && scrollLeft > 2);
    setShowRightFade(overflow && scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    updateScrollFades();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateScrollFades());
    ro.observe(el);
    el.addEventListener("scroll", updateScrollFades, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollFades);
    };
  }, [categories, updateScrollFades]);

  // Keep the active pill visible when using horizontal scroll (md+).
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const key = value === ALL_CATEGORY ? ALL_CATEGORY : String(value);
    const node = root.querySelector<HTMLElement>(`[data-category-pill="${CSS.escape(key)}"]`);
    node?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [value, categories]);

  if (hideWhenEmpty && categories.length === 0) return null;

  return (
    <div
      className={cn(
        "relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/50",
        "bg-linear-to-br from-primary/6 via-background/80 to-violet-500/5",
        "p-3 shadow-sm backdrop-blur-md sm:p-4",
        className,
      )}
    >
      {/* Edge fades when horizontally scrollable (md+ layout). */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-3 left-0 z-1 hidden w-10 rounded-l-2xl bg-linear-to-r from-background via-background/90 to-transparent transition-opacity duration-300 md:block",
          showLeftFade ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-3 right-0 z-1 hidden w-10 rounded-r-2xl bg-linear-to-l from-background via-background/90 to-transparent transition-opacity duration-300 md:block",
          showRightFade ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={scrollerRef}
        className={cn(
          "relative z-0 flex max-h-none w-full min-w-0 gap-2",
          /* Mobile / narrow: wrap so labels are never clipped */
          "flex-wrap justify-center",
          /* Tablet+: single row, scroll inside panel (no page overflow) */
          "md:flex-nowrap md:justify-start md:overflow-x-auto md:overflow-y-hidden md:scroll-smooth md:pb-1 md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden",
          "md:snap-x md:snap-mandatory md:touch-pan-x md:overscroll-x-contain",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-category-pill={ALL_CATEGORY}
          className={pillButtonClass(value === ALL_CATEGORY)}
          onClick={() => onChange(ALL_CATEGORY)}
        >
          {allLabel}
        </Button>

        {categories.map((c) => (
          <Button
            key={c}
            type="button"
            variant="ghost"
            size="sm"
            data-category-pill={c}
            className={pillButtonClass(value === c)}
            onClick={() => onChange(c)}
          >
            {labelFor(c)}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Build a sorted, de-duplicated list of categories from items.
 * Pass a getter that returns one or more raw category strings per item;
 * empty / falsy values are dropped.
 */
export function collectCategories<T>(
  items: readonly T[],
  getRaw: (item: T) => string | string[] | null | undefined,
): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const raw = getRaw(item);
    if (!raw) continue;
    const list = Array.isArray(raw) ? raw : [raw];
    for (const value of list) {
      const trimmed = String(value ?? "").trim();
      if (trimmed) set.add(trimmed);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Returns true when the item should be visible for the active filter.
 * `selected === ALL_CATEGORY` always passes.
 */
export function matchesCategory<T>(
  item: T,
  selected: CategoryValue,
  getRaw: (item: T) => string | string[] | null | undefined,
): boolean {
  if (selected === ALL_CATEGORY) return true;
  const raw = getRaw(item);
  if (!raw) return false;
  const list = Array.isArray(raw) ? raw : [raw];
  return list.some((v) => String(v ?? "").trim() === selected);
}
