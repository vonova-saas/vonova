"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { articleImgSrcForDisplay } from "@/lib/article-image-display-url";
import { Button } from "@/components/ui/button";

interface ArticleImageGalleryProps {
  images: string[];
  className?: string;
  showLightbox?: boolean;
  aspectRatio?: "square" | "video" | "4/3" | "3/2" | "16/9" | "auto";
  maxImages?: number;
}

export function ArticleImageGallery({ 
  images, 
  className,
  showLightbox = true,
  aspectRatio = "auto",
  maxImages = 6
}: ArticleImageGalleryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const displayImages = images.slice(0, maxImages);
  const hasMoreImages = images.length > maxImages;
  const extraCount = images.length - maxImages;

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.currentTarget as HTMLImageElement).style.display = "none";
  };

  const openLightbox = (index: number) => {
    if (!showLightbox) return;
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const navigateImage = (direction: number) => {
    const newIndex = currentImageIndex + direction;
    if (newIndex >= 0 && newIndex < images.length) {
      setCurrentImageIndex(newIndex);
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square": return "aspect-square";
      case "video": return "aspect-video";
      case "4/3": return "aspect-[4/3]";
      case "3/2": return "aspect-[3/2]";
      case "16/9": return "aspect-[16/9]";
      case "auto": 
      default: return "";
    }
  };

  const renderImage = (src: string, index: number, showOverlay = false) => {
    const actualIndex = hasMoreImages && index === maxImages - 1 ? -1 : index;
    
    return (
      <div
        key={`${src}-${index}`}
        className={cn(
          "relative overflow-hidden rounded-lg border bg-muted/20 transition-all hover:shadow-lg group",
          showLightbox && "cursor-pointer",
          !loadedImages.has(index) && "animate-pulse",
          getAspectRatioClass()
        )}
        onClick={() => openLightbox(actualIndex)}
      >
        <img
          src={articleImgSrcForDisplay(src)}
          alt={`Article image ${index + 1}`}
          className={cn(
            "h-full w-full transition-transform duration-300 group-hover:scale-[1.02]",
            aspectRatio === "auto" ? "object-contain" : "object-cover"
          )}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => handleImageLoad(index)}
          onError={handleImageError}
        />
        
        {/* Overlay for extra images indicator */}
        {showOverlay && extraCount > 0 && index === maxImages - 1 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">+{extraCount}</div>
              <div className="text-sm text-white/80">more images</div>
            </div>
          </div>
        )}

        {/* Hover overlay with maximize button */}
        {showLightbox && !showOverlay && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Maximize2 className="h-6 w-6 text-white drop-shadow-lg" />
          </div>
        )}
      </div>
    );
  };

  // Single image - full width
  if (displayImages.length === 1) {
    return (
      <>
        <div className={cn("w-full", className)}>
          <div className={cn(
            "max-h-[80vh] w-full overflow-hidden rounded-xl border",
            getAspectRatioClass()
          )}>
            {renderImage(displayImages[0], 0)}
          </div>
        </div>
        
        {showLightbox && lightboxOpen && (
          <Lightbox 
            images={images}
            currentIndex={currentImageIndex}
            onClose={closeLightbox}
            onNavigate={navigateImage}
          />
        )}
      </>
    );
  }

  // Two images - side by side
  if (displayImages.length === 2) {
    return (
      <>
        <div className={cn("w-full", className)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayImages.map((image, index) => renderImage(image, index))}
          </div>
        </div>
        
        {showLightbox && lightboxOpen && (
          <Lightbox 
            images={images}
            currentIndex={currentImageIndex}
            onClose={closeLightbox}
            onNavigate={navigateImage}
          />
        )}
      </>
    );
  }

  // Three images - one large, two small
  if (displayImages.length === 3) {
    return (
      <>
        <div className={cn("w-full", className)}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              {renderImage(displayImages[0], 0)}
            </div>
            <div className="sm:col-span-1 grid grid-rows-2 gap-4">
              {renderImage(displayImages[1], 1)}
              {renderImage(displayImages[2], 2)}
            </div>
          </div>
        </div>
        
        {showLightbox && lightboxOpen && (
          <Lightbox 
            images={images}
            currentIndex={currentImageIndex}
            onClose={closeLightbox}
            onNavigate={navigateImage}
          />
        )}
      </>
    );
  }

  // Four or more images - grid layout
  return (
    <>
      <div className={cn("w-full", className)}>
        <div className={cn(
          "grid gap-4",
          displayImages.length === 4 && "grid-cols-2 sm:grid-cols-2",
          displayImages.length >= 5 && "grid-cols-2 sm:grid-cols-3"
        )}>
          {displayImages.map((image, index) => 
            renderImage(image, index, hasMoreImages && index === maxImages - 1)
          )}
        </div>
        
        {hasMoreImages && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => openLightbox(maxImages)}
              className="text-sm"
            >
              View all {images.length} images
            </Button>
          </div>
        )}
      </div>
      
      {showLightbox && lightboxOpen && (
        <Lightbox 
          images={images}
          currentIndex={currentImageIndex}
          onClose={closeLightbox}
          onNavigate={navigateImage}
        />
      )}
    </>
  );
}

// Lightbox component
function Lightbox({ 
  images, 
  currentIndex, 
  onClose, 
  onNavigate 
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: number) => void;
}) {
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onNavigate(-1);
    if (e.key === 'ArrowRight') onNavigate(1);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-10 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(-1);
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}
          
          {currentIndex < images.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-10 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(1);
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 z-10 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Main image */}
      <div 
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={articleImgSrcForDisplay(images[currentIndex])}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
