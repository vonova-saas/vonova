"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import Image from "next/image";
import { BookQuickViewProps } from "./types";

export function BookQuickView({ book, onClose, open }: BookQuickViewProps) {
  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{book.title}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-col items-center gap-4 mt-2">
              {/* Author Avatars and Names */}
              <div className="flex flex-col items-center mb-1">
                <span className="flex -space-x-2 mb-1">
                  {book.authors.map((author, idx) => (
                    <Image
                      key={author.name}
                      src={author.avatar}
                      alt={author.name + " avatar"}
                      width={28}
                      height={28}
                      className="rounded-full border border-primary bg-background object-cover align-middle"
                      style={{ zIndex: 10 - idx }}
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
              <Image
                src={book.cover}
                alt={book.title + " cover"}
                width={120}
                height={160}
                className="object-cover rounded shadow"
              />
              <div className="text-center">
                <div className="text-base text-muted-foreground mt-2">
                  {book.description}
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button variant="outline" className="mt-4 w-full">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
} 