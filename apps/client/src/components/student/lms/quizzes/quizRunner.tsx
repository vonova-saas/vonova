"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizType, Question } from "@/types/api/student/lms/quizzes/quiz.type";
import React, { useState, useEffect, useRef } from "react";
import QuestionComponent from "./question";
import QuizResult from "./quizResult";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";

function getQuestions(quiz: QuizType): Question[] {
  return quiz.questions.length > 0 ? quiz.questions : [];
}

export default function QuizRunner({ quiz }: { quiz: QuizType}) {
  const questions = getQuestions(quiz);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [timedOut, setTimedOut] = useState<{ [questionId: string]: boolean }>({});
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Timer effect
  useEffect(() => {
    setTimer(10);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current]);

  useEffect(() => {
    if (timer === 0 && !answers[questions[current].id]) {
      setTimedOut((prev) => ({ ...prev, [questions[current].id]: true }));
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
      } else if (current === questions.length) {
        // On the last question, only show result after timer runs out here
        setShowResult(true);
      }
    }
  }, [timer, answers, current, questions]);

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setTimedOut((prev) => ({ ...prev, [questionId]: false }));
    if (timerRef.current) clearInterval(timerRef.current);
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 200); // short delay for feedback
    } else {
      setTimeout(() => setShowResult(true), 300);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setAnswers({});
    setTimedOut({});
    setShowResult(false);
    setTimer(10);
  };

  if (showResult) {
    return (
      <QuizResult
        quiz={quiz}
        questions={questions}
        answers={answers}
        timedOut={timedOut}
        onRestart={handleRestart}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] w-full">
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <CardTitle className="text-xl font-bold text-primary tracking-tight">
              {quiz.title}
            </CardTitle>
            <span className={`ml-auto text-lg font-bold ${timer <= 3 ? "text-destructive" : "text-primary"}`}>{timer}s</span>
          </div>
          <div className="flex items-center gap-2 w-full">
            <Progress
              value={((current + 1) / questions.length) * 100}
              className="flex-1 h-2 bg-muted"
            />
            <span className="text-sm text-muted-foreground font-medium min-w-[48px] text-right">
              {current + 1} / {questions.length}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <QuestionComponent
            question={questions[current]}
            onAnswer={handleAnswer}
            selectedOptionId={answers[questions[current].id]}
          />
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <span className="text-muted-foreground">
              {current + 1} / {questions.length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
