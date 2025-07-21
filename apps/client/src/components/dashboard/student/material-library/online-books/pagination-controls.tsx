"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";
import { PaginationControlsProps } from "./types";

export function PaginationControls({
  currentPage,
  totalPages,
  setPage,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex justify-center">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : 0}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <PaginationItem key={idx}>
              <PaginationLink
                isActive={currentPage === idx + 1}
                onClick={() => setPage(idx + 1)}
              >
                {idx + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              aria-disabled={currentPage === totalPages}
              tabIndex={currentPage === totalPages ? -1 : 0}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
