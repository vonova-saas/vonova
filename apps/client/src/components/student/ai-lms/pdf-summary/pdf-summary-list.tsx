"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  LayoutGrid,
  Loader2,
  Rows3,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { PDFFile } from "./types";
import PDFSummaryCard from "./pdf-summary-card";
import useStudentId from "@/hooks/student/use-student-id";
import {
  getChatHistoryQueryFn,
  getSessionsQueryFn,
  uploadPDFMutationFn,
} from "@/services/student/lms-ai/pdf-summary/pdf.api";
import { GetSessionsResponse } from "@/types/api/student/lms-ai/pdf-summary/pdf.type";
import { parseUsageLimitError } from "@/utils/functions/app/usage-limit-error";
import { cn } from "@/lib/utils";

interface PDFSummaryListProps {
  pdfs?: PDFFile[];
  onChat?: (pdfId: string) => void;
  onDelete?: (pdfId: string) => void;
  onDownload?: (pdfId: string) => void;
  onRename?: (pdfId: string, newName: string) => void;
  onUpload?: () => void;
}

type SortKey = "newest" | "oldest" | "name-az" | "name-za" | "largest";
type StatusFilter = "All" | "ready" | "processing" | "uploading" | "error";

const MAX_PDF_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_UPLOAD_SIZE_LABEL = "10MB";

const statusMeta: Record<
  Exclude<StatusFilter, "All">,
  { label: string; tint: string }
> = {
  ready: {
    label: "Ready",
    tint:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  processing: {
    label: "Processing",
    tint:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  uploading: {
    label: "Uploading",
    tint:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  error: {
    label: "Error",
    tint:
      "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
};

export default function PDFSummaryList({
  pdfs: propPdfs = [],
  onChat,
  onDelete = (pdfId: string) => {
    console.log("Delete PDF:", pdfId);
  },
  onDownload: onDownloadProp,
  onRename = (pdfId: string, newName: string) => {
    console.log("Rename PDF:", pdfId, "to", newName);
  },
  onUpload,
}: PDFSummaryListProps) {
  const router = useRouter();
  const currentStudentId = useStudentId();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSessions, setLocalSessions] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<any[]>([]);

  const handleUpload =
    onUpload ||
    (() => {
      setShowUploadModal(true);
    });

  // ---------- Upload ----------
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const pdfFiles = acceptedFiles.filter(
        (file) => file.type === "application/pdf",
      );
      if (pdfFiles.length > 0) {
        handleFileUpload(pdfFiles);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStudentId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_PDF_UPLOAD_SIZE_BYTES,
    multiple: true,
    onDropRejected: () => {
      toast.error("Upload rejected", {
        description: `File too large for server limits (max ${MAX_PDF_UPLOAD_SIZE_LABEL}).`,
      });
    },
  });

  const handleCancelUpload = (fileId: string) => {
    setUploadProgress((prev) => prev.filter((p) => p.fileId !== fileId));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "complete":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleFileUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (file.size > MAX_PDF_UPLOAD_SIZE_BYTES) {
      toast.error("File size exceeds 10MB limit", {
        description: `Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB, which exceeds the 10MB limit.`,
      });
      return;
    }

    const fileId = `${file.name}-${Date.now()}`;
    setUploadProgress([
      {
        fileId,
        fileName: file.name,
        progress: 20,
        status: "uploading",
        error: null,
      },
    ]);

    try {
      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileId === fileId ? { ...p, progress: 60 } : p,
        ),
      );

      const response = await uploadPDFMutationFn({ file });

      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileId === fileId
            ? { ...p, progress: 100, status: "complete" }
            : p,
        ),
      );

      setShowUploadModal(false);
      setUploadProgress([]);

      const existingSessions = JSON.parse(
        localStorage.getItem("pdf_sessions") || "[]",
      );
      existingSessions.unshift({
        session_id: response.session_id,
        file_name: file.name,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(
        "pdf_sessions",
        JSON.stringify(existingSessions.slice(0, 10)),
      );
    } catch (err) {
      console.error("Upload failed:", err);
      const parsed = parseUsageLimitError(err);
      toast.error(parsed.title, {
        description: parsed.description,
        duration: 7000,
      });
      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileId === fileId
            ? { ...p, status: "error", error: parsed.description }
            : p,
        ),
      );
    }
  };

  // ---------- Chat / navigation ----------
  const handleChat =
    onChat ||
    ((pdfId: string) => {
      router.push(`/student/${currentStudentId}/pdf-summary/${pdfId}`);
    });

  // ---------- Data ----------
  const { data: sessionsData, isLoading } = useQuery<GetSessionsResponse>({
    queryKey: ["pdf-sessions"],
    queryFn: getSessionsQueryFn,
    enabled: !!currentStudentId,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = JSON.parse(localStorage.getItem("pdf_sessions") || "[]");
      setLocalSessions(stored);
    } catch (err) {
      console.error("Failed to read localStorage sessions:", err);
      setLocalSessions([]);
    }
  }, []);

  const pdfs = useMemo<PDFFile[]>(() => {
    if (propPdfs && propPdfs.length > 0) return propPdfs;

    let sessions: any[] = [];
    const apiSessions = Array.isArray((sessionsData as any)?.data)
      ? (sessionsData as any).data
      : Array.isArray(sessionsData)
        ? (sessionsData as any)
        : [];

    if (apiSessions.length > 0) {
      sessions = apiSessions;
    } else if (localSessions.length > 0) {
      sessions = localSessions.map((s: any) => ({
        session_id: s.session_id,
        file_name: s.file_name || s.filename,
        file_size: s.file_size ?? s.fileSize ?? s.size ?? 0,
        page_count: s.page_count ?? s.pages ?? s.pageCount ?? 0,
        created_at: s.created_at,
        status: s.status || "ready",
      }));
    }

    return sessions.map((session: any) => ({
      id: session.session_id,
      name: session.file_name || session.filename || "PDF Document",
      size:
        Number(
          session.file_size ?? session.fileSize ?? session.size ?? 0,
        ) || 0,
      uploadedAt: new Date(session.created_at),
      status: session.status || "ready",
      pages:
        Number(
          session.pages ?? session.page_count ?? session.pageCount ?? 0,
        ) || 0,
      topics: [],
      lastAccessed: new Date(session.created_at),
    }));
  }, [propPdfs, sessionsData, localSessions]);

  const internalDownloadChatPdf = async (sessionId: string) => {
    try {
      const historyData = await getChatHistoryQueryFn(sessionId);
      const hd: any = historyData as any;

      let records: any[] = [];
      if (hd?.messages && Array.isArray(hd.messages)) records = hd.messages;
      else if (hd?.data?.messages && Array.isArray(hd.data.messages))
        records = hd.data.messages;
      else if (hd?.data?.chats && Array.isArray(hd.data.chats))
        records = hd.data.chats;

      const normalizeText = (value: any) => {
        if (typeof value === "string") return value;
        if (value == null) return "";
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };

      const lines: string[] = [];
      records.forEach((r: any) => {
        const role = r?.role || r?.sender || r?.from;
        if (role === "user" || role === "assistant") {
          const content = normalizeText(
            r?.content ?? r?.message ?? r?.text ?? r?.value ?? "",
          ).trim();
          if (!content) return;
          const label = role === "user" ? "You" : "AI";
          lines.push(`${label}: ${content}`);
          return;
        }
        const q = normalizeText(
          r?.question ?? r?.prompt ?? r?.user_question ?? r?.q,
        ).trim();
        const a = normalizeText(
          r?.answer ?? r?.response ?? r?.assistant_answer ?? r?.a,
        ).trim();
        if (q) lines.push(`You: ${q}`);
        if (a) lines.push(`AI: ${a}`);
      });

      const session = pdfs.find((p) => p.id === sessionId);
      const fileNameBase = (session?.name || sessionId).replace(
        /[\\/:*?"<>|]+/g,
        "_",
      );
      const generatedAt = new Date().toLocaleString();

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - margin * 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`Chat History`, margin, 64);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Session: ${sessionId}`, margin, 84);
      doc.text(`Generated: ${generatedAt}`, margin, 100);

      doc.setFontSize(11);
      let y = 132;
      const lineHeight = 16;
      const bottom = doc.internal.pageSize.getHeight() - margin;

      const safeLines = lines.length
        ? lines
        : ["No chat messages found for this session."];
      safeLines.forEach((l) => {
        const wrapped = doc.splitTextToSize(l, maxWidth);
        wrapped.forEach((w: string) => {
          if (y > bottom) {
            doc.addPage();
            y = margin;
          }
          doc.text(w, margin, y);
          y += lineHeight;
        });
        y += 6;
      });

      doc.save(`${fileNameBase}-chat.pdf`);
    } catch (err) {
      console.error("Failed to download chat history PDF:", err);
      toast.error("Failed to download chat history. Please try again.");
    }
  };

  const onDownload = onDownloadProp ?? internalDownloadChatPdf;

  // ---------- Derived ----------
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    pdfs.forEach((pdf) => pdf.topics.forEach((topic) => topics.add(topic)));
    return Array.from(topics).sort();
  }, [pdfs]);

  const stats = useMemo(() => {
    const total = pdfs.length;
    const ready = pdfs.filter((p) => p.status === "ready").length;
    const processing = pdfs.filter((p) => p.status === "processing").length;
    const totalSize = pdfs.reduce((sum, p) => sum + (p.size || 0), 0);
    return { total, ready, processing, totalSize };
  }, [pdfs]);

  const filteredPDFs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let rows = pdfs.filter((pdf) => {
      if (statusFilter !== "All" && pdf.status !== statusFilter) return false;
      if (topicFilter !== "All" && !pdf.topics.includes(topicFilter))
        return false;
      if (!needle) return true;
      return pdf.name.toLowerCase().includes(needle);
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.uploadedAt).getTime() -
            new Date(b.uploadedAt).getTime()
          );
        case "name-az":
          return a.name.localeCompare(b.name);
        case "name-za":
          return b.name.localeCompare(a.name);
        case "largest":
          return (b.size || 0) - (a.size || 0);
        case "newest":
        default:
          return (
            new Date(b.uploadedAt).getTime() -
            new Date(a.uploadedAt).getTime()
          );
      }
    });
    return rows;
  }, [pdfs, search, statusFilter, topicFilter, sortBy]);

  const formatTotalSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(
      sizes.length - 1,
      Math.floor(Math.log(bytes) / Math.log(k)),
    );
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const hasActiveFilters =
    search.length > 0 || statusFilter !== "All" || topicFilter !== "All";

  // ---------- Render ----------
  return (
    <div className="w-full">
      <HeroSection
        loading={isLoading}
        total={stats.total}
        ready={stats.ready}
        processing={stats.processing}
        totalSize={formatTotalSize(stats.totalSize)}
        onUpload={handleUpload}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
        <Toolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          topicFilter={topicFilter}
          onTopicFilterChange={setTopicFilter}
          topics={allTopics}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalMatched={filteredPDFs.length}
          totalAll={stats.total}
        />

        {isLoading ? (
          <LoadingState viewMode={viewMode} />
        ) : filteredPDFs.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClearFilters={() => {
              setSearch("");
              setStatusFilter("All");
              setTopicFilter("All");
            }}
            onUpload={handleUpload}
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPDFs.map((pdf) => (
              <PDFSummaryCard
                key={pdf.id}
                pdf={pdf}
                onChat={handleChat}
                onDelete={onDelete}
                onDownload={onDownload}
                onRename={onRename}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPDFs.map((pdf) => (
              <PDFSummaryCard
                key={pdf.id}
                pdf={pdf}
                onChat={handleChat}
                onDelete={onDelete}
                onDownload={onDownload}
                onRename={onRename}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload PDF files
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card
              {...getRootProps()}
              className={cn(
                "cursor-pointer border-2 border-dashed transition-colors",
                isDragActive
                  ? "border-primary/60 bg-primary/5"
                  : "hover:border-primary/40",
              )}
            >
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <input {...getInputProps()} />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {isDragActive ? "Drop PDF files here" : "Upload PDF files"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Drag and drop PDFs here, or click to browse.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Maximum file size: {MAX_PDF_UPLOAD_SIZE_LABEL} per file
                  </p>
                </div>
                <Button variant="outline" type="button">
                  Choose files
                </Button>
              </CardContent>
            </Card>

            {uploadProgress.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="mb-3 font-semibold">Upload progress</h4>
                  <div className="space-y-3">
                    {uploadProgress.map((progress) => (
                      <div
                        key={progress.fileId}
                        className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                      >
                        <div className="shrink-0">
                          {getStatusIcon(progress.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium">
                              {progress.fileName}
                            </span>
                            <div className="flex shrink-0 items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="text-[10px] capitalize"
                              >
                                {progress.status}
                              </Badge>
                              {progress.status === "uploading" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleCancelUpload(progress.fileId)
                                  }
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                          <Progress value={progress.progress} className="h-2" />
                          {progress.error && (
                            <p className="mt-1 text-xs text-rose-600">
                              {progress.error}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Hero ----------

function HeroSection({
  loading,
  total,
  ready,
  processing,
  totalSize,
  onUpload,
}: {
  loading: boolean;
  total: number;
  ready: number;
  processing: number;
  totalSize: string;
  onUpload: () => void;
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
      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 md:text-center">
        <Badge
          variant="secondary"
          className="mb-4 rounded-full px-3 py-1 text-xs font-medium"
        >
          <Sparkles className="mr-1 inline h-3.5 w-3.5" />
          AI tutor
        </Badge>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          PDF Summary &amp; Chat
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
          Upload PDFs and start chatting with AI to get instant summaries and
          answers from your documents.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={onUpload}
            className="rounded-full bg-linear-to-r from-primary to-primary/90 px-6 shadow-lg transition-all duration-200 hover:from-primary/90 hover:to-primary hover:shadow-xl"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload new PDF
          </Button>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 text-center sm:grid-cols-4 md:gap-4">
          <StatPill
            label="Total PDFs"
            value={loading ? null : total}
            accent="text-foreground"
          />
          <StatPill
            label="Ready"
            value={loading ? null : ready}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatPill
            label="Processing"
            value={loading ? null : processing}
            accent="text-amber-600 dark:text-amber-400"
          />
          <StatPill
            label="Total size"
            value={loading ? null : totalSize}
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
  value: number | string | null;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
      <div className={cn("text-2xl font-semibold tabular-nums md:text-3xl", accent)}>
        {value == null ? (
          <div className="mx-auto h-7 w-14 animate-pulse rounded bg-muted" />
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
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  topicFilter,
  onTopicFilterChange,
  topics,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  totalMatched,
  totalAll,
}: {
  search: string;
  onSearchChange: (next: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (next: StatusFilter) => void;
  topicFilter: string;
  onTopicFilterChange: (next: string) => void;
  topics: string[];
  sortBy: SortKey;
  onSortByChange: (next: SortKey) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (next: "grid" | "list") => void;
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
          <Input
            type="search"
            placeholder="Search PDFs by name…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="rounded-xl bg-card pl-10 pr-9 shadow-sm"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
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
            <SelectTrigger className="h-9 w-[150px] rounded-xl bg-card text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="name-az">Name A → Z</SelectItem>
              <SelectItem value="name-za">Name Z → A</SelectItem>
              <SelectItem value="largest">Largest size</SelectItem>
            </SelectContent>
          </Select>

          {topics.length > 0 ? (
            <Select value={topicFilter} onValueChange={onTopicFilterChange}>
              <SelectTrigger className="h-9 w-[140px] rounded-xl bg-card text-xs">
                <SelectValue placeholder="All topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All topics</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

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
              <span className="hidden sm:inline">Grid</span>
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
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          label="All"
          selected={statusFilter === "All"}
          onClick={() => onStatusFilterChange("All")}
        />
        {(Object.keys(statusMeta) as Exclude<StatusFilter, "All">[]).map(
          (key) => {
            const meta = statusMeta[key];
            return (
              <StatusPill
                key={key}
                label={meta.label}
                tint={meta.tint}
                selected={statusFilter === key}
                onClick={() => onStatusFilterChange(key)}
              />
            );
          },
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          Showing {totalMatched} of {totalAll}
        </span>
      </div>
    </div>
  );
}

function StatusPill({
  label,
  selected,
  onClick,
  tint,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  tint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
        selected
          ? (tint ?? "border-primary/30 bg-primary/10 text-primary") +
              " ring-2 ring-offset-1 ring-offset-background"
          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

// ---------- Loading / Empty ----------

function LoadingState({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex justify-between">
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
  onUpload,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/60 p-10 text-center sm:p-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FileText className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">
        {hasFilters ? "No PDFs match your filters" : "No PDFs uploaded yet"}
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        {hasFilters
          ? "Try clearing your search and filters to see more results."
          : "Upload your first PDF to start analyzing and chatting with AI."}
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        {hasFilters ? (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X className="mr-1 h-3.5 w-3.5" />
            Clear filters
          </Button>
        ) : null}
        <Button size="sm" onClick={onUpload}>
          <Upload className="mr-1 h-3.5 w-3.5" />
          Upload PDF
        </Button>
      </div>
    </div>
  );
}
