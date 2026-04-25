"use client";

import { X, Palette, ImagePlus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImagePreviewGalleryProps {
  files: File[];
  onRemove: (index: number) => void;
  onEdit?: (index: number, file: File) => void;
  onAddMore?: () => void;
  className?: string;
}

export function ImagePreviewGallery({ 
  files, 
  onRemove, 
  onEdit, 
  onAddMore,
  className 
}: ImagePreviewGalleryProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    onEdit?.(index, files[index]);
  };

  if (files.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(
        "grid gap-4",
        files.length === 1 && "grid-cols-1",
        files.length === 2 && "grid-cols-2 sm:grid-cols-3",
        files.length >= 3 && "grid-cols-3 sm:grid-cols-4"
      )}>
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted/20 transition-all hover:shadow-lg hover:scale-105"
          >
            {/* Image Preview */}
            <img
              src={previewUrls[index]}
              alt={`Preview ${index + 1}`}
              className="h-full w-full object-cover"
            />
            
            {/* Overlay with controls */}
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-2">
                  {/* Edit Button */}
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 rounded-full p-0"
                      onClick={() => handleEdit(index)}
                      title="Edit image"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Remove Button */}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => handleRemove(index)}
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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

      {/* Add More Images Button */}
      {onAddMore && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onAddMore}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Add More Images
          </Button>
        </div>
      )}
      
      {/* Edit placeholder */}
      {editingIndex !== null && onEdit && (
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Image editing functionality would be implemented here. 
            Features could include: crop, rotate, filters, brightness/contrast adjustments.
          </p>
        </div>
      )}
    </div>
  );
}
