"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizType, Question } from "./types";
import React, { useState } from "react";
import QuestionComponent from "./question";
import QuizResult from "./quizResult";
import { useRouter } from "next/navigation";

type QuizRunnerProps = {
  quiz: QuizType;
};

function getQuestions(quiz: QuizType): Question[] {
  return quiz.questions.length > 0 ? quiz.questions : [];
}

export default function QuizRunner({ quiz }: QuizRunnerProps) {
  const questions = getQuestions(quiz);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [showResult, setShowResult] = useState(false);
  const router = useRouter();

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setAnswers({});
    setShowResult(false);
  };

  if (showResult) {
    return (
      <QuizResult
        quiz={quiz}
        questions={questions}
        answers={answers}
        onRestart={handleRestart}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <Progress value={((current + 1) / questions.length) * 100} className="mt-2" />
      </CardHeader>
      <CardContent>
        <QuestionComponent
          question={questions[current]}
          onAnswer={handleAnswer}
          selectedOptionId={answers[questions[current].id]}
        />
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
          <span className="text-muted-foreground">{current + 1} / {questions.length}</span>
        </div>
      </CardContent>
    </Card>
  );
} 