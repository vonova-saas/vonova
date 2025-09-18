import { useState, useEffect, useRef } from 'react';
import type { Highlight } from './types';

export function useBookPersonalization(currentChapterSlug: string) {
  // Bookmarks
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        setBookmarks(stored);
      } catch {
        setBookmarks([]);
      }
    }
  }, []);
  const isBookmarked = bookmarks.includes(currentChapterSlug);
  const toggleBookmark = () => {
    setBookmarks((prev) => {
      let updated;
      if (prev.includes(currentChapterSlug)) {
        updated = prev.filter((slug) => slug !== currentChapterSlug);
      } else {
        updated = [...prev, currentChapterSlug];
      }
      localStorage.setItem('bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  // Highlights
  const [highlights, setHighlights] = useState<{ [chapter: string]: Highlight[] }>({});
  // Last read position (scroll)
  const readingAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!currentChapterSlug) return;
    const handleScroll = () => {
      localStorage.setItem('lastRead', JSON.stringify({
        chapter: currentChapterSlug,
        scroll: readingAreaRef.current ? readingAreaRef.current.scrollTop : 0,
      }));
    };
    const area = readingAreaRef.current;
    if (area) {
      area.addEventListener('scroll', handleScroll);
    }
    handleScroll();
    return () => {
      if (area) area.removeEventListener('scroll', handleScroll);
    };
  }, [currentChapterSlug]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const last = localStorage.getItem('lastRead');
    if (last) {
      try {
        const { chapter, scroll } = JSON.parse(last);
        if (chapter && chapter !== currentChapterSlug) {
          window.location.replace(`?chapter=${chapter}`);
        }
        setTimeout(() => {
          if (readingAreaRef.current && typeof scroll === 'number') {
            readingAreaRef.current.scrollTop = scroll;
          }
        }, 100);
      } catch {}
    }
  }, [currentChapterSlug]);

  return {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    highlights,
    setHighlights,
    readingAreaRef,
  };
} 