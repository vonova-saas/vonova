"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { OverviewCardProps } from "./types";

export function OverviewCard({ totalBooks, uniqueTopics }: OverviewCardProps) {
  return (
    <Card className="w-full max-w-3xl mb-6 shadow-lg border-2 backdrop-blur-sm">
      <CardContent className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Icon and Main Stat */}
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary rounded-full p-4 flex items-center justify-center shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-extrabold text-primary drop-shadow-sm">
                {totalBooks}
              </span>
              <span className="text-base font-medium text-muted-foreground mb-1">
                Books
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                {uniqueTopics} Topics
              </span>
              <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                {totalBooks} Total
              </span>
            </div>
          </div>
        </div>
        {/* Motivational Message */}
        <div className="flex-1 text-center md:text-right flex flex-col justify-center">
          <span className="text-lg font-semibold text-primary">
            Expand your knowledge!
          </span>
          <span className="text-muted-foreground text-sm mt-1">
            Browse and read free computer science books to boost your learning
            journey.
          </span>
        </div>
      </CardContent>
    </Card>
  );
} 