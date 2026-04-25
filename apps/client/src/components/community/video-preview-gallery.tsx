"use client";

import { X, Video, Play } from "lucide-react";
import { useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoPreviewGalleryProps {
  files: File[];
  onRemove: (index: number) => void;
  onAddMore?: () => void;
  className?: string;
}

export function VideoPreviewGallery({
  files,
  onRemove,
  onAddMore,
  className
}: VideoPreviewGalleryProps) {
  // Generate preview URLs when files change using useMemo for better performance
  const previewUrls = useMemo(() => {
    return files.map(file => URL.createObjectURL(file));
  }, [files]);

  // Cleanup object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleRemove = (index: number) => {
    onRemove(index);
    // Revoke the URL to prevent memory leaks
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
  };

  if (files.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(
        "grid gap-4",
        files.length === 1 && "grid-cols-1",
        files.length === 2 && "grid-cols-2 sm:grid-cols-2",
        files.length >= 3 && "grid-cols-2 sm:grid-cols-3"
      )}>
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="group relative aspect-video overflow-hidden rounded-lg transition-all hover:shadow-lg hover:scale-105"
          >
            {/* Video Preview */}
            <video
              src={previewUrls[index]}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-black/50 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="h-6 w-6 text-white" />
              </div>
            </div>
            
            {/* Overlay with controls */}
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={() => handleRemove(index)}
                  title="Remove video"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* File info badge */}
            <div className="absolute bottom-2 left-2 right-2">
              <div className="rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                <div className="truncate font-medium">{file.name}</div>
                <div className="text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add More Videos Button */}
      {onAddMore && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onAddMore}
          >
            <Video className="mr-2 h-4 w-4" />
            Add More Videos
          </Button>
        </div>
      )}
    </div>
  );
}
