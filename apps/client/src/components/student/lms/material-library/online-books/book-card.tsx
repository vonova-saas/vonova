"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Star } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import { BookCardProps } from "./types";
import useStudentId from "@/hooks/student/use-student-id";
import { shouldBypassNextImageOptimization } from "@/lib/lms/course-thumbnail";

export function BookCard({
  book,
  onQuickView,
  favorites,
  toggleFavorite,
}: BookCardProps) {
  const studentId = useStudentId();
  return (
    <Card className="flex flex-col min-h-[480px] max-h-[540px] h-full group relative justify-between">
      {/* Favorite/Bookmark Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={`absolute top-3 left-3 z-10 p-1 ${
              favorites.includes(book.id)
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
            aria-label={
              favorites.includes(book.id)
                ? `Remove ${book.title} from favorites`
                : `Add ${book.title} to favorites`
            }
            onClick={() => toggleFavorite(book.id)}
          >
            {favorites.includes(book.id) ? (
              <Bookmark className="w-5 h-5 text-primary fill-primary" />
            ) : (
              <Bookmark className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {favorites.includes(book.id)
            ? "Remove from Favorites"
            : "Add to Favorites"}
        </TooltipContent>
      </Tooltip>

      {/* Badge */}
      {book.badge && (
        <span
          className={`absolute top-3 right-3 z-10 px-2 py-1 rounded text-xs font-bold shadow-md ${
            book.badge === "New"
              ? "bg-green-500 text-white animate-pulse"
              : "bg-yellow-500 text-white"
          }`}
        >
          {book.badge}
        </span>
      )}

      <CardHeader className="flex flex-col items-center gap-1 pb-1 pt-4">
        <div className="w-24 h-32 bg-muted rounded shadow overflow-hidden mb-2 flex items-center justify-center">
          <Image
            src={book.cover}
            alt={book.title + " cover"}
            width={96}
            height={128}
            className="object-cover w-full h-full"
            unoptimized={shouldBypassNextImageOptimization(book.cover)}
          />
        </div>
        <h3 className="text-lg text-center line-clamp-2 mb-1 font-semibold">
          {book.title}
        </h3>

        {/* Author Avatars and Names */}
        <div className="flex flex-col items-center mb-1">
          <span className="flex -space-x-2 mb-1">
            {book.authors.map((author, idx) => (
              <Image
                key={author.name}
                src={author.avatar}
                alt={author.name + " avatar"}
                width={24}
                height={24}
                className="rounded-full border border-primary bg-background object-cover align-middle"
                style={{ zIndex: 10 - idx }}
                unoptimized={shouldBypassNextImageOptimization(author.avatar)}
              />
            ))}
          </span>
          <span className="text-xs text-muted-foreground text-center">
            by {book.authors.map((a) => a.name).join(", ")}
          </span>
        </div>

        {/* Topic and Difficulty Row */}
        <div className="flex flex-row items-center justify-center gap-2 mt-1">
          <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
            {book.topic}
          </span>
          {book.difficulty && (
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
                book.difficulty === "Beginner"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : book.difficulty === "Intermediate"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                  : "bg-red-100 text-red-700 border-red-200"
              }`}
            >
              {book.difficulty}
            </span>
          )}
        </div>

        {/* Rating Stars */}
        {typeof book.rating === "number" && (
          <span className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < (book.rating ?? 0)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground"
                }`}
                fill={i < (book.rating ?? 0) ? "currentColor" : "none"}
              />
            ))}
          </span>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-1 justify-between items-center gap-3 w-full pb-4">
        <p className="text-sm text-muted-foreground text-center line-clamp-3 mb-2">
          {book.description}
        </p>
        <div className="flex gap-2 w-full mt-auto">
          <Button asChild className="w-1/2">
            <Link href={`/${studentId}/material-library/online-books/${book.id}`}>
              Read Book
            </Link>
          </Button>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-1/2"
              aria-label={`Quick view details for ${book.title}`}
              onClick={() => onQuickView(book)}
            >
              Quick View
            </Button>
          </DialogTrigger>
        </div>
      </CardContent>
    </Card>
  );
} 