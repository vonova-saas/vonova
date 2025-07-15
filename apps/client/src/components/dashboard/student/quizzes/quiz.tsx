"use client";
import React, { useState, useMemo } from "react";
import QuizList from "./quizList";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockQuizzes, topics } from "./fakeQuizzes";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from "@/components/ui/pagination";
import { BookOpen, Search, Filter, Component } from "lucide-react";

export default function Quiz() {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("All");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Calculate total questions
  const totalQuestions = mockQuizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
  const totalTopics = topics.length - 1; // Exclude 'All'

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
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-4xl font-bold leading-tight">Quizzes</h1>
        <Component className="w-7 h-7 text-primary animate-pulse" />
      </div>
      {/* Enhanced Summary Card */}
      <Card className="w-full max-w-3xl mb-6 shadow-lg border-2 backdrop-blur-sm">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Icon and Main Stat */}
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary rounded-full p-4 flex items-center justify-center shadow-sm">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-primary drop-shadow-sm">{mockQuizzes.length}</span>
                  <span className="text-base font-medium text-muted-foreground mb-1">Total Quizzes</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                    {totalTopics} Topics
                  </span>
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                    {totalQuestions} Questions
                  </span>
                </div>
              </div>
            </div>
            {/* Motivational Message */}
            <div className="flex-1 text-center md:text-right flex flex-col justify-center">
              <span className="text-lg font-semibold text-primary">Ready to challenge yourself?</span>
              <span className="text-muted-foreground text-sm mt-1">Start your learning journey and track your progress with our computer science quizzes!</span>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Search and Filter */}
      <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Input
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        </div>
        <div className="relative w-[180px]">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Filter by topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
        </div>
      </div>
      {filteredQuizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <BookOpen className="w-16 h-16 text-primary/20 mb-4" />
          <span className="text-lg font-semibold text-muted-foreground mb-2">No quizzes found</span>
          <span className="text-sm text-muted-foreground">Try adjusting your search or filter to find quizzes.</span>
        </div>
      ) : (
        <QuizList quizzes={paginatedQuizzes} />
      )}
      {totalPages > 1 && filteredQuizzes.length > 0 && (
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
    </div>
  );
} 