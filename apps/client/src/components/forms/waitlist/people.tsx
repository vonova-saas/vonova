"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation } from "motion/react";

interface PeopleProps {
  count?: number;
  initialCount?: number;
  className?: string;
  showGrowth?: boolean; // Show realistic growth animation
}

export default function People({
  count = 0,
  initialCount = 247, // More realistic starting number
  className = "",
  showGrowth = true,
}: PeopleProps) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const [isRealTimeGrowth, setIsRealTimeGrowth] = useState(false);
  const controls = useAnimation();

  // More diverse avatar set with better fallbacks
  const avatars = [
    { 
      id: "avatar1", 
      src: "/images/avatars/avatar1.avif",
      fallback: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format"
    },
    { 
      id: "avatar2", 
      src: "/images/avatars/avatar2.avif",
      fallback: "https://images.unsplash.com/photo-1494790108755-2616b612b586?w=40&h=40&fit=crop&crop=face&auto=format"
    },
    { 
      id: "avatar3", 
      src: "/images/avatars/avatar3.avif",
      fallback: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&auto=format"
    },
    { 
      id: "avatar4", 
      src: "/images/avatars/avatar4.avif",
      fallback: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face&auto=format"
    },
    { 
      id: "avatar5", 
      src: "/images/avatars/avatar5.avif",
      fallback: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face&auto=format"
    },
  ];

  // Simulate realistic growth if no count is provided
  useEffect(() => {
    if (!count && showGrowth) {
      setIsRealTimeGrowth(true);
      
      // Simulate realistic waitlist growth
      const growthInterval = setInterval(() => {
        setDisplayCount(prev => {
          // Random growth between 1-3 people every 30-60 seconds
          const shouldGrow = Math.random() > 0.5; // 50% chance
          if (shouldGrow) {
            const growth = Math.floor(Math.random() * 3) + 1;
            return prev + growth;
          }
          return prev;
        });
      }, Math.random() * 30000 + 30000); // 30-60 seconds

      return () => clearInterval(growthInterval);
    }
  }, [count, showGrowth]);

  // Animate count from initialCount to count when component mounts
  useEffect(() => {
    if (count && count !== displayCount) {
      let startTime: number;
      let requestId: number;
      const duration = 2000; // Animation duration in ms
      const startCount = displayCount;

      const animateCount = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);

        // Easing function for a more natural count animation
        const easeOutQuart = 1 - (1 - progress) ** 4;

        const currentCount = Math.floor(
          startCount + easeOutQuart * (count - startCount)
        );

        setDisplayCount(currentCount);

        if (progress < 1) {
          requestId = requestAnimationFrame(animateCount);
        }
      };

      requestId = requestAnimationFrame(animateCount);

      return () => {
        if (requestId) {
          cancelAnimationFrame(requestId);
        }
      };
    }
  }, [count, displayCount]);

  // Initial animation
  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
  }, [controls]);

  // Format the number with commas
  const formattedCount = displayCount.toLocaleString();

  // Show a subset of avatars with nice overlap
  const displayAvatars = avatars.slice(0, 4);

  return (
    <motion.div
      className={`flex items-center justify-center gap-2 py-2 px-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      transition={{ duration: 0.6 }}
    >
      <div className="flex -space-x-3 mr-3">
        {displayAvatars.map((avatar, index) => (
          <motion.div
            key={avatar.id}
            className="w-10 h-10 rounded-full border-2 border-background shadow-md overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500"
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            style={{ zIndex: displayAvatars.length - index }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar.src}
              alt={`Waitlist member ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // First try the better fallback
                const img = e.target as HTMLImageElement;
                if (img.src !== avatar.fallback) {
                  img.src = avatar.fallback;
                } else {
                  // If even the fallback fails, use a colored circle with initials
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent && !parent.querySelector('.avatar-fallback')) {
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = 'avatar-fallback w-full h-full flex items-center justify-center text-white font-semibold text-sm';
                    fallbackDiv.textContent = String.fromCharCode(65 + index); // A, B, C, etc.
                    parent.appendChild(fallbackDiv);
                  }
                }
              }}
            />
          </motion.div>
        ))}
        
        {/* Plus indicator for more people */}
        <motion.div
          className="w-10 h-10 rounded-full border-2 border-background shadow-md bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold text-xs"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          +{Math.floor(displayCount / 10)}
        </motion.div>
      </div>
      
      <motion.div className="text-sm md:text-base text-muted-foreground">
        Join{" "}
        <motion.span
          className="font-semibold text-foreground"
          key={displayCount}
          initial={{ opacity: 0.5, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {formattedCount}+
        </motion.span>{" "}
        others on the waitlist
        
        {isRealTimeGrowth && (
          <motion.div
            className="flex items-center mt-1 text-xs text-green-600"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
            <span>Growing live</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}