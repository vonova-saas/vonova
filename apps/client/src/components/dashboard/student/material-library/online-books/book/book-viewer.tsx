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
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { gitBook } from "./git-book-data";
import { Button } from "@/components/ui/button";
import { Book, Menu, Home, ArrowLeft, ArrowRight, Star } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";

// Debounce hook
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
  const [fontSize, setFontSize] = useState<
    "text-base" | "text-lg" | "text-xl" | "text-2xl"
  >("text-lg");
  const [lineHeight, setLineHeight] = useState<"normal" | "relaxed">("normal");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
  const [matchCount, setMatchCount] = useState(0);
  const matchCountRef = useRef(0);
  const readingAreaRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<{
    [chapter: string]: { text: string; id: string }[];
  }>({});
  const [showHighlightBtn, setShowHighlightBtn] = useState(false);
  const [selectionText, setSelectionText] = useState("");
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // On mount, load bookmarks from localStorage
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

  const currentChapterSlug =
    searchParams.get("chapter") || gitBook.chapters[0].slug;

  const currentChapterIndex = gitBook.chapters.findIndex(
    (c) => c.slug === currentChapterSlug,
  );
  const currentChapter = gitBook.chapters[currentChapterIndex];
  const prevChapter =
    currentChapterIndex > 0 ? gitBook.chapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex < gitBook.chapters.length - 1
      ? gitBook.chapters[currentChapterIndex + 1]
      : null;

  // Keyboard navigation for chapters
  const handleChapterChange = useCallback(
    (slug: string) => {
      router.push(`${pathname}?chapter=${slug}`);
      setIsTocOpen(false); // Close mobile TOC on selection
    },
    [router, pathname],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prevChapter) {
        handleChapterChange(prevChapter.slug);
      } else if (e.key === "ArrowRight" && nextChapter) {
        handleChapterChange(nextChapter.slug);
      }
    },
    [prevChapter, nextChapter, handleChapterChange],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Progress calculation
  const chapterProgress =
    ((currentChapterIndex + 1) / gitBook.chapters.length) * 100;

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

  const increaseFont = () => {
    setFontSize((prev) =>
      prev === "text-base"
        ? "text-lg"
        : prev === "text-lg"
          ? "text-xl"
          : prev === "text-xl"
            ? "text-2xl"
            : "text-2xl",
    );
  };
  const decreaseFont = () => {
    setFontSize((prev) =>
      prev === "text-2xl"
        ? "text-xl"
        : prev === "text-xl"
          ? "text-lg"
          : prev === "text-lg"
            ? "text-base"
            : "text-base",
    );
  };
  const resetFont = () => setFontSize("text-lg");

  // Helper to highlight search matches in text
  function highlightMatches(text: string, search: string) {
    if (!search) return text;
    // Use global, case-insensitive regex
    const regex = new RegExp(
      `(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    let lastIndex = 0;
    let match;
    const nodes: React.ReactNode[] = [];
    let count = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }
      nodes.push(
        <mark
          key={match.index}
          className="bg-yellow-300 text-black rounded px-1 py-0.5"
        >
          {match[0]}
        </mark>,
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

  // Reset match count before each render
  useLayoutEffect(() => {
    matchCountRef.current = 0;
  }, [content, search]);

  // After render, update matchCount state
  useLayoutEffect(() => {
    setMatchCount(matchCountRef.current);
  }, []);

  // Copy selected text
  const handleCopySelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString()) {
      navigator.clipboard.writeText(sel.toString());
      toast.success("Copied selection to clipboard");
    } else {
      toast.error("No text selected");
    }
  };

  // Copy chapter link
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Copied chapter link");
  };

  // Highlight selected text
  const handleHighlight = () => {
    if (selectionText && currentChapterSlug) {
      setHighlights((prev) => {
        const prevArr = prev[currentChapterSlug] || [];
        // Avoid duplicate highlights
        if (prevArr.some((h) => h.text === selectionText)) return prev;
        return {
          ...prev,
          [currentChapterSlug]: [
            ...prevArr,
            { text: selectionText, id: Date.now().toString() },
          ],
        };
      });
      setShowHighlightBtn(false);
      setSelectionText("");
      toast.success("Highlighted!");
    }
  };

  // Listen for text selection
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
    return () =>
      document.removeEventListener("selectionchange", handleSelection);
  }, [currentChapterSlug]);

  // Move focus to reading area on chapter change
  useEffect(() => {
    if (readingAreaRef.current) {
      readingAreaRef.current.tabIndex = -1;
      readingAreaRef.current.focus();
    }
  }, [currentChapterSlug]);

  // --- Remember Last Read Position ---
  // On chapter or scroll, save last read
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
    // Save on chapter change too
    handleScroll();
    return () => {
      if (area) area.removeEventListener('scroll', handleScroll);
    };
  }, [currentChapterSlug]);

  // On mount, restore last read
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const last = localStorage.getItem('lastRead');
    if (last) {
      try {
        const { chapter, scroll } = JSON.parse(last);
        if (chapter && chapter !== currentChapterSlug) {
          router.replace(`${pathname}?chapter=${chapter}`);
        }
        setTimeout(() => {
          if (readingAreaRef.current && typeof scroll === 'number') {
            readingAreaRef.current.scrollTop = scroll;
          }
        }, 100);
      } catch {}
    }
  }, [currentChapterSlug, pathname, router]);

  // --- Bookmarks ---
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

  // Memoized highlight rendering
  const memoizedHighlight = useMemo(() => {
    return function renderWithHighlights(text: string) {
      const chapterHighlights = highlights[currentChapterSlug] || [];
      if (!chapterHighlights.length) return text;
      const sorted = [...chapterHighlights].sort(
        (a, b) => b.text.length - a.text.length,
      );
      let result: React.ReactNode[] = [text];
      sorted.forEach((h) => {
        result = result.flatMap((part) => {
          if (typeof part !== "string") return [part];
          const split = part.split(h.text);
          if (split.length < 2) return [part];
          const nodes: React.ReactNode[] = [];
          split.forEach((s, idx) => {
            if (s) nodes.push(s);
            if (idx < split.length - 1) {
              nodes.push(
                <mark
                  key={h.id + "-" + idx}
                  className="bg-yellow-300 text-black rounded px-1 py-0.5"
                  style={{ color: "#222", background: "#ffe066" }}
                >
                  {h.text}
                </mark>,
              );
            }
          });
          return nodes;
        });
      });
      return result;
    };
  }, [highlights, currentChapterSlug]);

  const TableOfContents = () => (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-primary px-4">
        Table of Contents
      </h3>
      <ul className="space-y-1">
        {gitBook.chapters.map((chapter) => (
          <li key={chapter.slug}>
            <button
              onClick={() => handleChapterChange(chapter.slug)}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors text-sm flex items-center gap-2 ${
                currentChapterSlug === chapter.slug
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted"
              }`}
              aria-current={currentChapterSlug === chapter.slug ? "page" : undefined}
            >
              {bookmarks.includes(chapter.slug) && (
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-600" />
              )}
              {chapter.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex h-[89vh] bg-muted/20">
      {/* Desktop Sidebar (Table of Contents) */}
      <aside className="hidden md:flex flex-col w-72 bg-background border-r h-full">
        <div className="p-4 border-b">
          <Link
            href="/dashboard/material-library/online-books"
            className="flex items-center gap-2 text-lg font-bold text-primary"
          >
            <Book className="w-6 h-6" />
            <span>{gitBook.title}</span>
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <TableOfContents />
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-background border-b z-10">
          <div className="flex items-center gap-4">
            {/* Mobile TOC Trigger */}
            <Sheet open={isTocOpen} onOpenChange={setIsTocOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open Table of Contents</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2 text-lg font-bold text-primary">
                    <Book className="w-6 h-6" />
                    <span>{gitBook.title}</span>
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1">
                  <TableOfContents />
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-semibold line-clamp-1">
              {currentChapter?.title || "Loading..."}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant={isBookmarked ? "default" : "outline"}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark chapter"}
              onClick={toggleBookmark}
            >
              <Star className={`w-5 h-5 ${isBookmarked ? "fill-yellow-400 text-yellow-600" : "text-muted-foreground"}`} />
            </Button>
            <Button variant="ghost" asChild>
              <Link
                href="/dashboard/material-library/online-books"
                aria-label="Back to books list"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to List
              </Link>
            </Button>
          </div>
        </header>

        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground px-4 pt-4 pb-2"
          aria-label="Breadcrumb"
        >
          <Link
            href="/dashboard/material-library/online-books"
            className="hover:underline"
          >
            {gitBook.title}
          </Link>
          <span className="mx-1">/</span>
          <span className="font-semibold text-primary">
            {currentChapter?.title}
          </span>
        </nav>

        {/* Progress Bar & Search */}
        <div className="w-full px-4 mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>
                Chapter {currentChapterIndex + 1} of {gitBook.chapters.length}
              </span>
              <span>{Math.round(chapterProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${chapterProgress}%` }}
              ></div>
            </div>
          </div>
          {/* Search in Chapter */}
          <div className="flex-1 min-w-0 flex items-center gap-2 md:ml-4 mt-2 md:mt-0">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in chapter..."
              className="w-full"
              aria-label="Search in chapter"
              tabIndex={0}
            />
            {search && (
              <span
                className="text-xs text-muted-foreground whitespace-nowrap"
                aria-live="polite"
              >
                {matchCount} match{matchCount !== 1 ? "es" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div
          className="flex flex-wrap items-center gap-4 px-4 pt-4 pb-2"
          role="toolbar"
          aria-label="Book controls"
        >
          {/* Font Size Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              Font size:
            </span>
            <Button
              size="icon"
              variant="outline"
              aria-label="Decrease font size"
              onClick={decreaseFont}
              disabled={fontSize === "text-base"}
              tabIndex={0}
            >
              A-
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Reset font size"
              onClick={resetFont}
              tabIndex={0}
            >
              A
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Increase font size"
              onClick={increaseFont}
              disabled={fontSize === "text-2xl"}
              tabIndex={0}
            >
              A+
            </Button>
          </div>
          {/* Line Height Control */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              Line height:
            </span>
            <Button
              size="sm"
              variant={lineHeight === "normal" ? "default" : "outline"}
              aria-label="Normal line height"
              onClick={() => setLineHeight("normal")}
              tabIndex={0}
            >
              Normal
            </Button>
            <Button
              size="sm"
              variant={lineHeight === "relaxed" ? "default" : "outline"}
              aria-label="Relaxed line height"
              onClick={() => setLineHeight("relaxed")}
              tabIndex={0}
            >
              Relaxed
            </Button>
          </div>
          {/* Copy/Share/Highlight Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopySelection}
              aria-label="Copy selected text"
              tabIndex={0}
            >
              Copy Selection
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              aria-label="Copy chapter link"
              tabIndex={0}
            >
              Copy Link
            </Button>
            {showHighlightBtn && selectionText && (
              <Button
                size="sm"
                variant="default"
                onClick={handleHighlight}
                aria-label="Highlight selection"
                tabIndex={0}
              >
                Highlight
              </Button>
            )}
          </div>
        </div>

        {/* Reading Area */}
        <div
          ref={readingAreaRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 outline-none"
          aria-label="Book content"
          tabIndex={-1}
        >
          <article
            className={`prose prose-lg prose-zinc dark:prose-invert max-w-none bg-background p-6 rounded-lg shadow-sm ${fontSize} ${lineHeight === "relaxed" ? "leading-relaxed" : "leading-normal"}`}
          >
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <ReactMarkdown
                components={{
                  code: (props: any) => {
                    const { inline, className, children, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        // TypeScript: 'any' is used here due to react-syntax-highlighter style prop type issues.
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
                  text: ({ children }) => {
                    if (
                      !debouncedSearch &&
                      (!highlights[currentChapterSlug] ||
                        !highlights[currentChapterSlug].length)
                    )
                      return children;
                    if (!Array.isArray(children)) return children;
                    const first = children[0];
                    if (typeof first !== "string") return children;
                    // If searching, highlight search matches; else, render highlights
                    if (debouncedSearch)
                      return highlightMatches(first, debouncedSearch);
                    return memoizedHighlight(first);
                  },
                  img: ({ src = "", alt = "", width, height, ...props }) => {
                    // Only handle if src is a string
                    if (
                      typeof src === "string" &&
                      (src.startsWith("/") || src.startsWith("./"))
                    ) {
                      return (
                        <Image
                          src={src}
                          alt={alt}
                          width={typeof width === "number" ? width : 600}
                          height={typeof height === "number" ? height : 400}
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
                        width={typeof width === "number" ? width : 600}
                        height={typeof height === "number" ? height : 400}
                        style={{ maxWidth: "100%", height: "auto" }}
                        {...props}
                      />
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </article>

          {/* Chapter Navigation */}
          <div className="flex justify-between mt-8">
            {prevChapter ? (
              <Button
                variant="outline"
                onClick={() => handleChapterChange(prevChapter.slug)}
                aria-label="Previous chapter"
              >
                <span className="hidden sm:inline">{prevChapter.title}</span>
                <ArrowLeft className="w-4 h-4 sm:ml-2" />
              </Button>
            ) : (
              <div />
            )}
            {nextChapter ? (
              <Button
                variant="outline"
                onClick={() => handleChapterChange(nextChapter.slug)}
                aria-label="Next chapter"
              >
                <span className="hidden sm:inline">{nextChapter.title}</span>
                <ArrowRight className="w-4 h-4 sm:ml-2" />
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
