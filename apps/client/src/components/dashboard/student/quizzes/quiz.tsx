"use client";
import React, { useState, useMemo } from "react";
import QuizList from "./quizList";
import QuizRunner from "./quizRunner";
import { QuizType } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockQuizzes, topics } from "./fakeQuizzes";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from "@/components/ui/pagination";

export default function Quiz() {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizType | null>(null);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("All");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Filter quizzes by search and topic
  const filteredQuizzes = useMemo(() => {
    return mockQuizzes.filter((quiz) => {
      const matchesTopic = topic === "All" || quiz.topic === topic;
      const matchesSearch =
        quiz.title.toLowerCase().includes(search.toLowerCase()) ||
        quiz.description.toLowerCase().includes(search.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [search, topic]);

  const totalPages = Math.ceil(filteredQuizzes.length / pageSize);
  const paginatedQuizzes = filteredQuizzes.slice((page - 1) * pageSize, page * pageSize);

  // Reset to first page when filter/search changes
  React.useEffect(() => {
    setPage(1);
  }, [search, topic]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center overflow-auto relative bg-background p-6" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}>
      <h1 className="text-4xl font-bold leading-tight mb-4">Quizzes</h1>
      {/* Summary Card */}
      <Card className="w-full max-w-3xl mb-6 shadow-md">
        <CardHeader>
          <CardTitle>Quiz Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <span className="text-2xl font-bold">{mockQuizzes.length}</span>
              <span className="ml-2 text-muted-foreground">Total Quizzes</span>
            </div>
            <div className="text-muted-foreground text-sm">
              Challenge yourself with computer science quizzes and track your progress!
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Search and Filter */}
      <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-8">
        <Input
          placeholder="Search quizzes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by topic" />
          </SelectTrigger>
          <SelectContent>
            {topics.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!selectedQuiz ? (
        <>
          <QuizList onSelect={setSelectedQuiz} quizzes={paginatedQuizzes} />
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-disabled={page === 1}
                      tabIndex={page === 1 ? -1 : 0}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <PaginationItem key={idx}>
                      <PaginationLink isActive={page === idx + 1} onClick={() => setPage(idx + 1)}>{idx + 1}</PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      aria-disabled={page === totalPages}
                      tabIndex={page === totalPages ? -1 : 0}
                      className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      ) : (
        <QuizRunner quiz={selectedQuiz} onBack={() => setSelectedQuiz(null)} />
      )}
    </div>
  );
} 