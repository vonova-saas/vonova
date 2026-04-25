"use client";

import { Video, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface VideoUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: string;
  className?: string;
}

export function VideoUploadZone({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 200 * 1024 * 1024, // 200MB default
  accept = "video/*",
  className
}: VideoUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Check file count
    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} videos allowed`);
      return [];
    }

    files.forEach((file) => {
      // Check file type
      if (!file.type.startsWith('video/')) {
        errors.push(`${file.name} is not a video file`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name} exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join('. '));
      setTimeout(() => setError(null), 5000);
      return [];
    }

    setError(null);
    return validFiles;
  }, [maxFiles, maxSize]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles = validateFiles(Array.from(files));
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected, validateFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drag & Drop Zone */}
      <div
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all",
          isDragOver
            ? "border-primary bg-primary/5 scale-105"
            : "border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-muted/10"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleFileInput}
          aria-label="Upload videos"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "rounded-full p-3 transition-colors",
            isDragOver ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {isDragOver ? (
              <Upload className="h-6 w-6" />
            ) : (
              <Video className="h-6 w-6" />
            )}
          </div>

          <div>
            <p className="font-medium text-foreground">
              {isDragOver ? "Drop videos here" : "Click to upload or drag and drop"}
            </p>
            <p className="text-sm text-muted-foreground">
              MP4, MOV, AVI up to {(maxSize / 1024 / 1024).toFixed(1)}MB each
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3">
          <X className="mt-0.5 h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
