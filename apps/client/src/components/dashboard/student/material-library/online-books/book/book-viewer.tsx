/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { gitBook } from "./git-book-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Book, Menu, Home } from "lucide-react";
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

export default function BookViewer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTocOpen, setIsTocOpen] = useState(false);

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

  const handleChapterChange = (slug: string) => {
    router.push(`${pathname}?chapter=${slug}`);
    setIsTocOpen(false); // Close mobile TOC on selection
  };

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
              className={`w-full text-left px-4 py-2 rounded-md transition-colors text-sm ${
                currentChapterSlug === chapter.slug
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted"
              }`}
            >
              {chapter.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex h-[100vh] bg-muted/20">
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
          <Button variant="ghost" asChild>
            <Link
              href="/dashboard/material-library/online-books"
              aria-label="Back to books list"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to List
            </Link>
          </Button>
        </header>

        {/* Reading Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">
          <article className="prose prose-lg prose-zinc dark:prose-invert max-w-none bg-background p-6 rounded-lg shadow-sm">
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
                  code: ((props: any) => {
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
                  })
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
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {prevChapter.title}
              </Button>
            ) : (
              <div /> // Placeholder for alignment
            )}
            {nextChapter ? (
              <Button
                variant="outline"
                onClick={() => handleChapterChange(nextChapter.slug)}
              >
                {nextChapter.title}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div /> // Placeholder for alignment
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
