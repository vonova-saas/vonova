"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizType, Question } from "@/types/api/student/lms/quizzes/quiz.type";
import React, { useState, useEffect, useRef, useCallback } from "react";
import QuestionComponent from "./quiz-question";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import {
  getQuizByIdMutationFn,
  submitQuizMutationFn,
  getStudentQuizAttemptsMutationFn,
  normalizeQuizAttemptsResponse,
  getAttemptRecordId,
} from "@/services/student/lms/quizzes/quiz.api";
import { useUserId } from "@/hooks";

function getQuestions(quiz: QuizType): Question[] {
  return quiz.questions.length > 0 ? quiz.questions : [];
}

export default function QuizRunner({ quiz }: { quiz: QuizType }) {
  const userId = useUserId();
  const questions = getQuestions(quiz);
  const [started, setStarted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [lockedAttemptId, setLockedAttemptId] = useState<string | null>(quiz.attemptId ?? null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timer, setTimer] = useState(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const resolveAttemptIdForQuiz = useCallback((rawAttempts: unknown, targetQuizId: string): string | null => {
    const list = Array.isArray(rawAttempts) ? rawAttempts : [];
    const match = list.find((attempt) => {
      const quizRef = (attempt as { quiz?: unknown; quizId?: unknown }).quiz
        ?? (attempt as { quizId?: unknown }).quizId;
      const attemptQuizId =
        quizRef && typeof quizRef === "object"
          ? String((quizRef as { _id?: string })._id ?? "")
          : String(quizRef ?? "");
      return attemptQuizId === targetQuizId;
    });
    return match ? getAttemptRecordId(match) || null : null;
  }, []);

  const redirectToAttempt = useCallback(async (attemptId?: string | null) => {
    if (attemptId) {
      router.replace(`/student/${userId}/quizzes/attempts/${attemptId}`);
      return;
    }
    const attemptsRes = await getStudentQuizAttemptsMutationFn();
    const resolvedAttemptId = resolveAttemptIdForQuiz(
      normalizeQuizAttemptsResponse(attemptsRes),
      quiz._id,
    );
    if (resolvedAttemptId) {
      router.replace(`/student/${userId}/quizzes/attempts/${resolvedAttemptId}`);
      return;
    }
    router.replace(`/student/${userId}/quizzes`);
  }, [quiz._id, resolveAttemptIdForQuiz, router, userId]);

  useEffect(() => {
    let active = true;
    const checkAccess = async () => {
      try {
        setCheckingAccess(true);
        setAccessError(null);
        const res = await getQuizByIdMutationFn(quiz._id);
        const latestQuiz = ((res as { data?: QuizType }).data ?? res) as QuizType;
        if (!active) return;
        if (latestQuiz.alreadyAttempted) {
          const attemptId = latestQuiz.attemptId ?? null;
          setLockedAttemptId(attemptId);
          await redirectToAttempt(attemptId);
          return;
        }
      } catch (e: unknown) {
        if (!active) return;
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message?: string }).message)
            : "Failed to verify quiz access";
        setAccessError(message || "Failed to verify quiz access");
      } finally {
        if (active) setCheckingAccess(false);
      }
    };
    void checkAccess();
    return () => {
      active = false;
    };
  }, [quiz._id, redirectToAttempt]);


  const extractAttemptIdFromSubmitResult = (raw: unknown): string | null => {
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    const maybeWrapped = obj.data && typeof obj.data === "object"
      ? (obj.data as Record<string, unknown>)
      : obj;

    const attemptId =
      typeof maybeWrapped.attemptId === "string"
        ? maybeWrapped.attemptId
        : typeof maybeWrapped.id === "string"
          ? maybeWrapped.id
          : "";
    return attemptId || null;
  };

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
    if (timerRef.current) clearInterval(timerRef.current);
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 200); // short delay for feedback
    } else {
      // Last question answered: submit to backend
      setTimeout(() => submitQuiz(), 200);
    }
  };

  const submitQuiz = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })),
      };
      const res = await submitQuizMutationFn(quiz._id, payload);
      const submittedAttemptId = extractAttemptIdFromSubmitResult(res);
      await redirectToAttempt(submittedAttemptId);
      return;
    } catch (e: unknown) {
      const status =
        e && typeof e === "object" && "response" in e
          ? Number(((e as { response?: { status?: number } }).response?.status ?? 0))
          : 0;
      if (status === 409) {
        setSubmitError("You already attempted this quiz");
        await redirectToAttempt(lockedAttemptId);
        return;
      }
      let message = "Failed to submit quiz";
      if (e && typeof e === "object" && "message" in e) {
        message = String((e as { message?: string }).message) || message;
      }
      setSubmitError(message);
      setShowResult(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Verifying quiz access...
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-destructive">{accessError}</p>
        <Button onClick={() => router.replace(`/student/${userId}/quizzes`)}>Back to quizzes</Button>
      </div>
    );
  }

  if (!started) {
    const isLocked = Boolean(quiz.alreadyAttempted || lockedAttemptId);
    return (
      <Card className="w-full max-w-2xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{quiz.description}</p>
          {isLocked ? (
            <p className="text-destructive font-medium">You already completed this quiz.</p>
          ) : null}
          <Button
            className="w-full"
            disabled={isLocked}
            onClick={() => {
              if (isLocked) {
                void redirectToAttempt(lockedAttemptId);
                return;
              }
              setStarted(true);
            }}
          >
            {isLocked ? "Quiz Locked" : "Start Quiz"}
          </Button>
          {isLocked ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                void redirectToAttempt(lockedAttemptId);
              }}
            >
              View Attempt Result
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (showResult) {
    return (
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Submission Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">{submitError || "Failed to submit quiz"}</p>
          <div className="flex gap-3">
            <Button onClick={() => void submitQuiz()} disabled={submitting}>
              {submitting ? "Retrying..." : "Retry Submit"}
            </Button>
            <Button variant="outline" onClick={() => router.replace(`/student/${userId}/quizzes`)}>
              Back to Quizzes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] w-full"
      style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
        backgroundSize: "18px 18px"
      }}
      >
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
