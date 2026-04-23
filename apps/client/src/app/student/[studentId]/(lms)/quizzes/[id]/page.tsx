"use client";
import React, { useEffect, useState } from "react";
import QuizRunner from "@/components/student/lms/quizzes/quiz-runner";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useUserId } from "@/hooks";
import { useParams, useRouter } from "next/navigation";
import { useQuizStore } from "@/lib/stores";
import type { QuizType } from "@/types/api/student/lms/quizzes/quiz.type";
import {
  getStudentQuizAttemptsMutationFn,
  normalizeQuizAttemptsResponse,
  getAttemptRecordId,
} from "@/services/student/lms/quizzes/quiz.api";

export default function QuizDetailPage() {
  const userId = useUserId();
  const { id } = useParams() as { id: string };
  const router = useRouter();
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
        if (!mounted) return;

        if (q?.alreadyAttempted) {
          if (q.attemptId) {
            router.replace(`/student/${userId}/quizzes/attempts/${q.attemptId}`);
            return;
          }
          const attemptsRes = await getStudentQuizAttemptsMutationFn();
          const attempts = normalizeQuizAttemptsResponse(attemptsRes);
          const matchingAttempt = attempts.find((attempt) => {
            const quizRef = (attempt as { quiz?: unknown; quizId?: unknown }).quiz
              ?? (attempt as { quizId?: unknown }).quizId;
            const attemptQuizId =
              quizRef && typeof quizRef === "object"
                ? String((quizRef as { _id?: string })._id ?? "")
                : String(quizRef ?? "");
            return attemptQuizId === id;
          });
          const attemptRecordId = matchingAttempt ? getAttemptRecordId(matchingAttempt) : "";
          if (attemptRecordId) {
            router.replace(`/student/${userId}/quizzes/attempts/${attemptRecordId}`);
            return;
          }
        }

        setQuiz(q ?? null);
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
  }, [id, fetchById, router, userId]);

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
        <Link href={`/student/${userId}/quizzes`} className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition">Back to Quizzes</Link>
      </div>
    );
  }

  return <QuizRunner quiz={quiz} />;
}