"use client";
import React from "react";
import { mockQuizzes } from "@/components/dashboard/student/quizzes/fakeQuizzes";
import QuizRunner from "@/components/dashboard/student/quizzes/quizRunner";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const quiz = mockQuizzes.find((q) => q.id === id);
  if (!quiz) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <BookOpen className="w-20 h-20 text-primary/20 mb-6" />
      <div className="text-2xl font-bold text-destructive mb-2">Quiz not found</div>
      <div className="text-muted-foreground text-base mb-4">The quiz you are looking for does not exist or has been removed.</div>
      <Link href="/dashboard/quizzes" className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition">Back to Quizzes</Link>
    </div>
  );
  return <QuizRunner quiz={quiz} />;
} 