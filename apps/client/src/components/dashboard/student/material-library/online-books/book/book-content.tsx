import { FC, RefObject } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface BookContentProps {
  isLoading: boolean;
  content: string;
  markdownComponents: unknown;
  readingAreaRef: RefObject<HTMLDivElement>;
  fontSize: string;
  lineHeight: string;
  prevChapter: { slug: string; title: string } | null;
  nextChapter: { slug: string; title: string } | null;
  handleChapterChange: (slug: string) => void;
}

export const BookContent: FC<BookContentProps> = ({
  isLoading,
  content,
  markdownComponents,
  readingAreaRef,
  fontSize,
  lineHeight,
  prevChapter,
  nextChapter,
  handleChapterChange,
}) => (
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
        <ReactMarkdown components={markdownComponents as never}>{content}</ReactMarkdown>
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
); 