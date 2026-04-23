"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import QuizList from "./quiz-list";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAllQuizzesMutationFn,
  getStudentQuizAttemptsMutationFn,
  normalizeQuizAttemptsResponse,
} from "@/services/student/lms/quizzes/quiz.api";
import { QuizType } from "@/types/api/student/lms/quizzes/quiz.type";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from "@/components/ui/pagination";
import { BookOpen, Search, Filter, Component, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserId } from "@/hooks";

export default function Quiz() {
  const userId = useUserId();
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("All");
  const [page, setPage] = useState(1);
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 6;

  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllQuizzesMutationFn();
      const list = Array.isArray(res)
        ? res
        : (res as { data?: QuizType[] })?.data ?? [];
      let completedQuizIds = new Set<string>();
      if (userId) {
        try {
          const attemptsRes = await getStudentQuizAttemptsMutationFn();
          const rawAttempts = normalizeQuizAttemptsResponse(attemptsRes);
          completedQuizIds = new Set(
            rawAttempts
              .map((attempt) => {
                const quizRef = (attempt as { quiz?: unknown; quizId?: unknown }).quiz
                  ?? (attempt as { quizId?: unknown }).quizId;
                return quizRef && typeof quizRef === "object"
                  ? String((quizRef as { _id?: string })._id ?? "")
                  : String(quizRef ?? "");
              })
              .filter(Boolean),
          );
        } catch {
          // Quiz list from GET /quizzes still carries isCompleted from DB (QuizAnswer).
        }
      }
      const withStatus = list.map((quiz) => ({
        ...quiz,
        // Prefer LMS list payload (reads QuizAnswer in DB); attempts API is secondary for IDs/scores in cards.
        alreadyAttempted: Boolean(quiz.isCompleted || completedQuizIds.has(quiz._id)),
      }));
      setQuizzes(withStatus);
    } catch (e: unknown) {
      let msg = "Failed to load quizzes";
      if (e && typeof e === "object" && "message" in e) msg = String((e as { message?: string }).message) || msg;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadQuizzes();
  }, [loadQuizzes]);

  const topics = useMemo(() => [
    "All",
    ...Array.from(new Set(quizzes.map((q) => q.topic)))
  ], [quizzes]);

  // Calculate total questions
  const totalQuestions = useMemo(() => quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0), [quizzes]);
  const totalTopics = topics.length - 1; // Exclude 'All'

  // Filter quizzes by search and topic
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesTopic = topic === "All" || quiz.topic === topic;
      const matchesSearch =
        quiz.title.toLowerCase().includes(search.toLowerCase()) ||
        quiz.description.toLowerCase().includes(search.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [search, topic, quizzes]);

  const availableQuizzes = useMemo(
    () => filteredQuizzes.filter((quiz) => !quiz.alreadyAttempted),
    [filteredQuizzes],
  );
  const completedQuizzes = useMemo(
    () => filteredQuizzes.filter((quiz) => quiz.alreadyAttempted),
    [filteredQuizzes],
  );

  const totalPages = Math.ceil(availableQuizzes.length / pageSize);
  const paginatedQuizzes = availableQuizzes.slice((page - 1) * pageSize, page * pageSize);

  // Reset to first page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [search, topic]);

  return (
    <div className="min-h-full w-full pb-16">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium">
            <Component className="h-3.5 w-3.5 text-primary" />
            Student hub
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">Quizzes</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Practice topics, track attempts, and improve your results with every quiz.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => loadQuizzes()}
              title="Refresh"
              className="cursor-pointer rounded-full border-primary/25 bg-background/60 backdrop-blur"
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{quizzes.length}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Total Quizzes
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{totalTopics}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Topics
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{totalQuestions}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Questions
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">

      {/* Search and Filter */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Input
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        </div>
        <div className="relative w-[93px]">
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
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <BookOpen className="w-16 h-16 text-primary/20 mb-4" />
          <span className="text-lg font-semibold text-muted-foreground mb-2">Loading quizzes...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <BookOpen className="w-16 h-16 text-destructive/40 mb-4" />
          <span className="text-lg font-semibold text-destructive mb-2">{error}</span>
          <span className="text-sm text-muted-foreground">Please try again later.</span>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <BookOpen className="w-16 h-16 text-primary/20 mb-4" />
          <span className="text-lg font-semibold text-muted-foreground mb-2">No quizzes found</span>
          <span className="text-sm text-muted-foreground">Try adjusting your search or filter to find quizzes.</span>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold mb-4">Available Quizzes</h2>
            {availableQuizzes.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-muted-foreground">
                  You have no quizzes left to attempt. See completed quizzes below.
                </CardContent>
              </Card>
            ) : (
              <QuizList quizzes={paginatedQuizzes} mode="available" />
            )}
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-4">Completed Quizzes</h2>
            {completedQuizzes.length > 0 ? (
              <QuizList quizzes={completedQuizzes} mode="completed" />
            ) : (
              <Card>
                <CardContent className="py-6 text-muted-foreground">
                  No completed quizzes yet.
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      )}
      {totalPages > 1 && availableQuizzes.length > 0 && (
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
    </div>
  );
} 