"use client";
import React, { useEffect, useState } from "react";
import QuizRunner from "@/components/student/lms/quizzes/quiz-runner";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useUserId } from "@/hooks";
import { useParams } from "next/navigation";
import { useQuizStore } from "@/lib/stores";
import type { QuizType } from "@/types/api/student/lms/quizzes/quiz.type";

export default function QuizDetailPage() {
  const userId = useUserId();
  const { id } = useParams() as { id: string };
  const { fetchById } = useQuizStore();

  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const q = await fetchById(id);
        if (mounted) setQuiz(q ?? null);
      } catch (e: unknown) {
        let message = "Failed to load quiz";
        if (e && typeof e === "object" && "message" in e) {
          message = String((e as { message?: string }).message) || message;
        }
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, fetchById]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <BookOpen className="w-20 h-20 text-primary/20 mb-6" />
        <div className="text-muted-foreground">Loading quiz...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <BookOpen className="w-20 h-20 text-primary/20 mb-6" />
        <div className="text-2xl font-bold text-destructive mb-2">Quiz not found</div>
        <div className="text-muted-foreground text-base mb-4">{error || "The quiz you are looking for does not exist or has been removed."}</div>
        <Link href={`/${userId}/quizzes`} className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition">Back to Quizzes</Link>
      </div>
    );
  }

  return <QuizRunner quiz={quiz} />;
}