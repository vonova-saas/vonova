"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, Check, X } from "lucide-react";
import { getQuizAttemptByIdMutationFn, getQuizByIdMutationFn } from "@/services/student/lms/quizzes/quiz.api";
import { useUserId } from "@/hooks";
import {
  type StudentQuizAttempt,
  type GradedAttemptAnswer,
  type Question,
  type QuizType,
} from "@/types/api/student/lms/quizzes/quiz.type";

function sanitizeAnswers(raw: unknown): GradedAttemptAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a) =>
      a &&
      typeof a === "object" &&
      typeof (a as { questionId?: unknown }).questionId === "string" &&
      !("__parentArray" in (a as object)),
  ) as GradedAttemptAnswer[];
}

function getQuizIdFromPayload(attempt: { quiz?: unknown }): string {
  const raw = attempt.quiz;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw && typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if ("_id" in obj && obj._id != null) return String(obj._id);
    const hex = (raw as { toHexString?: () => string }).toHexString;
    if (typeof hex === "function") {
      try {
        const id = hex.call(raw);
        if (id && /^[a-f0-9]{24}$/i.test(id)) return id;
      } catch {
        /* ignore */
      }
    }
  }
  return "";
}

/** HTTP body may be `{ data: quiz }` or `{ data: { data: quiz } }` depending on gateway. */
function unwrapQuizResponse(res: unknown): QuizType | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const d = r.data;
  if (d && typeof d === "object") {
    const inner = d as Record<string, unknown>;
    if (Array.isArray(inner.questions)) return d as QuizType;
    const nested = inner.data;
    if (nested && typeof nested === "object" && Array.isArray((nested as QuizType).questions)) {
      return nested as QuizType;
    }
  }
  if (Array.isArray((r as { questions?: unknown }).questions)) return res as QuizType;
  return null;
}

/** Fills text from quiz definitions when the attempt payload only has stable ids. */
function enrichAnswersWithQuizQuestions(
  answers: GradedAttemptAnswer[],
  questions: Question[],
): GradedAttemptAnswer[] {
  return answers.map((answer) => {
    const aid = String(answer.questionId).trim();
    const q = questions.find((x) => String(x.id).trim() === aid);
    if (!q) return answer;

    const selId =
      answer.selectedOptionId == null || answer.selectedOptionId === ""
        ? ""
        : String(answer.selectedOptionId).trim();
    const selectedOpt = selId
      ? q.options.find((o) => String(o.id).trim() === selId)
      : undefined;

    const qAny = q as Record<string, unknown>;
    const preResolvedCorrectText =
      (typeof q.correctOptionText === "string" && q.correctOptionText.trim()) ||
      (typeof qAny.correct_option_text === "string" && qAny.correct_option_text.trim()) ||
      "";
    const rawCorrectId =
      qAny.correctOptionId ?? qAny.correct_option_id;
    const cid =
      rawCorrectId !== undefined && rawCorrectId !== null && String(rawCorrectId).trim().length > 0
        ? String(rawCorrectId).trim()
        : "";
    let correctOpt = cid ? q.options.find((o) => String(o.id).trim() === cid) : undefined;

    const fromAnswerId = (answer as { correctOptionId?: unknown }).correctOptionId;
    if (!correctOpt && fromAnswerId != null && String(fromAnswerId).trim()) {
      const fid = String(fromAnswerId).trim();
      correctOpt = q.options.find((o) => String(o.id).trim() === fid);
    }

    const base: GradedAttemptAnswer = {
      ...answer,
      questionText: q.text,
      selectedOptionText:
        selectedOpt?.text ??
        (answer.selectedOptionId == null ? "No answer" : "—"),
    };

    if (answer.correct === true) {
      return base;
    }

    const correctText =
      preResolvedCorrectText
      || correctOpt?.text?.trim()
      || base.correctOptionText?.trim()
      || "";

    return {
      ...base,
      correctOptionId: cid || (fromAnswerId != null ? String(fromAnswerId).trim() : base.correctOptionId),
      correctOptionText: correctText || base.correctOptionText?.trim() || "",
    };
  });
}

export default function QuizAttemptDetailsPage() {
  const userId = useUserId();
  const { attemptId } = useParams() as { attemptId: string };
  const [attempt, setAttempt] = useState<StudentQuizAttempt | null>(null);
  const [quizTitle, setQuizTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadAttempt = async () => {
      try {
        setLoading(true);
        setError(null);
        setQuizTitle(null);
        const response = await getQuizAttemptByIdMutationFn(attemptId);
        const data = ((response as { data?: StudentQuizAttempt }).data ?? response) as StudentQuizAttempt;
        let next: StudentQuizAttempt = {
          ...data,
          answers: sanitizeAnswers(data.answers),
        };
        const quizId = getQuizIdFromPayload(next);
        if (quizId) {
          try {
            const quizRes = await getQuizByIdMutationFn(quizId);
            const quiz =
              unwrapQuizResponse(quizRes)
              ?? unwrapQuizResponse((quizRes as { data?: unknown }).data)
              ?? (((quizRes as { data?: QuizType }).data ?? quizRes) as QuizType);
            if (mounted && quiz?.questions?.length) {
              setQuizTitle(quiz.title ?? null);
              next = {
                ...next,
                answers: enrichAnswersWithQuizQuestions(next.answers, quiz.questions),
              };
            }
          } catch {
            /* keep attempt as returned by API */
          }
        }
        if (mounted) setAttempt(next);
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
    <div className="w-full max-w-5xl mx-auto py-10 px-4 md:px-8 space-y-8 text-base">
      <div className="rounded-2xl border p-6 md:p-8 bg-card shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Quiz Attempt Result</h1>
        {quizTitle ? (
          <p className="text-xl font-medium text-foreground mb-2">{quizTitle}</p>
        ) : null}
        <p className="text-muted-foreground text-lg mb-6">This quiz is locked after one submission.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border p-4 md:p-5 text-center sm:text-left">
            <div className="text-sm font-medium text-muted-foreground mb-1">Score</div>
            <div className="text-2xl font-semibold tabular-nums">{attempt.score}</div>
          </div>
          <div className="rounded-xl border p-4 md:p-5 text-center sm:text-left">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total</div>
            <div className="text-2xl font-semibold tabular-nums">{attempt.total}</div>
          </div>
          <div className="rounded-xl border p-4 md:p-5 text-center sm:text-left">
            <div className="text-sm font-medium text-muted-foreground mb-1">Percentage</div>
            <div className="text-2xl font-semibold tabular-nums">{attempt.percentage}%</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-4">
          Submitted: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "--"}
        </div>
      </div>
      <div className="rounded-2xl border p-6 md:p-8 bg-card shadow-sm">
        <h2 className="text-2xl font-semibold mb-6">Answer Review</h2>
        {attempt.answers?.length ? (
          <ul className="space-y-5">
            {attempt.answers.map((answer, index) => {
              const qText = answer.questionText?.trim() || `Question ${index + 1}`;
              const yourText = answer.selectedOptionText?.trim()
                || (answer.selectedOptionId ? answer.selectedOptionId : "No answer");
              const isCorrect = answer.correct === true;
              const correctText = answer.correctOptionText?.trim() ?? "";
              return (
                <li
                  key={`${answer.questionId}-${index}`}
                  className="rounded-2xl border border-border/80 bg-background/50 p-5 md:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted/60 text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Question</p>
                      <p className="text-lg leading-relaxed text-foreground">{qText}</p>
                    </div>
                    <span
                      className={
                        isCorrect
                          ? "inline-flex items-center gap-1 shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400"
                          : "inline-flex items-center gap-1 shrink-0 rounded-full bg-destructive/15 px-3 py-1 text-sm font-medium text-destructive"
                      }
                    >
                      {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                  <div className="pl-11 space-y-1">
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold text-muted-foreground">Your answer: </span>
                      <span className="text-foreground">{yourText}</span>
                    </p>
                  </div>
                  {!isCorrect ? (
                    <div className="pl-11 space-y-1 pt-1 border-t border-border/60">
                      <p className="text-base leading-relaxed">
                        <span className="font-semibold text-muted-foreground">Correct: </span>
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                          {correctText || "—"}
                        </span>
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground">No answers found for this attempt.</p>
        )}
      </div>
      <Link
        href={`/student/${userId}/quizzes`}
        className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition"
      >
        Back to Quizzes
      </Link>
    </div>
  );
}
