"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { SearchFilterProps } from "./types";
import { useRef, useEffect } from "react";

export function SearchFilter({
  search,
  setSearch,
  topic,
  setTopic,
  topics,
}: SearchFilterProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterSelectRef = useRef<HTMLButtonElement>(null);

  // Keyboard shortcuts: '/' for search, 'f' for filter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (
        (e.key === "f" || e.key === "F") &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        filterSelectRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-8 mx-auto">
      <div className="relative flex-1">
        <Input
          ref={searchInputRef}
          placeholder="Search books... (Press / to focus)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Search books"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
      </div>
      <div className="relative w-[140px]">
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger
            ref={filterSelectRef}
            className="pl-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Filter by topic (Press f to focus)"
          >
            <SelectValue placeholder="Filter by topic" />
          </SelectTrigger>
          <SelectContent>
            {topics.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
      </div>
    </div>
  );
} 