import { Star } from "lucide-react";
import { FC } from "react";
import { BookTOCProps } from "./types";

export const BookTOC: FC<BookTOCProps> = ({
  chapters,
  bookmarks,
  currentChapterSlug,
  handleChapterChange,
}) => (
  <div className="w-full">
    <h3 className="text-lg font-semibold mb-4 text-primary px-4">
      Table of Contents
    </h3>
    <ul className="space-y-1">
      {chapters.map((chapter) => (
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