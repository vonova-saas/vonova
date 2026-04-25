"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Search,
  Filter,
  FileText,
  Upload,
  Grid3X3,
  List,
  BarChart3,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { PDFFile } from "./types";
import PDFSummaryCard from "./pdf-summary-card";
import useStudentId from "@/hooks/student/use-student-id";
import { getChatHistoryQueryFn, getSessionsQueryFn } from "@/services/student/lms-ai/pdf-summary/pdf.api";
import { GetSessionsResponse } from "@/types/api/student/lms-ai/pdf-summary/pdf.type";
import { jsPDF } from "jspdf";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { uploadPDFMutationFn } from "@/services/student/lms-ai/pdf-summary/pdf.api";
import { parseUsageLimitError } from "@/utils/functions/app/usage-limit-error";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PDFSummaryListProps {
  pdfs?: PDFFile[];
  studentId?: () => typeof useStudentId;
  onChat?: (pdfId: string) => void;
  onDelete?: (pdfId: string) => void;
  onDownload?: (pdfId: string) => void;
  onRename?: (pdfId: string, newName: string) => void;
  onUpload?: () => void;
}

export default function PDFSummaryList({
  pdfs: propPdfs = [],
  studentId,
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSessions, setLocalSessions] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<any[]>([]);

  // Default onUpload implementation if not provided
  const handleUpload = onUpload || (() => {
    setShowUploadModal(true);
  });

  const router = useRouter();
  const currentStudentId = useStudentId();

  const MAX_PDF_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
  const MAX_PDF_UPLOAD_SIZE_LABEL = "10MB";

  // Upload functionality
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(
      (file) => file.type === "application/pdf",
    );
    if (pdfFiles.length > 0) {
      handleFileUpload(pdfFiles);
    }
  }, [currentStudentId]);

 const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_PDF_UPLOAD_SIZE_BYTES,
    multiple: true,
    onDragEnter: () => {},
    onDragLeave: () => {},
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
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploading":
        return "bg-blue-500";
      case "processing":
        return "bg-yellow-500";
      case "complete":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleFileUpload = async (files: File[]) => {
  const file = files[0];
  if (!file) return;
  
  // Frontend guard for file size - check before any API call
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeBytes) {
    toast.error("File size exceeds 10MB limit", {
      description: `Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB, which exceeds 10MB limit.`,
    });
    return;
  }

  const fileId = `${file.name}-${Date.now()}`;
    setUploadProgress([{
      fileId,
      fileName: file.name,
      progress: 20,
      status: "uploading",
      error: null,
    }]);

    try {
      setUploadProgress(prev =>
        prev.map(p => p.fileId === fileId ? { ...p, progress: 60 } : p)
      );

    const response = await uploadPDFMutationFn({
      file,
    });

      setUploadProgress(prev =>
        prev.map(p => p.fileId === fileId
          ? { ...p, progress: 100, status: "complete" }
          : p
        )
      );

      setShowUploadModal(false);
      setUploadProgress([]);
      
      // Store session in localStorage
      const existingSessions = JSON.parse(
        localStorage.getItem("pdf_sessions") || "[]"
      );
      existingSessions.unshift({
        session_id: response.session_id,
        file_name: file.name,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(
        "pdf_sessions", 
        JSON.stringify(existingSessions.slice(0, 10))
      );

    } catch (err) {
      console.error("Upload failed:", (err as any)?.response?.data || (err as any)?.message || err);
      const parsed = parseUsageLimitError(err);
      toast.error(parsed.title, { description: parsed.description, duration: 7000 });
      setUploadProgress(prev =>
        prev.map(p => p.fileId === fileId
          ? { ...p, status: "error", error: parsed.description }
          : p
        )
      );
    }
  };

  // Default onChat implementation if not provided
  const handleChat = onChat || ((pdfId: string) => {
    window.location.href = `/student/${currentStudentId}/pdf-summary/${pdfId}`;
  });

  // Fetch sessions with localStorage fallback
  const { data: sessionsData, isLoading } = useQuery<GetSessionsResponse>({
    queryKey: ["pdf-sessions"],
    queryFn: getSessionsQueryFn,
    enabled: !!currentStudentId,
  });

  // Read localStorage only on the client after mount to avoid SSR/CSR hydration mismatches.
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

  // Convert sessions to PDFFile format with localStorage fallback
  const pdfs = useMemo(() => {
    // If props have PDFs, use those (for backward compatibility)
    if (propPdfs && propPdfs.length > 0) {
      return propPdfs;
    }

    // Get sessions from API or localStorage fallback (loaded on client after mount)
    let sessions: any[] = [];
    const apiSessions = Array.isArray((sessionsData as any)?.data)
      ? (sessionsData as any).data
      : Array.isArray(sessionsData)
        ? (sessionsData as any)
        : [];

    if (apiSessions.length > 0) {
      sessions = apiSessions;
    } else if (localSessions.length > 0) {
      sessions = localSessions.map((session: any) => ({
        session_id: session.session_id,
        file_name: session.file_name || session.filename,
        file_size: session.file_size ?? session.fileSize ?? session.size ?? 0,
        page_count: session.page_count ?? session.pages ?? session.pageCount ?? 0,
        created_at: session.created_at,
        status: session.status || "ready",
      }));
    }

    // Convert sessions to PDFFile format
    return sessions.map((session: any) => ({
      id: session.session_id,
      name: session.file_name || session.filename || "PDF Document",
      size: Number(session.file_size ?? session.fileSize ?? session.size ?? 0) || 0,
      uploadedAt: new Date(session.created_at),
      status: session.status || "ready",
      pages: Number(session.pages ?? session.page_count ?? session.pageCount ?? 0) || 0,
      topics: [], // Not available in session data
      lastAccessed: new Date(session.created_at),
    }));
  }, [propPdfs, sessionsData, localSessions]);

  const internalDownloadChatPdf = async (sessionId: string) => {
    // Download the chat history for this session as a PDF.
    try {
      const historyData = await getChatHistoryQueryFn(sessionId);
      const hd: any = historyData as any;

      let records: any[] = [];
      if (hd?.messages && Array.isArray(hd.messages)) records = hd.messages;
      else if (hd?.data?.messages && Array.isArray(hd.data.messages)) records = hd.data.messages;
      else if (hd?.data?.chats && Array.isArray(hd.data.chats)) records = hd.data.chats;

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

        const q = normalizeText(r?.question ?? r?.prompt ?? r?.user_question ?? r?.q).trim();
        const a = normalizeText(r?.answer ?? r?.response ?? r?.assistant_answer ?? r?.a).trim();
        if (q) lines.push(`You: ${q}`);
        if (a) lines.push(`AI: ${a}`);
      });

      const session = pdfs.find((p) => p.id === sessionId);
      const fileNameBase = (session?.name || sessionId).replace(/[\\/:*?"<>|]+/g, "_");
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

      const safeLines = lines.length ? lines : ["No chat messages found for this session."];
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
      alert("Failed to download chat history. Please try again.");
    }
  };

  const onDownload = onDownloadProp ?? internalDownloadChatPdf;

  // Get unique topics from all PDFs
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    pdfs.forEach((pdf: PDFFile) => {
      pdf.topics.forEach((topic: string) => topics.add(topic));
    });
    return Array.from(topics).sort();
  }, [pdfs]);

  // Filter PDFs based on search and filters
  const filteredPDFs = useMemo(() => {
    return pdfs.filter((pdf: PDFFile) => {
      const matchesSearch = pdf.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || pdf.status === statusFilter;
      const matchesTopic =
        topicFilter === "All" || pdf.topics.includes(topicFilter);

      return matchesSearch && matchesStatus && matchesTopic;
    });
  }, [pdfs, search, statusFilter, topicFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = pdfs.length;
    const ready = pdfs.filter((pdf: PDFFile) => pdf.status === "ready").length;
    const processing = pdfs.filter((pdf: PDFFile) => pdf.status === "processing").length;
    const totalSize = pdfs.reduce((sum: number, pdf: PDFFile) => sum + pdf.size, 0);
    const totalPages = pdfs.reduce((sum: number, pdf: PDFFile) => sum + pdf.pages, 0);

    return { total, ready, processing, totalSize, totalPages };
  }, [pdfs]);

  const formatTotalSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full space-y-6">
      {/* Stats Card */}
      <Card className="shadow-xl border-2 border-border/50 backdrop-blur-sm from-background to-muted/20">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="bg-primary/10 text-primary rounded-2xl p-6 flex items-center justify-center shadow-lg border border-primary/10">
                <FileText className="w-10 h-10" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap max-w-full">
                  <div className="text-base font-semibold line-clamp-1 truncate block">
                    {pdfs.length} PDF Files
                  </div>
                  {/* Temporarily commented out as requested */}
                  {/* <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold border border-yellow-200">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    {stats.processing} Processing
                  </div> */}
                  {/* <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {formatTotalSize(stats.totalSize)} Total Size
                  </div> */}
                  {/* <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold border border-purple-200">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    {stats.totalPages} Total Pages
                  </div> */}
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="text-center lg:text-right space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Ready to analyze your PDFs?
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Upload PDFs and start chatting with AI to get instant
                  summaries and answers from your documents.
                </p>
                <Button onClick={handleUpload} className="mt-4" size="lg">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New PDF
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Controls */}
      <div className="w-full flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Input
            placeholder="Search PDFs by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        </div>

        <div className="relative w-[140px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="uploading">Uploading</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
        </div>

        <div className="relative w-[140px]">
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Filter by topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Topics</SelectItem>
              {allTopics.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
        </div>

        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none h-10 px-3"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-l-none h-10 px-3"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="group border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="w-8 h-8 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Skeleton className="h-8 w-20 rounded" />
                  <div className="flex gap-2">
                    <Skeleton className="w-8 h-8 rounded" />
                    <Skeleton className="w-8 h-8 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPDFs.length === 0 ? (
        <Card className="p-16 border-2 border-dashed border-muted-foreground/20 bg-muted/5">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {search || statusFilter !== "All" || topicFilter !== "All"
                ? "No PDFs found"
                : "No PDFs uploaded yet"}
            </h3>
            <p className="text-base text-muted-foreground mb-6 max-w-md">
              {search || statusFilter !== "All" || topicFilter !== "All"
                ? "Try adjusting your search or filters to find PDFs."
                : "Upload your first PDF to start analyzing and chatting with AI!"}
            </p>
            {!search && statusFilter === "All" && topicFilter === "All" && (
              <Button onClick={handleUpload} className="flex items-center gap-2 px-6 py-3 text-base" size="lg">
                <Upload className="w-5 h-5" />
                Upload Your First PDF
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredPDFs.map((pdf: PDFFile) => (
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
      
      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload PDF Files
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Area */}
            <Card
              {...getRootProps()}
              className="border-2 border-dashed transition-colors cursor-pointer"
            >
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    {isDragActive
                      ? "Drop PDF files here"
                      : "Upload PDF files"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Drag and drop PDF files here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum file size: 10MB per file
                  </p>
                </div>
                <Button variant="outline" className="mt-2">
                  Choose Files
                </Button>
              </CardContent>
            </Card>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Upload Progress</h4>
                  <div className="space-y-3">
                    {uploadProgress.map((progress) => (
                      <div
                        key={progress.fileId}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="shrink-0">
                          {getStatusIcon(progress.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">
                              {progress.fileName}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getStatusColor(progress.status)}`}
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
                          <Progress
                            value={progress.progress}
                            className="h-2"
                          />
                          {progress.error && (
                            <p className="text-sm text-red-600">{progress.error}</p>
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
