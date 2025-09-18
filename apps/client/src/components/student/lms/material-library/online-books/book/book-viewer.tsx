/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { gitBook } from "./git-book-data";
import { toast } from "sonner";
import { BookHeader } from "./book-header";
import { BookTOC } from "./book-TOC";
import { BookStats } from "./book-stats";
import { BookControls } from "./book-controls";
import { BookContent } from "./book-content";
import { useBookPersonalization } from "./use-book-personalization";
import { FontSize, LineHeight } from "./types";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import Image from "next/image";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function BookViewer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("text-lg");
  const [lineHeight, setLineHeight] = useState<LineHeight>("normal");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
  const [matchCount, setMatchCount] = useState(0);
  const matchCountRef = useRef(0);
  const [showHighlightBtn, setShowHighlightBtn] = useState(false);
  const [selectionText, setSelectionText] = useState("");

  // Font size controls
  const decreaseFont = () => setFontSize((prev) =>
    prev === "text-2xl" ? "text-xl" : prev === "text-xl" ? "text-lg" : prev === "text-lg" ? "text-base" : "text-base"
  );
  const resetFont = () => setFontSize("text-lg");
  const increaseFont = () => setFontSize((prev) =>
    prev === "text-base" ? "text-lg" : prev === "text-lg" ? "text-xl" : prev === "text-xl" ? "text-2xl" : "text-2xl"
  );

  // Chapter logic
  const currentChapterSlug = searchParams.get("chapter") || gitBook.chapters[0].slug;
  const currentChapterIndex = gitBook.chapters.findIndex((c) => c.slug === currentChapterSlug);
  const currentChapter = gitBook.chapters[currentChapterIndex];
  const prevChapter = currentChapterIndex > 0 ? gitBook.chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < gitBook.chapters.length - 1 ? gitBook.chapters[currentChapterIndex + 1] : null;

  // Personalization (bookmarks, highlights, last read)
  const {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    highlights,
    setHighlights,
    readingAreaRef,
  } = useBookPersonalization(currentChapterSlug);

  // Reading stats (analytics)
  const [readingStats, setReadingStats] = useState<{ [chapter: string]: { time: number; completed: boolean } }>({});
  const [totalTime, setTotalTime] = useState(0);
  const readingTimer = useRef<NodeJS.Timeout | null>(null);
  const readingStart = useRef<number | null>(null);

  // Load stats from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stats = JSON.parse(localStorage.getItem('readingStats') || '{}');
        setReadingStats(stats);
      } catch {
        setReadingStats({});
      }
    }
  }, []);

  // Start/pause timer on chapter change or tab visibility
  useEffect(() => {
    if (!currentChapterSlug) return;
    if (readingTimer.current) clearInterval(readingTimer.current);
    readingStart.current = Date.now();
    const tick = () => {
      setReadingStats((prev) => {
        const prevStats = prev[currentChapterSlug] || { time: 0, completed: false };
        const updated = { ...prev, [currentChapterSlug]: { ...prevStats, time: prevStats.time + 1 } };
        localStorage.setItem('readingStats', JSON.stringify(updated));
        setTotalTime(Object.values(updated).reduce((acc, s) => acc + (typeof s === 'object' && 'time' in s && typeof s.time === 'number' ? s.time : 0), 0));
        return updated;
      });
    };
    readingTimer.current = setInterval(tick, 1000);
    const handleVisibility = () => {
      if (document.hidden && readingTimer.current) {
        clearInterval(readingTimer.current);
      } else if (!document.hidden && !readingTimer.current) {
        readingTimer.current = setInterval(tick, 1000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (readingTimer.current) clearInterval(readingTimer.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentChapterSlug]);

  // Stop timer on unmount
  useEffect(() => {
    return () => {
      if (readingTimer.current) clearInterval(readingTimer.current);
    };
  }, []);

  // Chapter completed
  useEffect(() => {
    if (!currentChapterSlug) return;
    const area = readingAreaRef.current;
    if (!area) return;
    const handleScroll = () => {
      if (area.scrollTop + area.clientHeight >= area.scrollHeight - 10) {
        setReadingStats((prev) => {
          const prevStats = prev[currentChapterSlug] || { time: 0, completed: false };
          if (prevStats.completed) return prev;
          const updated = { ...prev, [currentChapterSlug]: { ...prevStats, completed: true } };
          localStorage.setItem('readingStats', JSON.stringify(updated));
          return updated;
        });
      }
    };
    area.addEventListener('scroll', handleScroll);
    return () => area.removeEventListener('scroll', handleScroll);
  }, [currentChapterSlug, readingAreaRef]);

  // Fetch chapter content when chapter changes
  useEffect(() => {
    if (currentChapter) {
      setIsLoading(true);
      fetch(currentChapter.path)
        .then((res) => res.text())
        .then((text) => {
          setContent(text);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching chapter:", err);
          setContent("Failed to load chapter content.");
          setIsLoading(false);
        });
    }
  }, [currentChapter]);

  // Format time helper
  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m > 0 ? m + 'm ' : ''}${s}s`;
  }

  // Markdown highlight/search logic
  function highlightMatches(text: string, search: string) {
    if (!search) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    let lastIndex = 0;
    let match;
    const nodes: React.ReactNode[] = [];
    let count = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }
      nodes.push(
        <mark key={match.index} className="bg-yellow-300 text-black rounded px-1 py-0.5">
          {match[0]}
        </mark>
      );
      count++;
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }
    matchCountRef.current += count;
    return nodes.length > 0 ? nodes : text;
  }

  useLayoutEffect(() => {
    matchCountRef.current = 0;
  }, [content, search]);
  useLayoutEffect(() => {
    setMatchCount(matchCountRef.current);
  }, []);

  // Copy/Share/Highlight handlers
  const handleCopySelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString()) {
      navigator.clipboard.writeText(sel.toString());
      toast.success("Copied selection to clipboard");
    } else {
      toast.error("No text selected");
    }
  };
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Copied chapter link");
  };
  const handleHighlight = () => {
    if (selectionText && currentChapterSlug) {
      setHighlights((prev) => {
        const prevArr = prev[currentChapterSlug] || [];
        if (prevArr.some(h => h.text === selectionText)) return prev;
        return {
          ...prev,
          [currentChapterSlug]: [...prevArr, { text: selectionText, id: Date.now().toString() }],
        };
      });
      setShowHighlightBtn(false);
      setSelectionText("");
      toast.success("Highlighted!");
    }
  };

  // Selection logic
  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && sel.toString().trim().length > 0) {
        setSelectionText(sel.toString());
        setShowHighlightBtn(true);
      } else {
        setShowHighlightBtn(false);
        setSelectionText("");
      }
    };
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, [currentChapterSlug]);

  // Keyboard navigation for chapters
  const handleChapterChange = useCallback(
    (slug: string) => {
      router.push(`${pathname}?chapter=${slug}`);
      setIsTocOpen(false);
    },
    [router, pathname],
  );

  // Add keyboard navigation for left/right arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'ArrowLeft' && prevChapter) {
        handleChapterChange(prevChapter.slug);
      } else if (e.key === 'ArrowRight' && nextChapter) {
        handleChapterChange(nextChapter.slug);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevChapter, nextChapter, handleChapterChange]);

  // Markdown components
  const memoizedHighlight = useMemo(() => {
    return function renderWithHighlights(text: string) {
      const chapterHighlights = highlights[currentChapterSlug] || [];
      if (!chapterHighlights.length) return text;
      const sorted = [...chapterHighlights].sort((a, b) => b.text.length - a.text.length);
      let result: React.ReactNode[] = [text];
      sorted.forEach(h => {
        result = result.flatMap((part) => {
          if (typeof part !== 'string') return [part];
          const split = part.split(h.text);
          if (split.length < 2) return [part];
          const nodes: React.ReactNode[] = [];
          split.forEach((s, idx) => {
            if (s) nodes.push(s);
            if (idx < split.length - 1) {
              nodes.push(
                <mark key={h.id + '-' + idx} className="bg-yellow-300 text-black rounded px-1 py-0.5" style={{ color: '#222', background: '#ffe066' }}>
                  {h.text}
                </mark>
              );
            }
          });
          return nodes;
        });
      });
      return result;
    };
  }, [highlights, currentChapterSlug]);

  const markdownComponents = useMemo(() => ({
    code: (props: any) => {
      const { inline, className, children, ...rest } = props;
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={match[1]}
          PreTag="div"
          {...rest}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    },
    text: ({ children }: any) => {
      if (!debouncedSearch && (!highlights[currentChapterSlug] || !highlights[currentChapterSlug].length)) return children;
      if (!Array.isArray(children)) return children;
      const first = children[0];
      if (typeof first !== "string") return children;
      if (debouncedSearch) return highlightMatches(first, debouncedSearch);
      return memoizedHighlight(first);
    },
    img: ({ src = "", alt = "", width, height, ...props }: any) => {
      if (typeof src === "string" && (src.startsWith("/") || src.startsWith("./"))) {
        return (
          <Image
            src={src}
            alt={alt}
            width={typeof width === 'number' ? width : 600}
            height={typeof height === 'number' ? height : 400}
            style={{ maxWidth: "100%", height: "auto" }}
            {...props}
          />
        );
      }
      if (typeof src !== "string" || !src) return null;
      return (
        <Image
          src={src}
          alt={alt}
          width={typeof width === 'number' ? width : 600}
          height={typeof height === 'number' ? height : 400}
          style={{ maxWidth: "100%", height: "auto" }}
          {...props}
        />
      );
    },
  }), [debouncedSearch, highlights, currentChapterSlug, memoizedHighlight]);

  // Stats row
  const stats = (
    <BookStats
      timeOnChapter={readingStats[currentChapterSlug]?.time || 0}
      totalTime={totalTime}
      completed={!!readingStats[currentChapterSlug]?.completed}
      formatTime={formatTime}
    />
  );

  return (
    <div className="flex h-[89vh] bg-muted/20">
      {/* Desktop Sidebar (Table of Contents) */}
      <aside className="hidden md:flex flex-col w-72 bg-background border-r h-full">
        <div className="p-4 border-b">
          <span className="flex items-center gap-2 text-lg font-bold text-primary">
            Pro Git
          </span>
        </div>
        <BookTOC
          chapters={gitBook.chapters}
          bookmarks={bookmarks}
          currentChapterSlug={currentChapterSlug}
          handleChapterChange={handleChapterChange}
        />
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        <BookHeader
          isTocOpen={isTocOpen}
          setIsTocOpen={setIsTocOpen}
          currentChapterTitle={currentChapter?.title || ""}
          isBookmarked={isBookmarked}
          toggleBookmark={toggleBookmark}
          stats={stats}
          TableOfContents={() => (
            <BookTOC
              chapters={gitBook.chapters}
              bookmarks={bookmarks}
              currentChapterSlug={currentChapterSlug}
              handleChapterChange={handleChapterChange}
            />
          )}
        />
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground px-4 pt-4 pb-2"
          aria-label="Breadcrumb"
        >
          <span className="hover:underline cursor-pointer" onClick={() => router.push('/dashboard/material-library/online-books')}>{gitBook.title}</span>
          <span className="mx-1">/</span>
          <span className="font-semibold text-primary">
            {currentChapter?.title}
          </span>
        </nav>
        <BookControls
          fontSize={fontSize}
          decreaseFont={decreaseFont}
          resetFont={resetFont}
          increaseFont={increaseFont}
          lineHeight={lineHeight}
          setLineHeight={(lh: string) => setLineHeight(lh as LineHeight)}
          handleCopySelection={handleCopySelection}
          handleCopyLink={handleCopyLink}
          showHighlightBtn={showHighlightBtn}
          selectionText={selectionText}
          handleHighlight={handleHighlight}
          search={search}
          setSearch={setSearch}
          matchCount={matchCount}
        />
        <BookContent
          isLoading={isLoading}
          content={content}
          markdownComponents={markdownComponents}
          readingAreaRef={readingAreaRef as React.RefObject<HTMLDivElement>}
          fontSize={fontSize}
          lineHeight={lineHeight}
          prevChapter={prevChapter}
          nextChapter={nextChapter}
          handleChapterChange={handleChapterChange}
        />
      </div>
    </div>
  );
}
