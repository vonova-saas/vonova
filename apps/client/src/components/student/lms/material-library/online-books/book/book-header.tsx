import { Book, Menu, Home, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookTOCProps } from "./types";
import { FC, ReactNode } from "react";
import useStudentId from "@/hooks/student/use-student-id";

interface BookHeaderProps {
  isTocOpen: boolean;
  setIsTocOpen: (open: boolean) => void;
  currentChapterTitle: string;
  isBookmarked: boolean;
  toggleBookmark: () => void;
  stats: ReactNode;
  TableOfContents: FC<BookTOCProps>;
}

export const BookHeader: FC<BookHeaderProps> = ({
  isTocOpen,
  setIsTocOpen,
  currentChapterTitle,
  isBookmarked,
  toggleBookmark,
  stats,
  TableOfContents,
}) => {
  const studentId = useStudentId();

  return (
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
              <span>Pro Git</span>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <TableOfContents
              chapters={[]}
              bookmarks={[]}
              currentChapterSlug={""}
              handleChapterChange={function (): void {
                throw new Error("Function not implemented.");
              }}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <h1 className="text-xl font-semibold line-clamp-1">
        {currentChapterTitle || "Loading..."}
      </h1>
    </div>
    <div className="flex items-center gap-4">
      {stats}
      <Button
        size="icon"
        variant={isBookmarked ? "default" : "outline"}
        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark chapter"}
        onClick={toggleBookmark}
      >
        <Star
          className={`w-5 h-5 ${isBookmarked ? "fill-yellow-400 text-yellow-600" : "text-muted-foreground"}`}
        />
      </Button>
      <Button variant="ghost" asChild>
        <Link
          href={`/student/${studentId}/material-library/online-books`}
          aria-label="Back to books list"
        >
          <Home className="w-5 h-5 mr-2" />
          Back to List
        </Link>
      </Button>
    </div>
  </header>
);
};
