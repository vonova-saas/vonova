"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserId } from "@/hooks";
import { deleteQuizMutationFn, getAllQuizzesMutationFn } from "@/services/student/lms/quizzes/quiz.api";
import { QuizType } from "@/types/api/student/lms/quizzes/quiz.type";
import { BookOpen, Component, Plus, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import InstructorQuizList from "./quiz-list";

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const userId = useUserId();
  const router = useRouter();

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllQuizzesMutationFn();
      setQuizzes(res.data || []);
    } catch (e: unknown) {
      let msg = "Failed to load quizzes";
      if (e && typeof e === "object" && "message" in e) msg = String((e as { message?: string }).message) || msg;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const filtered = useMemo(() => {
    return quizzes.filter(q =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.description.toLowerCase().includes(search.toLowerCase()) ||
      q.topic.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, quizzes]);

  const totalQuestions = useMemo(() => quizzes.reduce((sum, q) => sum + q.questions.length, 0), [quizzes]);
  const totalQuizzes = quizzes.length;

  const handleDelete = async (id: string) => {
    await deleteQuizMutationFn(id);
    await loadQuizzes();
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-start overflow-auto relative p-6"
      style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}
    >
      <div className="flex items-center gap-2 mb-4 w-full max-w-5xl">
        <h1 className="text-4xl font-bold leading-tight">Quiz Management</h1>
        <Component className="w-7 h-7 text-primary animate-pulse" />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => loadQuizzes()} title="Refresh" className="cursor-pointer">
            <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Link href={`/${userId}/quiz-managment/create`}>
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
        <div className="text-muted-foreground">Loading quizzes...</div>
      ) : error ? (
        <div className="text-destructive">{error}</div>
      ) : (
        <InstructorQuizList
          quizzes={filtered}
          onEdit={(q) => router.push(`/${userId}/quiz-managment/${q._id}/edit`)}
          onDelete={(id) => handleDelete(id)}
        />
      )}
    </div>
  );
}
