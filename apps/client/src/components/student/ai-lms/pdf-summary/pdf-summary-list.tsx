"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
  Search,
  Filter,
  FileText,
  Upload,
  Grid3X3,
  List,
  BarChart3,
} from "lucide-react";
import { PDFFile } from "./types";
import PDFSummaryCard from "./pdf-summary-card";
import useStudentId from "@/hooks/student/use-student-id";
import { getChatHistoryQueryFn, getSessionsQueryFn } from "@/services/student/lms-ai/pdf-summary/pdf.api";
import { GetSessionsResponse } from "@/types/api/student/lms-ai/pdf-summary/pdf.type";
import { jsPDF } from "jspdf";

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
  onUpload = () => {
    window.location.href = `/student/${studentId}/pdf-summary`;
  },
}: PDFSummaryListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSessions, setLocalSessions] = useState<any[]>([]);

  const router = useRouter();
  const currentStudentId = useStudentId();

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
                <Button onClick={onUpload} className="mt-4" size="lg">
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
      {filteredPDFs.length === 0 ? (
        <Card className="p-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FileText className="w-16 h-16 text-primary/20 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              {search || statusFilter !== "All" || topicFilter !== "All"
                ? "No PDFs found"
                : "No PDFs uploaded yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || statusFilter !== "All" || topicFilter !== "All"
                ? "Try adjusting your search or filters to find PDFs."
                : "Upload your first PDF to start analyzing and chatting with AI!"}
            </p>
            {!search && statusFilter === "All" && topicFilter === "All" && (
              <Button onClick={onUpload} className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
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
    </div>
  );
}
