"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MessageSquare,
  Download,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PDFFile } from "./types";

interface PDFSummaryCardProps {
  pdf: PDFFile;
  onChat: (pdfId: string) => void;
  onDelete: (pdfId: string) => void;
  onDownload: (pdfId: string) => void;
  onRename: (pdfId: string, newName: string) => void;
}

export default function PDFSummaryCard({
  pdf,
  onChat,
  onDelete,
  onDownload,
}: PDFSummaryCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "uploading":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-700 border-green-200";
      case "processing":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "uploading":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "error":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap max-w-full">
              <CardTitle className="text-base font-semibold line-clamp-1 truncate block">
                {pdf.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {/* Temporarily commented out as requested */}
                {/* <Badge
                  variant="outline"
                  className={`text-xs ${getStatusColor(pdf.status)}`}
                >
                  {getStatusIcon(pdf.status)}
                  <span className="ml-1 capitalize">{pdf.status}</span>
                </Badge> */}
                {/* Temporarily commented out as requested */}
                {/* <span className="text-xs text-muted-foreground">
                  {pdf.pages} pages
                </span> */}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onChat(pdf.id)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat with PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(pdf.id)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(pdf.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Temporarily commented out as requested */}
          {/* <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatFileSize(pdf.size)}</span>
            <span>{formatDate(pdf.uploadedAt)}</span>
          </div> */}

          {/* Topics */}
          {pdf.topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pdf.topics.slice(0, 3).map((topic) => (
                <Badge key={topic} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {pdf.topics.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{pdf.topics.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Last Accessed */}
          {pdf.lastAccessed && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Last accessed: {formatDate(pdf.lastAccessed)}</span>
            </div>
          )}

          {/* Restore Chat button as requested */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onChat(pdf.id)}
              className="flex-1"
              disabled={pdf.status !== "ready"}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(pdf.id)}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
