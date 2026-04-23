"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getQuizAttemptByIdMutationFn } from "@/services/student/lms/quizzes/quiz.api";
import { useUserId } from "@/hooks";
import { StudentQuizAttempt } from "@/types/api/student/lms/quizzes/quiz.type";

export default function QuizAttemptDetailsPage() {
  const userId = useUserId();
  const { attemptId } = useParams() as { attemptId: string };
  const [attempt, setAttempt] = useState<StudentQuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadAttempt = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getQuizAttemptByIdMutationFn(attemptId);
        const data = ((response as { data?: StudentQuizAttempt }).data ?? response) as StudentQuizAttempt;
        if (mounted) setAttempt(data);
      } catch (e: unknown) {
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message?: string }).message)
            : "Failed to load attempt";
        if (mounted) setError(message || "Failed to load attempt");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadAttempt();
    return () => {
      mounted = false;
    };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <BookOpen className="w-20 h-20 text-primary/20 mb-6" />
        <div className="text-muted-foreground">Loading attempt...</div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <BookOpen className="w-20 h-20 text-primary/20 mb-6" />
        <div className="text-2xl font-bold text-destructive mb-2">Attempt not found</div>
        <div className="text-muted-foreground text-base mb-4">{error || "The attempt could not be loaded."}</div>
        <Link href={`/student/${userId}/quizzes`} className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition">
          Back to Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <div className="rounded-xl border p-6 bg-card">
        <h1 className="text-2xl font-bold mb-2">Quiz Attempt Result</h1>
        <p className="text-muted-foreground mb-4">This quiz is locked after one submission.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border p-3">Score: <span className="font-semibold">{attempt.score}</span></div>
          <div className="rounded-lg border p-3">Total: <span className="font-semibold">{attempt.total}</span></div>
          <div className="rounded-lg border p-3">Percentage: <span className="font-semibold">{attempt.percentage}%</span></div>
        </div>
        <div className="text-xs text-muted-foreground mt-3">
          Submitted: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "--"}
        </div>
      </div>
      <div className="rounded-xl border p-6 bg-card">
        <h2 className="text-lg font-semibold mb-3">Answer Review</h2>
        {attempt.answers?.length ? (
          <ul className="space-y-2">
            {attempt.answers.map((answer) => (
              <li key={answer.questionId} className="rounded-lg border p-3 text-sm">
                <div className="font-medium">Question: {answer.questionId}</div>
                <div>Selected option: {answer.selectedOptionId || "No answer"}</div>
                <div className={answer.correct ? "text-green-600" : "text-red-600"}>
                  {answer.correct ? "Correct" : "Incorrect"}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No answers found for this attempt.</p>
        )}
      </div>
      <Link href={`/student/${userId}/quizzes`} className="inline-flex items-center justify-center bg-primary text-white px-5 py-2 rounded-lg font-medium hover:bg-primary/90 transition">
        Back to Quizzes
      </Link>
    </div>
  );
}
