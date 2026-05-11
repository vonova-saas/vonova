"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Book,
  BookOpen,
  Edit,
  Eye,
  FileText,
  HelpCircle,
  ImageIcon,
  LayoutGrid,
  Library,
  Loader2,
  Plus,
  Presentation,
  RefreshCcw,
  Rows3,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  fetchLibraryItemsQueryFn,
  createLibraryBookMutationFn,
  uploadLibraryFileMutationFn,
  deleteMaterialMutationFn,
  updateLibraryMaterialMutationFn,
  extractLibraryCatalogTotal,
} from "@/services/api/shared/material-library/material.api";
import type { CreateMaterialRequest } from "@/types/api/shared/material-library/material.type";
import { toast } from "@/hooks/app/use-toast";
import { useAuthContext, useAuthContextOptional } from "@/context/app/auth/auth-context";
import { lmsCourseCategories } from "@/lib/courses/zodSchema";
import { cn } from "@/lib/utils";
import { ProtectedMediaModal } from "@/components/shared/protected-media/protected-media-modal";
import { useProtectedMediaViewer } from "@/components/shared/protected-media/use-protected-media-viewer";

// ---------- Types ----------

interface Material {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  summary?: string;
  /** Hint for GET .../materials/:id/view */
  viewType: "book" | "guide" | "presentation";
  type: "book" | "visual-guide" | "presentation";
  topics: string[];
  fileUrl?: string;
  thumbnailUrl?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  status: "PUBLISHED" | "DRAFT";
  visibility?: "PUBLIC" | "PRIVATE";
  downloadCount: number;
  viewCount: number;
  category?: string;
  level?: string;
  fileAssetId?: { urls: { streamUrl?: string } } | null;
}

type SortKey = "newest" | "oldest" | "title-az" | "title-za";
type TypeFilter = "all" | "book" | "visual-guide" | "presentation";
type ViewMode = "grid" | "list";

const STATIC_TOPICS = [
  { value: "programming-basics", label: "Programming Basics" },
  { value: "web-development", label: "Web Development" },
  { value: "data-science", label: "Data Science" },
];

const TYPE_META: Record<
  Material["type"],
  { label: string; icon: typeof Book; accent: string; chip: string }
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

// ---------- Page ----------

export default function MaterialLibraryManagementPage() {
  const { user } = useAuthContext();
  const authOptional = useAuthContextOptional();
  const currentAuthorName = user?.name?.trim() || "Unknown Instructor";

  const queryClient = useQueryClient();
  const protectedMedia = useProtectedMediaViewer();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // ---------- Data ----------
  const { data: catalogData, isLoading: loading } = useQuery<{
    materials: Material[];
    serverTotal?: number;
  }>({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await fetchLibraryItemsQueryFn();
      let items: any[] = [];
      if (Array.isArray(res)) items = res;
      else if (Array.isArray(res?.data)) items = res.data;
      else if (res?.data && typeof res.data === "object") {
        items = [
          ...(Array.isArray(res.data.books) ? res.data.books : []),
          ...(Array.isArray(res.data.guides) ? res.data.guides : []),
          ...(Array.isArray(res.data.presentations) ? res.data.presentations : []),
          ...(Array.isArray(res.data.uploads) ? res.data.uploads : []),
        ];
      } else if (Array.isArray(res?.items)) items = res.items;
      else if (Array.isArray(res?.materials)) items = res.materials;

      const materials = items.map((item: any) => {
        const rawType = String(item.type || "book").toLowerCase();
        const normType: Material["type"] =
          rawType === "presentation" || rawType === "presentations"
            ? "presentation"
            : rawType === "guide" ||
                rawType === "guides" ||
                rawType === "visual-guide"
              ? "visual-guide"
              : "book";
        const viewType: Material["viewType"] =
          normType === "presentation"
            ? "presentation"
            : normType === "visual-guide"
              ? "guide"
              : "book";
        return {
          _id: item._id || item.id,
          id: item._id || item.id,
          title: item.title ?? "Untitled",
          summary: item.summary,
          description: item.description,
          viewType,
          type: normType,
          topics: Array.isArray(item.topics) ? item.topics : [],
          fileUrl: item.fileUrl || item.contentUrl || item.presignedUrl,
          fileAssetId: item.fileAssetId ?? null,
          author:
            item.author ||
            (Array.isArray(item.authors)
              ? item.authors.map((a: any) => a?.name).filter(Boolean).join(", ")
              : undefined),
          status: (item.status as Material["status"]) || "PUBLISHED",
          visibility: item.visibility,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          downloadCount: Number(item.downloadCount ?? 0),
          viewCount: Number(item.viewCount ?? 0),
          category: item.category,
          level: item.level,
        } satisfies Material;
      });
      return {
        materials,
        serverTotal: extractLibraryCatalogTotal(res),
      };
    },
  });

  const materials = catalogData?.materials ?? [];

  // ---------- Derived ----------
  const stats = useMemo(() => {
    const counts: Record<Material["type"], number> = {
      book: 0,
      "visual-guide": 0,
      presentation: 0,
    };
    let publishedCount = 0;
    for (const m of materials) {
      counts[m.type] = (counts[m.type] ?? 0) + 1;
      if (m.status === "PUBLISHED") publishedCount += 1;
    }
    return {
      total: catalogData?.serverTotal ?? materials.length,
      published: publishedCount,
      drafts: materials.length - publishedCount,
      counts,
    };
  }, [materials, catalogData?.serverTotal]);

  const filtered = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    let rows = materials.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (!needle) return true;
      const hay = [m.title, m.summary, m.description, m.author, m.category]
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
  }, [materials, searchQuery, sortBy, typeFilter]);

  // ---------- Mutations ----------
  const createMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        title: data.title || "Untitled",
        description: data.description,
        type: data.type || "book",
        authors: [{ name: currentAuthorName }],
        topicId: data.topicId,
        topics: data.topics || [],
        level: data.level || "Beginner",
        category: data.category,
        isPublished: data.isPublished,
      };
      const createResponse = await createLibraryBookMutationFn(payload);
      const itemId =
        createResponse.material?.id || createResponse.material?._id;
      if (!itemId) {
        throw new Error("Failed to create material - no ID returned");
      }
      if (data.file) {
        const itemType =
          data.type === "visual-guide"
            ? "guide"
            : data.type === "presentation"
              ? "presentation"
              : "book";
        await uploadLibraryFileMutationFn(itemType, itemId, data.file);
      }
    },
    onSuccess: () => {
      toast({
        title: "Created successfully",
        description: "Material has been added.",
      });
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (error) => {
      console.error("Failed to add material:", error);
      toast({
        title: "Error",
        description: "Failed to add material. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddMaterial = (data: any) => {
    createMaterialMutation.mutate(data);
  };

  const handleFileUpload = (file: File, materialData: any) => {
    createMaterialMutation.mutate({ ...materialData, file });
  };

  const updateMaterialMutation = useMutation({
    mutationFn: async (vars: {
      materialId: string;
      viewType: Material["viewType"];
      patch: Parameters<typeof updateLibraryMaterialMutationFn>[0]["patch"];
    }) => {
      return updateLibraryMaterialMutationFn(vars);
    },
    onSuccess: () => {
      toast({
        title: "Material Updated Successfully",
        description: "Material has been updated.",
      });
      setEditingMaterial(null);
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (error) => {
      console.error("Failed to update material:", error);
      const message =
        error instanceof Error
          ? error.message
          : "There was an error saving your changes.";
      toast({
        title: "Failed to Update Material",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleEditMaterialWrapper = async (data: CreateMaterialRequest) => {
    if (!editingMaterial) return;
    updateMaterialMutation.mutate({
      materialId: editingMaterial._id,
      viewType: editingMaterial.viewType,
      patch: {
        title: data.title?.trim(),
        description: data.description,
        category: data.category,
        level: data.level,
        topicId: data.topicId || undefined,
        isPublished: data.isPublished,
      },
    });
  };

  const handleDeleteMaterial = async (id: string, type?: string) => {
    try {
      await deleteMaterialMutationFn(id, type);
      toast({
        title: "Material Deleted Successfully",
        description: "Material has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    } catch {
      toast({
        title: "Failed to Delete Material",
        description: "There was an error deleting.",
        variant: "destructive",
      });
    }
  };

  const openMaterial = (material: Material) => {
    protectedMedia.openMaterial({
      materialId: material._id,
      materialType: material.viewType,
      title: material.title,
      subtitle:
        [TYPE_META[material.type].label, material.category, material.level]
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

  // ---------- Render ----------
  return (
    <TooltipProvider>
      <div className="min-h-full w-full pb-16">
        <HeroSection
          loading={loading}
          stats={stats}
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["materials"] })
          }
          onCreateClicked={() => setIsAddModalOpen(true)}
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

          {loading ? (
            <GridSkeleton viewMode={viewMode} />
          ) : filtered.length === 0 ? (
            <EmptyState
              hasFilters={searchQuery.length > 0 || typeFilter !== "all"}
              onClearFilters={() => {
                setSearchQuery("");
                setTypeFilter("all");
              }}
              onCreate={() => setIsAddModalOpen(true)}
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => (
                <MaterialGridCard
                  key={m._id}
                  material={m}
                  onView={() => openMaterial(m)}
                  onEdit={() => setEditingMaterial(m)}
                  onDelete={() => handleDeleteMaterial(m._id, m.type)}
                />
              ))}
              <CreateNewCard onClick={() => setIsAddModalOpen(true)} />
            </div>
          ) : (
            <MaterialTable
              rows={filtered}
              onView={(m) => openMaterial(m)}
              onEdit={(m) => setEditingMaterial(m)}
              onDelete={(m) => handleDeleteMaterial(m._id, m.type)}
            />
          )}
        </div>

        {/* Create modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add new material</DialogTitle>
              <DialogDescription>
                Upload a book, slide deck, or visual guide. You can change
                visibility after creation.
              </DialogDescription>
            </DialogHeader>
            <AddMaterialForm
              onSubmit={handleAddMaterial}
              onFileUpload={handleFileUpload}
              onCancel={() => setIsAddModalOpen(false)}
              isSubmitting={createMaterialMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit modal */}
        <Dialog
          open={!!editingMaterial}
          onOpenChange={(open) => !open && setEditingMaterial(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit material</DialogTitle>
              <DialogDescription>
                Update the material information.
              </DialogDescription>
            </DialogHeader>
            {editingMaterial && (
              <AddMaterialForm
                onSubmit={handleEditMaterialWrapper}
                onFileUpload={handleFileUpload}
                onCancel={() => setEditingMaterial(null)}
                initialData={editingMaterial}
                isSubmitting={updateMaterialMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

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
  stats,
  onRefresh,
  onCreateClicked,
}: {
  loading: boolean;
  stats: {
    total: number;
    published: number;
    drafts: number;
    counts: Record<Material["type"], number>;
  };
  onRefresh: () => void;
  onCreateClicked: () => void;
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
        <div className="absolute right-4 top-4 z-20">
          <HelpButton />
        </div>

        <Badge
          variant="secondary"
          className="mb-4 rounded-full px-3 py-1 text-xs font-medium"
        >
          <Sparkles className="mr-1 inline h-3.5 w-3.5" />
          Instructor hub
        </Badge>
        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
          Material Library Management
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-muted-foreground md:text-base">
          Curate the books, slide decks, and visual guides your students see.
          Files open in a watermarked viewer — downloads and external sharing
          are blocked.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-primary/25 bg-background/60 backdrop-blur"
            onClick={onRefresh}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="lg"
            className="rounded-full bg-linear-to-r from-primary to-primary/90 px-6 shadow-lg transition-all duration-200 hover:from-primary/90 hover:to-primary hover:shadow-xl"
            onClick={onCreateClicked}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add material
          </Button>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 text-center sm:grid-cols-4 md:gap-4">
          <StatPill
            label="Materials"
            value={loading ? null : stats.total}
            accent="text-foreground"
          />
          <StatPill
            label="Published"
            value={loading ? null : stats.published}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatPill
            label="Drafts"
            value={loading ? null : stats.drafts}
            accent="text-amber-600 dark:text-amber-400"
          />
          <StatPill
            label="Types"
            value={
              loading
                ? null
                : Object.values(stats.counts).filter((n) => n > 0).length
            }
            accent="text-sky-600 dark:text-sky-400"
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

function HelpButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          aria-label="Need help?"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Material Library Management</DialogTitle>
          <DialogDescription asChild>
            <div>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
                <li>
                  <b>Add:</b> Use “Add material” to create a new book, guide,
                  or presentation. Attach a file or upload one later.
                </li>
                <li>
                  <b>View:</b> Files open in a protected viewer (no download,
                  no print, watermarked).
                </li>
                <li>
                  <b>Visibility:</b> Toggle PUBLIC / PRIVATE from the lesson
                  editor. PRIVATE = course-only.
                </li>
                <li>
                  <b>Search & sort:</b> Filter by type, search by title, then
                  switch grid / list as needed.
                </li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button variant="outline" className="mt-4 w-full">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
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
  counts: Record<Material["type"], number>;
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
          <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortKey)}>
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
  onEdit,
  onDelete,
}: {
  material: Material;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[material.type];
  const Icon = meta.icon;
  const hasFile = !!material.fileAssetId || !!material.fileUrl;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl">
      <div
        className={cn(
          "h-24 bg-linear-to-br",
          meta.accent,
        )}
        aria-hidden
      >
        <div className="flex h-full items-end justify-between p-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl border bg-card/80 shadow-sm backdrop-blur",
              meta.chip,
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                material.status === "PUBLISHED"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
              )}
            >
              {material.status === "PUBLISHED" ? "Published" : "Draft"}
            </span>
            {material.visibility ? (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  material.visibility === "PRIVATE"
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                    : "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                )}
              >
                {material.visibility === "PRIVATE" ? "Private" : "Public"}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="line-clamp-2 text-base font-semibold">{material.title}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            {meta.label}
          </p>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {material.summary ||
            material.description ||
            "No description provided."}
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
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" /> {material.viewCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Upload className="h-3 w-3" /> {material.downloadCount}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px]">
            <Shield className="h-3 w-3" />
            Protected
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={onView}
                disabled={!hasFile}
              >
                <Eye className="mr-1 h-3.5 w-3.5" />
                View
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {hasFile
                ? "Open in protected viewer"
                : "Upload a file first"}
            </TooltipContent>
          </Tooltip>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onEdit}
          >
            <Edit className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MaterialTable({
  rows,
  onView,
  onEdit,
  onDelete,
}: {
  rows: Material[];
  onView: (m: Material) => void;
  onEdit: (m: Material) => void;
  onDelete: (m: Material) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Type</th>
            <th className="hidden px-4 py-3 md:table-cell">Category</th>
            <th className="hidden px-4 py-3 md:table-cell">Status</th>
            <th className="hidden px-4 py-3 lg:table-cell">Author</th>
            <th className="px-4 py-3 text-right">Actions</th>
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
                        {m.summary || m.description || "—"}
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
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {m.category.replace(/_/g, " ")}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      m.status === "PUBLISHED"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {m.status === "PUBLISHED" ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                  {m.author || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => onView(m)}
                          disabled={!hasFile}
                          aria-label="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {hasFile ? "Open in protected viewer" : "No file"}
                      </TooltipContent>
                    </Tooltip>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => onEdit(m)}
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(m)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CreateNewCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-primary/25 bg-muted/20 p-6 text-center transition-all hover:border-primary/50 hover:bg-muted/30"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
        <Plus className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-base font-semibold">Add new material</h3>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Create a new book, presentation, or visual guide for your students.
      </p>
      <Button variant="outline" size="sm" className="mt-3" type="button">
        <Plus className="mr-1 h-3.5 w-3.5" />
        Create
      </Button>
    </Card>
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
              <div className="hidden h-4 w-16 animate-pulse rounded bg-muted md:block" />
              <div className="h-7 w-24 animate-pulse rounded bg-muted" />
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
  onCreate,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreate: () => void;
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
          ? "Try clearing your search and filters, or create a new material."
          : "Get started by uploading a book, presentation, or visual guide for your students."}
      </p>
      <div className="mt-2 flex gap-2">
        {hasFilters ? (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X className="mr-1 h-3.5 w-3.5" />
            Clear filters
          </Button>
        ) : null}
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Create material
        </Button>
      </div>
    </div>
  );
}

// ---------- Form ----------

function AddMaterialForm({
  onSubmit,
  onFileUpload,
  onCancel,
  initialData,
  isSubmitting,
}: {
  onSubmit: (data: CreateMaterialRequest) => void;
  onFileUpload: (file: File, data: Omit<CreateMaterialRequest, "file">) => void;
  onCancel: () => void;
  initialData?: Material;
  isSubmitting?: boolean;
}) {
  const [formData, setFormData] = useState<CreateMaterialRequest>({
    title: "",
    description: "",
    type: "book",
    tags: [],
    category: "OTHER",
    level: "Beginner",
    isPublic: false,
    topicId: "",
    isPublished: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || "",
        type: initialData.type,
        tags: [],
        category: initialData.category || "OTHER",
        level:
          (initialData.level as CreateMaterialRequest["level"]) || "Beginner",
        isPublic: false,
        topicId: initialData.topics?.[0] || "",
        isPublished: initialData.status === "PUBLISHED",
      });
    }
  }, [initialData]);

  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onFileUpload(file, formData);
    } else {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="add-material-title"
          className="mb-1 block text-sm font-medium"
        >
          Title
        </label>
        <input
          id="add-material-title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Material title"
          required
        />
      </div>

      <div>
        <label
          htmlFor="add-material-description"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>
        <textarea
          id="add-material-description"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Describe this material for students"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="add-material-type"
            className="mb-1 block text-sm font-medium"
          >
            Type
          </label>
          <select
            id="add-material-type"
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as Material["type"],
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="book">Book / PDF</option>
            <option value="visual-guide">Visual guide</option>
            <option value="presentation">Presentation</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="add-material-topic"
            className="mb-1 block text-sm font-medium"
          >
            Topic
          </label>
          <select
            id="add-material-topic"
            value={formData.topicId}
            onChange={(e) =>
              setFormData({ ...formData, topicId: e.target.value })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {STATIC_TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="add-material-category"
            className="mb-1 block text-sm font-medium"
          >
            Category
          </label>
          <select
            id="add-material-category"
            value={formData.category || "OTHER"}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {lmsCourseCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="add-material-level"
            className="mb-1 block text-sm font-medium"
          >
            Level
          </label>
          <select
            id="add-material-level"
            value={formData.level || "Beginner"}
            onChange={(e) =>
              setFormData({
                ...formData,
                level: e.target.value as CreateMaterialRequest["level"],
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="add-material-file"
          className="mb-1 block text-sm font-medium"
        >
          File{!!initialData ? " (cannot be changed)" : " (optional)"}
        </label>
        <input
          id="add-material-file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={!!initialData}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        {!!initialData ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Files can&apos;t be replaced after upload. Delete and re-create the
            material to change the file.
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
        <div>
          <p className="text-sm font-medium">Publish to students</p>
          <p className="text-xs text-muted-foreground">
            Off = saved as draft. Only you can see it.
          </p>
        </div>
        <Switch
          checked={formData.isPublished}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isPublished: checked })
          }
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1" disabled={!!isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : initialData ? (
            "Save changes"
          ) : (
            "Add material"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Suppress unused-import warning for FileText (kept for compat with prior signature)
void FileText;
