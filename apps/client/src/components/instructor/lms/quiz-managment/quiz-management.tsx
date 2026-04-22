"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Component, Plus, RefreshCcw } from "lucide-react";
import { QuizType } from "@/types/api/student/lms/quizzes/quiz.type";
import { useQuizStore } from "@/lib/stores";
import InstructorQuizList from "./quiz-list";
import Link from "next/link";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { useRouter } from "next/navigation";

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const { quizzesById, allIds, loading, error, fetchInstructorQuizzes, deleteQuiz } = useQuizStore();
  const [search, setSearch] = useState("");
  const { user } = useAuthContext();
  const userId = user?._id;
  const router = useRouter();

  useEffect(() => {
    if (userId) {
      fetchInstructorQuizzes();
    }
  }, [userId, fetchInstructorQuizzes]);

  useEffect(() => {
    // project map to array for filtering
    const list = allIds.map((id) => quizzesById[id]).filter(Boolean) as QuizType[];
    setQuizzes(list);
  }, [allIds, quizzesById]);

  const filtered = useMemo(() => {
    const result = quizzes.filter(q =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.description.toLowerCase().includes(search.toLowerCase()) ||
      q.topic.toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [search, quizzes]);

  const totalQuestions = useMemo(() => quizzes.reduce((sum, q) => sum + q.questions.length, 0), [quizzes]);
  const totalQuizzes = quizzes.length;

  const handleDelete = async (id: string) => {
    if (userId) {
      await deleteQuiz(id);
    }
  };

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
            Instructor hub
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">Quiz Management</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Create, edit, and manage your quizzes in one clear workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => userId && fetchInstructorQuizzes()}
              title="Refresh"
              className="cursor-pointer rounded-full border-primary/25 bg-background/60 backdrop-blur"
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Link href={`/instructor/${userId}/quiz-managment/create`}>
              <Button className="cursor-pointer rounded-full px-8">
                <Plus className="w-4 h-4 mr-2" /> New Quiz
              </Button>
            </Link>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{totalQuizzes}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Total Quizzes
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{totalQuestions}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Questions
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">Ready</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Workspace
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
      {/* Search */}
      <div className="w-full max-w-5xl flex gap-4 mb-6">
        <Input placeholder="Search quizzes..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded border bg-muted animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-destructive">{error}</div>
      ) : (
        <InstructorQuizList
          quizzes={filtered}
          onEdit={(q) => router.push(`/instructor/${userId}/quiz-managment/${q._id}/edit`)}
          onDelete={(id) => handleDelete(id)}
        />
      )}
      </div>
    </div>
  );
}
