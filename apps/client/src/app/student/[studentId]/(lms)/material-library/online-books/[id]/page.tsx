"use client";

import BookViewer from "@/components/student/lms/material-library/online-books/book/book-viewer";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function BookPageContent() {
  return <BookViewer />;
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-muted/20 p-8">
          <Skeleton className="h-full w-72 mr-8" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
