"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { fakeBooks, topics } from "./fake-data";
import { OverviewCard } from "./overview-card";
import { SearchFilter } from "./search-filter";
import { BookCard } from "./book-card";
import { BookQuickView } from "./book-quick-view";
import { PaginationControls } from "./pagination-controls";
import { Book } from "./types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dialog } from "@/components/ui/dialog";

export default function OnlineBooks() {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("All");
  const [page, setPage] = useState(1);
  const [quickViewBook, setQuickViewBook] = useState<Book | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const pageSize = 8;

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id],
    );
  };

  // Filter books by search and topic
  const filteredBooks = useMemo(() => {
    return fakeBooks.filter((book) => {
      const matchesTopic = topic === "All" || book.topic === topic;
      const matchesSearch =
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.description.toLowerCase().includes(search.toLowerCase()) ||
        book.authors.some((author) =>
          author.name.toLowerCase().includes(search.toLowerCase()),
        );
      return matchesTopic && matchesSearch;
    });
  }, [search, topic]);

  // Pagination logic
  const totalPages = Math.ceil(filteredBooks.length / pageSize);
  const paginatedBooks = filteredBooks.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Reset to first page when filter/search changes
  useMemo(() => {
    setPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, topic]);

  // Overview stats
  const totalBooks = fakeBooks.length;
  const uniqueTopics = Array.from(
    new Set(fakeBooks.map((b) => b.topic)),
  ).length;

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center overflow-auto relative bg-background p-6"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
        backgroundSize: "18px 18px",
      }}
    >
      <OverviewCard totalBooks={totalBooks} uniqueTopics={uniqueTopics} />

      <SearchFilter
        search={search}
        setSearch={setSearch}
        topic={topic}
        setTopic={setTopic}
        topics={topics}
      />

      <div className="w-full max-w-6xl mx-auto mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <span>
          Showing {paginatedBooks.length} of {filteredBooks.length} books
        </span>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="w-16 h-16 text-primary/20 mb-4" />
          <span className="text-lg font-semibold text-muted-foreground mb-2">
            No books found
          </span>
          <span className="text-sm text-muted-foreground">
            Try adjusting your search or filter to find books.
          </span>
        </div>
      ) : (
        <>
          <TooltipProvider>
            <Dialog>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {paginatedBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onQuickView={setQuickViewBook}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </Dialog>
          </TooltipProvider>

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            setPage={setPage}
            itemsPerPage={pageSize}
            totalItems={filteredBooks.length}
            currentItems={paginatedBooks.length}
          />
        </>
      )}

      <BookQuickView
        book={quickViewBook}
        onClose={() => setQuickViewBook(null)}
        open={!!quickViewBook}
      />
    </div>
  );
}
