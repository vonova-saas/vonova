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
  submitting?: boolean;
  submitError?: string | null;
  result?: {
    attemptId: string;
    quizId: string;
    score: number;
    total: number;
    percentage: number;
    answers: { questionId: string; selectedOptionId: string; correct: boolean }[];
  };
  attempts?: Array<{
    id: string;
    quiz: string;
    userId: string;
    score: number;
    total: number;
    percentage: number;
    submittedAt?: string;
  }>;
  loadingAttempts?: boolean;
  attemptsError?: string | null;
  onLoadAttempts?: () => void;
  onRestart: () => void;
  onBack: () => void;
}

export default function QuizResult({ quiz, questions, answers, timedOut, submitting, submitError, result, attempts = [], loadingAttempts, attemptsError, onLoadAttempts, onRestart, onBack }: QuizResultProps) {
  const gradedByQuestionId = new Map(
    (result?.answers ?? []).map((a) => [a.questionId, a]),
  );

  const isQuestionCorrect = (q: Question) => {
    const graded = gradedByQuestionId.get(q.id);
    if (graded) return graded.correct;
    if (!q.correctOptionId) return false;
    return answers[q.id] === q.correctOptionId;
  };

  const getCorrectAnswerText = (q: Question) => {
    if (q.correctOptionId) {
      const byId = q.options.find((o) => o.id === q.correctOptionId)?.text;
      if (byId) return byId;
    }

    const directAnswer = (q as unknown as { correctAnswer?: string }).correctAnswer;
    if (typeof directAnswer === "string" && directAnswer.trim()) return directAnswer;

    const byFlag = q.options.find((o) => {
      const meta = o as unknown as { isCorrect?: boolean; correct?: boolean; isAnswer?: boolean };
      return !!(meta.isCorrect || meta.correct || meta.isAnswer);
    })?.text;
    if (byFlag) return byFlag;

    const graded = gradedByQuestionId.get(q.id);
    if (graded?.correct) {
      return q.options.find((o) => o.id === graded.selectedOptionId)?.text ?? null;
    }

    return null;
  };

  const localCorrectCount = questions.filter((q) => isQuestionCorrect(q)).length;
  const score = result ? result.score : localCorrectCount;
  const total = result ? result.total : questions.length;
  const percentage = result ? result.percentage : Math.round((score / total) * 100);

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Quiz Results — {quiz.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-lg font-semibold">
          {`You scored ${score} out of ${total}`} <span className="text-muted-foreground">({percentage}%)</span>
        </div>
        {submitting && (
          <div className="text-sm text-muted-foreground mb-2">Submitting your answers...</div>
        )}
        {submitError && (
          <div className="text-sm text-destructive mb-2">{submitError}</div>
        )}
        <ul className="mb-6 space-y-2">
          {questions.map((q) => (
            <li key={q.id} className="flex flex-col">
              {(() => {
                const correct = isQuestionCorrect(q);
                const correctAnswerText = getCorrectAnswerText(q);
                return (
                  <>
              <span className="font-medium">{q.text}</span>
              <span className={
                correct
                  ? "text-green-600"
                  : "text-red-600"
              }>
                Your answer: {q.options.find((o) => o.id === answers[q.id])?.text || "-"}
                {correct ? " (Correct)" : " (Incorrect)"}
              </span>
              {timedOut[q.id] && !answers[q.id] && (
                <span className="text-yellow-600 font-medium">Time ran out for this question.</span>
              )}
              {!correct && (
                <span className="text-muted-foreground">
                  Correct answer: {correctAnswerText ?? "Not provided by API"}
                </span>
              )}
                  </>
                );
              })()}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Button onClick={onRestart}>Restart Quiz</Button>
            <Button variant="outline" onClick={onBack}>Back to Quizzes</Button>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">My Attempts</span>
              {onLoadAttempts && (
                <Button size="sm" variant="outline" onClick={onLoadAttempts} disabled={!!loadingAttempts}>
                  {loadingAttempts ? "Loading..." : "Load attempts"}
                </Button>
              )}
            </div>
            {attemptsError && <div className="text-sm text-destructive mb-2">{attemptsError}</div>}
            {attempts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No attempts yet.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {attempts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between border rounded px-3 py-2">
                    <span>Score: {a.score}/{a.total} ({a.percentage}%)</span>
                    <span className="text-muted-foreground">{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "--"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}