"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { postImgSrcForDisplay } from "@/lib/post-image-display-url";
import { Button } from "@/components/ui/button";

interface LinkedInImageGalleryWithLightboxProps {
  images: string[];
  className?: string;
}

export function LinkedInImageGalleryWithLightbox({ 
  images, 
  className 
}: LinkedInImageGalleryWithLightboxProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const navigateImage = useCallback((direction: number) => {
    setCurrentImageIndex(prev => {
      const newIndex = prev + direction;
      if (newIndex >= 0 && newIndex < images.length) {
        return newIndex;
      }
      return prev;
    });
  }, [images.length]);

  const openLightbox = useCallback((index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // Handle body scroll when lightbox opens/closes
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxOpen) {
        closeLightbox();
      }
    };

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      
      if (e.key === 'ArrowLeft') {
        navigateImage(-1);
      } else if (e.key === 'ArrowRight') {
        navigateImage(1);
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keydown', handleArrowKeys);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleArrowKeys);
    };
  }, [lightboxOpen, navigateImage, closeLightbox]);

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
      onClick={() => openLightbox(index)}
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
      <>
        <div className={cn("w-full", className)}>
          <div className="aspect-[4/3] max-h-[600px]">
            {renderImage(images[0], 0)}
          </div>
        </div>
        
        {/* Lightbox */}
        {lightboxOpen && (
          <Lightbox 
            image={images[currentImageIndex]}
            currentIndex={currentImageIndex}
            total={images.length}
            onClose={closeLightbox}
            onNavigate={navigateImage}
          />
        )}
      </>
    );
  }

  // 2 images: Side by side
  if (images.length === 2) {
    return (
      <>
        <div className={cn("w-full", className)}>
          <div className="grid grid-cols-2 gap-2 aspect-[4/3] max-h-[600px]">
            {images.map((image, index) => renderImage(image, index))}
          </div>
        </div>
        
        {/* Lightbox */}
        {lightboxOpen && (
          <Lightbox 
            image={images[currentImageIndex]}
            currentIndex={currentImageIndex}
            total={images.length}
            onClose={closeLightbox}
            onNavigate={navigateImage}
          />
        )}
      </>
    );
  }

  // 3 images: One large on left, two stacked on right
  if (images.length === 3) {
    return (
      <>
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
        
        {/* Lightbox */}
        {lightboxOpen && (
          <Lightbox 
            image={images[currentImageIndex]}
            currentIndex={currentImageIndex}
            total={images.length}
            onClose={closeLightbox}
            onNavigate={navigateImage}
          />
        )}
      </>
    );
  }

  // 4 images: 2x2 grid
  if (images.length === 4) {
    return (
      <>
        <div className={cn("w-full", className)}>
          <div className="grid grid-cols-2 gap-2 aspect-[4/3] max-h-[600px]">
            {images.map((image, index) => renderImage(image, index))}
          </div>
        </div>
        
        {/* Lightbox */}
        {lightboxOpen && (
          <Lightbox 
            image={images[currentImageIndex]}
            currentIndex={currentImageIndex}
            total={images.length}
            onClose={closeLightbox}
            onNavigate={navigateImage}
          />
        )}
      </>
    );
  }

  // 5+ images: 3x2 grid with overlay on last image
  const displayImages = images.slice(0, 5);
  const extraCount = images.length - 5;

  return (
    <>
      <div className={cn("w-full", className)}>
        <div className="grid grid-cols-3 gap-2 aspect-[4/3] max-h-[600px]">
          {displayImages.map((image, index) => 
            renderImage(image, index, index === 4 && extraCount > 0 ? extraCount : undefined)
          )}
        </div>
      </div>
      
      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox 
          image={images[currentImageIndex]}
          currentIndex={currentImageIndex}
          total={images.length}
          onClose={closeLightbox}
          onNavigate={navigateImage}
        />
      )}
    </>
  );
}

// Lightbox component
function Lightbox({ 
  image, 
  currentIndex, 
  total, 
  onClose, 
  onNavigate 
}: {
  image: string;
  currentIndex: number;
  total: number;
  onClose: () => void;
  onNavigate: (direction: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation buttons */}
      {total > 1 && (
        <>
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-10 text-white hover:bg-white/20"
              onClick={() => onNavigate(-1)}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}
          
          {currentIndex < total - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-10 text-white hover:bg-white/20"
              onClick={() => onNavigate(1)}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </>
      )}

      {/* Image counter */}
      {total > 1 && (
        <div className="absolute top-4 left-4 z-10 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {total}
        </div>
      )}

      {/* Main image */}
      <div className="max-w-[90vw] max-h-[90vh]">
        <img
          src={postImgSrcForDisplay(image)}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
