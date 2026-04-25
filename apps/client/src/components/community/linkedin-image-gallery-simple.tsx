"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { postImgSrcForDisplay } from "@/lib/post-image-display-url";

interface LinkedInImageGallerySimpleProps {
  images: string[];
  className?: string;
  onImageClick?: (index: number) => void;
}

export function LinkedInImageGallerySimple({ 
  images, 
  className,
  onImageClick 
}: LinkedInImageGallerySimpleProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  if (!images || images.length === 0) return null;

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.currentTarget as HTMLImageElement).style.display = "none";
  };

  const renderImage = (src: string, index: number, extraCount?: number) => (
    <div
      key={`${src}-${index}`}
      className={cn(
        "relative overflow-hidden rounded-lg cursor-pointer transition-all hover:shadow-lg",
        "bg-muted/20",
        !loadedImages.has(index) && "animate-pulse"
      )}
      onClick={() => onImageClick?.(index)}
    >
      <img
        src={postImgSrcForDisplay(src)}
        alt={`Post image ${index + 1}`}
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => handleImageLoad(index)}
        onError={handleImageError}
      />
      
      {/* Overlay for extra images indicator */}
      {extraCount && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">+{extraCount}</div>
            <div className="text-sm text-white/80">more</div>
          </div>
        </div>
      )}
    </div>
  );

  // 1 image: Full width
  if (images.length === 1) {
    return (
      <div className={cn("w-full", className)}>
        <div className="aspect-[4/3] max-h-[600px]">
          {renderImage(images[0], 0)}
        </div>
      </div>
    );
  }

  // 2 images: Side by side
  if (images.length === 2) {
    return (
      <div className={cn("w-full", className)}>
        <div className="grid grid-cols-2 gap-2 aspect-[4/3] max-h-[600px]">
          {images.map((image, index) => renderImage(image, index))}
        </div>
      </div>
    );
  }

  // 3 images: One large on left, two stacked on right
  if (images.length === 3) {
    return (
      <div className={cn("w-full", className)}>
        <div className="grid grid-cols-2 gap-2 aspect-[4/3] max-h-[600px]">
          {/* Large image on left */}
          <div className="col-span-1 row-span-2">
            {renderImage(images[0], 0)}
          </div>
          {/* Two stacked images on right */}
          <div className="col-span-1 grid grid-rows-2 gap-2">
            {renderImage(images[1], 1)}
            {renderImage(images[2], 2)}
          </div>
        </div>
      </div>
    );
  }

  // 4 images: 2x2 grid
  if (images.length === 4) {
    return (
      <div className={cn("w-full", className)}>
        <div className="grid grid-cols-2 gap-2 aspect-[4/3] max-h-[600px]">
          {images.map((image, index) => renderImage(image, index))}
        </div>
      </div>
    );
  }

  // 5+ images: 3x2 grid with overlay on last image
  const displayImages = images.slice(0, 5);
  const extraCount = images.length - 5;

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-3 gap-2 aspect-[4/3] max-h-[600px]">
        {displayImages.map((image, index) => 
          renderImage(image, index, index === 4 && extraCount > 0 ? extraCount : undefined)
        )}
      </div>
    </div>
  );
}
