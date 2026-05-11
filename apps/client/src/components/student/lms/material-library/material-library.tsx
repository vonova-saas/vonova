"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Eye,
  HelpCircle,
  ImageIcon,
  LayoutGrid,
  Library,
  Loader2,
  Presentation,
  RefreshCcw,
  Rows3,
  Search,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { fetchLibraryItemsQueryFn } from "@/services/api/shared/material-library/material.api";
import {
  ALL_CATEGORY,
  CategoryPills,
  CategoryValue,
} from "@/components/shared/category-pills";
import {
  LMS_COURSE_CATEGORIES,
  formatLmsCourseCategoryLabel,
  normalizeLmsCourseCategory,
} from "@/lib/lms/lms-course-categories";
import { ProtectedMediaModal } from "@/components/shared/protected-media/protected-media-modal";
import { useProtectedMediaViewer } from "@/components/shared/protected-media/use-protected-media-viewer";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import { cn } from "@/lib/utils";

// ---------- Types ----------

interface StudentMaterial {
  _id: string;
  id: string;
  title: string;
  description?: string;
  type: "book" | "visual-guide" | "presentation";
  viewType: "book" | "guide" | "presentation";
  status?: string;
  category?: string;
  level?: string;
  topics: string[];
  author?: string;
  createdAt: string;
  updatedAt: string;
  fileUrl?: string;
  fileAssetId?: { urls?: { streamUrl?: string } } | null;
  viewCount: number;
  downloadCount: number;
}

type SortKey = "newest" | "oldest" | "title-az" | "title-za";
type TypeFilter = "all" | "book" | "visual-guide" | "presentation";
type ViewMode = "grid" | "list";

const TYPE_META: Record<
  StudentMaterial["type"],
  { label: string; icon: typeof BookOpen; accent: string; chip: string }
> = {
  book: {
    label: "Book / PDF",
    icon: BookOpen,
    accent: "from-sky-500/15 via-sky-500/5 to-transparent",
    chip:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  "visual-guide": {
    label: "Visual guide",
    icon: ImageIcon,
    accent: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    chip:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  presentation: {
    label: "Presentation",
    icon: Presentation,
    accent: "from-orange-500/15 via-orange-500/5 to-transparent",
    chip:
      "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  },
};

const materialCategoryPills: readonly string[] = LMS_COURSE_CATEGORIES;

// ---------- Helpers ----------

const normalizeMaterialType = (type: unknown): StudentMaterial["type"] => {
  const t = String(type || "book").toLowerCase();
  if (t === "presentation" || t === "presentations") return "presentation";
  if (t === "guide" || t === "guides" || t === "visual-guide")
    return "visual-guide";
  return "book";
};

const extractMaterials = (response: unknown): unknown[] => {
  const r = response as Record<string, unknown> | undefined;
  if (Array.isArray(response)) return response;
  if (Array.isArray(r?.items)) return r!.items as unknown[];
  if (Array.isArray(r?.materials)) return r!.materials as unknown[];
  if (Array.isArray(r?.data)) return r!.data as unknown[];
  if (
    r?.data &&
    typeof r.data === "object" &&
    !Array.isArray(r.data)
  ) {
    const d = r.data as Record<string, unknown>;
    const books = Array.isArray(d.books) ? (d.books as unknown[]) : [];
    const guides = Array.isArray(d.guides) ? (d.guides as unknown[]) : [];
    const presentations = Array.isArray(d.presentations)
      ? (d.presentations as unknown[])
      : [];
    const uploads = Array.isArray(d.uploads) ? (d.uploads as unknown[]) : [];
    return [...books, ...guides, ...presentations, ...uploads];
  }
  return [];
};

const normalizeMaterial = (raw: unknown): StudentMaterial => {
  const item = raw as Record<string, any>;
  const type = normalizeMaterialType(item.type);
  const viewType: StudentMaterial["viewType"] =
    type === "presentation"
      ? "presentation"
      : type === "visual-guide"
        ? "guide"
        : "book";
  return {
    _id: item._id || item.id,
    id: item._id || item.id,
    title: item.title ?? "Untitled",
    description: item.description ?? item.summary ?? undefined,
    type,
    viewType,
    status: item.status,
    category: item.category,
    level: item.level,
    topics: Array.isArray(item.topics) ? item.topics : [],
    author:
      item.author ||
      (Array.isArray(item.authors)
        ? item.authors
            .map((a: { name?: string }) => a?.name)
            .filter(Boolean)
            .join(", ")
        : undefined),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    fileUrl:
      item.contentUrl ||
      item.presignedUrl ||
      item.fileAssetId?.urls?.streamUrl ||
      item.fileUrl,
    fileAssetId: item.fileAssetId ?? null,
    viewCount: Number(item.viewCount ?? item.metrics?.views ?? 0),
    downloadCount: Number(
      item.downloadCount ?? item.metrics?.downloads ?? 0,
    ),
  };
};

function materialMatchesSelectedCategory(
  material: { category?: string },
  selected: CategoryValue,
): boolean {
  if (selected === ALL_CATEGORY) return true;
  return normalizeLmsCourseCategory(material.category) === selected;
}

// ---------- Page ----------

export default function MaterialLibrary() {
  const authOptional = useAuthContextOptional();
  const protectedMedia = useProtectedMediaViewer();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryValue>(ALL_CATEGORY);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const {
    data: materialsResponse,
    isLoading: loading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["student-material-library", "PUBLISHED"],
    queryFn: () => fetchLibraryItemsQueryFn(undefined, "PUBLISHED"),
  });

  const materials: StudentMaterial[] = useMemo(() => {
    return extractMaterials(materialsResponse)
      .map(normalizeMaterial)
      .filter((m) => !m.status || m.status === "PUBLISHED");
  }, [materialsResponse]);

  const stats = useMemo(() => {
    const counts: Record<StudentMaterial["type"], number> = {
      book: 0,
      "visual-guide": 0,
      presentation: 0,
    };
    for (const m of materials) counts[m.type] += 1;
    return {
      total: materials.length,
      counts,
      topics: new Set(materials.flatMap((m) => m.topics)).size,
    };
  }, [materials]);

  const filtered = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    let rows = materials.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (!materialMatchesSelectedCategory(m, selectedCategory)) return false;
      if (!needle) return true;
      const hay = [m.title, m.description, m.author, m.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (a.createdAt || "").localeCompare(b.createdAt || "");
        case "title-az":
          return a.title.localeCompare(b.title);
        case "title-za":
          return b.title.localeCompare(a.title);
        case "newest":
        default:
          return (b.createdAt || "").localeCompare(a.createdAt || "");
      }
    });
    return rows;
  }, [materials, searchQuery, selectedCategory, sortBy, typeFilter]);

  const openMaterial = (m: StudentMaterial) => {
    protectedMedia.openMaterial({
      materialId: m._id,
      materialType: m.viewType,
      title: m.title,
      subtitle:
        [TYPE_META[m.type].label, m.category, m.level]
          .filter(Boolean)
          .join(" • ") || undefined,
    });
  };

  const viewer = {
    name: authOptional?.user?.name ?? null,
    email:
      (authOptional?.user as { email?: string } | undefined)?.email ?? null,
    id: (authOptional?.user as { _id?: string } | undefined)?._id ?? null,
  };

  const hasActiveFilters =
    searchQuery.length > 0 ||
    typeFilter !== "all" ||
    selectedCategory !== ALL_CATEGORY;

  return (
    <TooltipProvider>
      <div className="min-h-full w-full pb-16">
        <HeroSection
          loading={loading}
          total={stats.total}
          topics={stats.topics}
          counts={stats.counts}
          isFetching={isFetching}
          onRefresh={() => refetch()}
        />

        <div className="mx-auto max-w-6xl px-4 pt-10">
          <Toolbar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            counts={stats.counts}
            totalMatched={filtered.length}
            totalAll={stats.total}
          />

          <div className="mb-6">
            <CategoryPills
              categories={[...materialCategoryPills]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              getCategoryLabel={formatLmsCourseCategoryLabel}
              hideWhenEmpty={false}
            />
          </div>

          {loading ? (
            <GridSkeleton viewMode={viewMode} />
          ) : filtered.length === 0 ? (
            <EmptyState
              hasFilters={hasActiveFilters}
              onClearFilters={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setSelectedCategory(ALL_CATEGORY);
              }}
              onRefresh={() => refetch()}
              loading={loading || isFetching}
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => (
                <MaterialGridCard
                  key={m._id}
                  material={m}
                  onView={() => openMaterial(m)}
                />
              ))}
            </div>
          ) : (
            <MaterialTable
              rows={filtered}
              onView={(m) => openMaterial(m)}
            />
          )}
        </div>

        <ProtectedMediaModal
          open={protectedMedia.state.open}
          onOpenChange={protectedMedia.setOpen}
          url={protectedMedia.state.url}
          title={protectedMedia.state.title}
          subtitle={protectedMedia.state.subtitle}
          kind={protectedMedia.state.kind}
          loading={protectedMedia.state.loading}
          viewer={viewer}
        />
      </div>
    </TooltipProvider>
  );
}

// ---------- Hero ----------

function HeroSection({
  loading,
  total,
  topics,
  counts,
  isFetching,
  onRefresh,
}: {
  loading: boolean;
  total: number;
  topics: number;
  counts: Record<StudentMaterial["type"], number>;
  isFetching: boolean;
  onRefresh: () => void;
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
      <div className="relative mx-auto max-w-5xl px-4 py-12 md:py-16 md:text-center">
        <Badge
          variant="secondary"
          className="mb-4 rounded-full px-3 py-1 text-xs font-medium"
        >
          <Sparkles className="mr-1 inline h-3.5 w-3.5" />
          Student hub
        </Badge>
        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
          Material Library
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-muted-foreground md:text-base">
          Access books, guides, and presentations to boost your computer
          science journey. Files open in a watermarked viewer — downloads and
          sharing are disabled.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-primary/25 bg-background/60 backdrop-blur"
            onClick={onRefresh}
            disabled={loading || isFetching}
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 text-center sm:grid-cols-4 md:gap-4">
          <StatPill
            label="Materials"
            value={loading ? null : total}
            accent="text-foreground"
          />
          <StatPill
            label="Books"
            value={loading ? null : counts.book}
            accent="text-sky-600 dark:text-sky-400"
          />
          <StatPill
            label="Visual"
            value={loading ? null : counts["visual-guide"]}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatPill
            label="Slides"
            value={loading ? null : counts.presentation}
            accent="text-orange-600 dark:text-orange-400"
          />
        </div>
      </div>
    </section>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | null;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
      <div className={cn("text-3xl font-semibold tabular-nums", accent)}>
        {value == null ? (
          <div className="mx-auto h-7 w-12 animate-pulse rounded bg-muted" />
        ) : (
          value
        )}
      </div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground md:text-xs">
        {label}
      </div>
    </div>
  );
}

// ---------- Toolbar ----------

function Toolbar({
  searchQuery,
  onSearchQueryChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  counts,
  totalMatched,
  totalAll,
}: {
  searchQuery: string;
  onSearchQueryChange: (next: string) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (next: TypeFilter) => void;
  sortBy: SortKey;
  onSortByChange: (next: SortKey) => void;
  viewMode: ViewMode;
  onViewModeChange: (next: ViewMode) => void;
  counts: Record<StudentMaterial["type"], number>;
  totalMatched: number;
  totalAll: number;
}) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search materials by title, author, category…"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full rounded-xl border bg-card py-2.5 pl-10 pr-9 text-sm shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(v) => onSortByChange(v as SortKey)}
          >
            <SelectTrigger className="h-9 w-[160px] rounded-xl bg-card text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="title-az">Title A → Z</SelectItem>
              <SelectItem value="title-za">Title Z → A</SelectItem>
            </SelectContent>
          </Select>

          <div
            className="flex items-center rounded-xl border bg-card p-0.5"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "flex h-8 items-center gap-1 rounded-lg px-2 text-xs transition",
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-active={viewMode === "grid" ? "true" : "false"}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "flex h-8 items-center gap-1 rounded-lg px-2 text-xs transition",
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-active={viewMode === "list" ? "true" : "false"}
            >
              <Rows3 className="h-3.5 w-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TypePill
          label="All"
          count={totalAll}
          selected={typeFilter === "all"}
          onClick={() => onTypeFilterChange("all")}
        />
        <TypePill
          icon={<BookOpen className="h-3 w-3" />}
          label="Books"
          count={counts.book}
          selected={typeFilter === "book"}
          onClick={() => onTypeFilterChange("book")}
          tint="sky"
        />
        <TypePill
          icon={<ImageIcon className="h-3 w-3" />}
          label="Visual guides"
          count={counts["visual-guide"]}
          selected={typeFilter === "visual-guide"}
          onClick={() => onTypeFilterChange("visual-guide")}
          tint="emerald"
        />
        <TypePill
          icon={<Presentation className="h-3 w-3" />}
          label="Presentations"
          count={counts.presentation}
          selected={typeFilter === "presentation"}
          onClick={() => onTypeFilterChange("presentation")}
          tint="orange"
        />
        <span className="ml-auto text-xs text-muted-foreground">
          Showing {totalMatched} of {totalAll}
        </span>
      </div>
    </div>
  );
}

function TypePill({
  icon,
  label,
  count,
  selected,
  onClick,
  tint,
}: {
  icon?: React.ReactNode;
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
  tint?: "sky" | "emerald" | "orange";
}) {
  const tintClass =
    tint === "sky"
      ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
      : tint === "emerald"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : tint === "orange"
          ? "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300"
          : "border-border bg-card text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
        selected
          ? tintClass + " ring-2 ring-offset-1 ring-offset-background"
          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0 text-[10px] font-semibold",
          selected ? "bg-background/40" : "bg-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ---------- Cards / Table ----------

function MaterialGridCard({
  material,
  onView,
}: {
  material: StudentMaterial;
  onView: () => void;
}) {
  const meta = TYPE_META[material.type];
  const Icon = meta.icon;
  const hasFile = !!material.fileAssetId || !!material.fileUrl;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl">
      <div className={cn("h-24 bg-linear-to-br", meta.accent)} aria-hidden>
        <div className="flex h-full items-end justify-between p-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl border bg-card/80 shadow-sm backdrop-blur",
              meta.chip,
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            <Shield className="h-3 w-3" />
            Protected
          </span>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="line-clamp-2 text-base font-semibold">{material.title}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            {meta.label}
          </p>
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {material.description || "No description provided."}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {material.category ? (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {material.category.replace(/_/g, " ")}
            </Badge>
          ) : null}
          {material.level ? (
            <Badge variant="outline" className="text-[10px] font-normal">
              {material.level}
            </Badge>
          ) : null}
          {material.author ? (
            <Badge variant="outline" className="text-[10px] font-normal">
              {material.author}
            </Badge>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {material.viewCount} views
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-full"
              onClick={onView}
              disabled={!hasFile}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              {hasFile ? "Open material" : "Not available"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasFile
              ? "Opens in protected viewer — downloads disabled"
              : "Waiting for instructor to upload the file"}
          </TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}

function MaterialTable({
  rows,
  onView,
}: {
  rows: StudentMaterial[];
  onView: (m: StudentMaterial) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Type</th>
            <th className="hidden px-4 py-3 md:table-cell">Category</th>
            <th className="hidden px-4 py-3 lg:table-cell">Author</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((m) => {
            const meta = TYPE_META[m.type];
            const Icon = meta.icon;
            const hasFile = !!m.fileAssetId || !!m.fileUrl;
            return (
              <tr key={m._id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg border",
                        meta.chip,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-medium">{m.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {m.description || "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[10px]">
                    {meta.label}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {m.category ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-normal"
                    >
                      {m.category.replace(/_/g, " ")}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                  {m.author || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => onView(m)}
                        disabled={!hasFile}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Open
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {hasFile
                        ? "Opens in protected viewer"
                        : "No file available"}
                    </TooltipContent>
                  </Tooltip>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GridSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              </div>
              <div className="hidden h-4 w-20 animate-pulse rounded bg-muted md:block" />
              <div className="hidden h-4 w-16 animate-pulse rounded bg-muted lg:block" />
              <div className="h-7 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="h-24 animate-pulse bg-muted" />
          <CardContent className="space-y-3 p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-9 w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
  onRefresh,
  loading,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/60 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Library className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">
        {hasFilters ? "No materials match your filters" : "No materials yet"}
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        {hasFilters
          ? "Try clearing your search and filters to see more results."
          : "Materials will appear here once instructors add them to the library."}
      </p>
      <div className="mt-2 flex gap-2">
        {hasFilters ? (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X className="mr-1 h-3.5 w-3.5" />
            Clear filters
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCcw className="mr-1 h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <HelpCircle className="h-3 w-3" />
        Tip: instructors can mark materials as private — those only show up
        inside the course.
      </p>
    </div>
  );
}
