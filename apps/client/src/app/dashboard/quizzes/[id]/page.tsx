"use client";
import { mockQuizzes } from "@/components/dashboard/student/quizzes/fakeQuizzes";
import QuizRunner from "@/components/dashboard/student/quizzes/quizRunner";

export default function QuizDetailPage({ params }: { params: { id: string } }) {
  const quiz = mockQuizzes.find((q) => q.id === params.id);
  if (!quiz) return <div className="text-center py-12 text-destructive font-bold text-xl">Quiz not found</div>;
  return <QuizRunner quiz={quiz} />;
} 