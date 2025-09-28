import { QuizType, Question } from "@/types/api/student/lms/quizzes/quiz.type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";

// Add timedOut prop
interface QuizResultProps {
  quiz: QuizType;
  questions: Question[];
  answers: { [questionId: string]: string };
  timedOut: { [questionId: string]: boolean };
  onRestart: () => void;
  onBack: () => void;
}

export default function QuizResult({ questions, answers, timedOut, onRestart, onBack }: QuizResultProps) {
  const correctCount = questions.filter(
    (q) => answers[q.id] === q.correctOptionId
  ).length;

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Quiz Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-lg font-semibold">
          {`You scored ${correctCount} out of ${questions.length}`}
        </div>
        <ul className="mb-6 space-y-2">
          {questions.map((q) => (
            <li key={q.id} className="flex flex-col">
              <span className="font-medium">{q.text}</span>
              <span className={
                answers[q.id] === q.correctOptionId
                  ? "text-green-600"
                  : "text-red-600"
              }>
                Your answer: {q.options.find((o) => o.id === answers[q.id])?.text || "-"}
                {answers[q.id] === q.correctOptionId ? " (Correct)" : " (Incorrect)"}
              </span>
              {timedOut[q.id] && !answers[q.id] && (
                <span className="text-yellow-600 font-medium">Time ran out for this question.</span>
              )}
              {answers[q.id] !== q.correctOptionId && (
                <span className="text-muted-foreground">
                  Correct answer: {q.options.find((o) => o.id === q.correctOptionId)?.text}
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-4">
          <Button onClick={onRestart}>Restart Quiz</Button>
          <Button variant="outline" onClick={onBack}>Back to Quizzes</Button>
        </div>
      </CardContent>
    </Card>
  );
} 