"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { UploadProgress } from "./types";

interface PDFUploadProps {
  onFileUpload: (files: File[]) => void;
  uploadProgress: UploadProgress[];
  onCancelUpload: (fileId: string) => void;
}

export default function PDFUpload({
  onFileUpload,
  uploadProgress,
  onCancelUpload,
}: PDFUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const pdfFiles = acceptedFiles.filter(
        (file) => file.type === "application/pdf",
      );
      if (pdfFiles.length > 0) {
        onFileUpload(pdfFiles);
      }
    },
    [onFileUpload],
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

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

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : isDragReject
              ? "border-red-500 bg-red-50"
              : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className="flex flex-col items-center justify-center space-y-4 cursor-pointer"
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? "Drop PDF files here" : "Upload PDF files"}
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
          </div>
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
                  <div className="flex-shrink-0">
                    {getStatusIcon(progress.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">
                        {progress.fileId}
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
                            onClick={() => onCancelUpload(progress.fileId)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                    {progress.error && (
                      <p className="text-xs text-red-500 mt-1">
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
  );
}
