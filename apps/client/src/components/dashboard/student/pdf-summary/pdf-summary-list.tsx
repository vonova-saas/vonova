"use client";

import { useState, useMemo } from "react";
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
import { Search, Filter, FileText, Upload, Grid3X3, List } from "lucide-react";
import { PDFFile } from "./types";
import PDFSummaryCard from "./pdf-summary-card";

interface PDFSummaryListProps {
  pdfs: PDFFile[];
  onChat: (pdfId: string) => void;
  onDelete: (pdfId: string) => void;
  onDownload: (pdfId: string) => void;
  onRename: (pdfId: string, newName: string) => void;
  onUpload: () => void;
}

export default function PDFSummaryList({
  pdfs,
  onChat,
  onDelete,
  onDownload,
  onRename,
  onUpload,
}: PDFSummaryListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get unique topics from all PDFs
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    pdfs.forEach((pdf) => {
      pdf.topics.forEach((topic) => topics.add(topic));
    });
    return Array.from(topics).sort();
  }, [pdfs]);

  // Filter PDFs based on search and filters
  const filteredPDFs = useMemo(() => {
    return pdfs.filter((pdf) => {
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
    const ready = pdfs.filter((pdf) => pdf.status === "ready").length;
    const processing = pdfs.filter((pdf) => pdf.status === "processing").length;
    const totalSize = pdfs.reduce((sum, pdf) => sum + pdf.size, 0);
    const totalPages = pdfs.reduce((sum, pdf) => sum + pdf.pages, 0);

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
      <Card className="shadow-lg border-2 backdrop-blur-sm">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary rounded-full p-4 flex items-center justify-center shadow-sm">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-primary drop-shadow-sm">
                    {stats.total}
                  </span>
                  <span className="text-base font-medium text-muted-foreground mb-1">
                    PDF Files
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                    {stats.ready} Ready
                  </span>
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                    {stats.processing} Processing
                  </span>
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                    {formatTotalSize(stats.totalSize)}
                  </span>
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                    {stats.totalPages} Pages
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center md:text-right flex flex-col justify-center">
              <span className="text-lg font-semibold text-primary">
                Ready to analyze your PDFs?
              </span>
              <span className="text-muted-foreground text-sm mt-1">
                Upload PDFs and start chatting with AI to get instant summaries
                and answers!
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search PDFs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        </div>

        <div className="flex gap-2">
          <div className="relative w-[120px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Status" />
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

          <div className="relative w-[120px]">
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Topic" />
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

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={onUpload} className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload PDF
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
          {filteredPDFs.map((pdf) => (
            <PDFSummaryCard
              key={pdf.id}
              pdf={pdf}
              onChat={onChat}
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
