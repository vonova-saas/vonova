import { FC } from "react";
import { Input } from "@/components/ui/input";

interface BookProgressSearchProps {
  chapterProgress: number;
  currentChapterIndex: number;
  totalChapters: number;
  search: string;
  setSearch: (s: string) => void;
  matchCount: number;
}

export const BookProgressSearch: FC<BookProgressSearchProps> = ({
  chapterProgress,
  currentChapterIndex,
  totalChapters,
  search,
  setSearch,
  matchCount,
}) => (
  <div className="w-full px-4 mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between text-xs mb-1">
        <span>
          Chapter {currentChapterIndex + 1} of {totalChapters}
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
);
