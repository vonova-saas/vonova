"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Component, Plus, RefreshCcw } from "lucide-react";
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
      fetchInstructorQuizzes(userId);
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
      await deleteQuiz(id, userId);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-start overflow-auto relative p-6"
      style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}
    >
      <div className="flex items-center gap-2 mb-4 w-full max-w-5xl">
        <h1 className="text-4xl font-bold leading-tight">Quiz Management</h1>
        <Component className="w-7 h-7 text-primary animate-pulse" />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => userId && fetchInstructorQuizzes(userId)} title="Refresh" className="cursor-pointer">
            <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Link href={`/instructor/${userId}/quiz-managment/create`}>
            <Button className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> New Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary */}
      <Card className="w-full max-w-5xl mb-6 shadow-lg border-2 backdrop-blur-sm">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary rounded-full p-4 flex items-center justify-center shadow-sm">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-primary drop-shadow-sm">{totalQuizzes}</span>
                  <span className="text-base font-medium text-muted-foreground mb-1">Total Quizzes</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                    {totalQuestions} Questions
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center md:text-right flex flex-col justify-center">
              <span className="text-lg font-semibold text-primary">Create, edit, and manage your quizzes</span>
              <span className="text-muted-foreground text-sm mt-1">Keep your content up to date and engaging.</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
  );
}
