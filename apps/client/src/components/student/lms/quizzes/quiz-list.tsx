"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAttemptsMutationFn } from "@/services/student/lms/quizzes/quiz.api";
import { QuizType } from "@/types/api/student/lms/quizzes/quiz.type";
import { useUserId } from "@/hooks";

type QuizListProps = {
  quizzes: QuizType[];
};

export default function QuizList({ quizzes }: QuizListProps) {
  const userId = useUserId();

  type Attempt = {
    id: string;
    quiz: string;
    userId: string;
    score: number;
    total: number;
    percentage: number;
    submittedAt?: string;
    createdAt?: string;
    updatedAt?: string;
  };

  const [attemptsByQuiz, setAttemptsByQuiz] = useState<Record<string, { score: number; total: number; percentage: number; submittedAt?: string } | null>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  // optional: capture errors per quiz if needed in the future

  useEffect(() => {
    let cancelled = false;
    const fetchAttempts = async () => {
      const ids = quizzes.map(q => q._id);
      const newLoading: Record<string, boolean> = {};
      ids.forEach(id => newLoading[id] = true);
      setLoadingMap(prev => ({ ...prev, ...newLoading }));

      await Promise.allSettled(ids.map(async (id) => {
        try {
          const res = await getAttemptsMutationFn(id);
          const data: unknown = (res as { data: unknown }).data;
          let attempts: Attempt[] = [];
          if (Array.isArray(data)) attempts = data as Attempt[];
          else if (data && typeof data === "object") attempts = [data as Attempt];
          // pick latest by submittedAt or createdAt
          const latest = attempts
            .map(a => ({
              score: a.score,
              total: a.total,
              percentage: a.percentage,
              submittedAt: a.submittedAt || a.updatedAt || a.createdAt,
            }))
            .sort((a, b) => {
              const ta = a.submittedAt ? Date.parse(a.submittedAt) : 0;
              const tb = b.submittedAt ? Date.parse(b.submittedAt) : 0;
              return tb - ta;
            })[0] || null;
          if (!cancelled) setAttemptsByQuiz(prev => ({ ...prev, [id]: latest }));
        } catch {
          if (!cancelled) setAttemptsByQuiz(prev => ({ ...prev, [id]: null }));
        } finally {
          if (!cancelled) setLoadingMap(prev => ({ ...prev, [id]: false }));
        }
      }));
    };
    if (quizzes.length) fetchAttempts();
    return () => { cancelled = true; };
  }, [quizzes]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
      {quizzes.length === 0 ? (
        <div className="col-span-2 text-center text-muted-foreground py-8">
          No quizzes found.
        </div>
      ) : (
        quizzes.map((quiz) => (
          <Card
            key={quiz._id}
            className="hover:shadow-lg transition-shadow flex flex-col justify-between h-full"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                {quiz.title}
                <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold ml-2 align-middle">
                  {quiz.noOfQuestions} Questions
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 justify-between">
              <p className="mb-2 text-muted-foreground min-h-[48px]">
                {quiz.description}
              </p>
              <div className="text-xs text-muted-foreground mb-2">
                {loadingMap[quiz._id] ? (
                  <span>Loading last attempt...</span>
                ) : attemptsByQuiz[quiz._id] ? (
                  <span>
                    Last attempt: {attemptsByQuiz[quiz._id]?.submittedAt ? new Date(attemptsByQuiz[quiz._id]!.submittedAt as string).toLocaleString() : "--"}
                    {" "}• Score: {attemptsByQuiz[quiz._id]?.score}/{attemptsByQuiz[quiz._id]?.total} ({attemptsByQuiz[quiz._id]?.percentage}%)
                  </span>
                ) : (
                  <span>No attempts yet.</span>
                )}
              </div>
              <Link
                href={`/${userId}/quizzes/${quiz._id}`}
                className="w-full mt-4"
              >
                <Button className="w-full cursor-pointer">Attempt Now</Button>
              </Link>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
