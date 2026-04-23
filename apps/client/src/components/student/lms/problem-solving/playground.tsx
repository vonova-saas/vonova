"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  problemSolvingKeys,
  useHintMutation,
  useSolutionMutation,
  useSubmitSolutionMutation,
} from "@/hooks/student/use-problem-solving";
import type {
  AIInteractionEntity,
  ProblemEntity,
} from "@/types/api/student/lms/problem-solving/problem-solving.type";

type PlaygroundProps = {
  problem: ProblemEntity;
};

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DEFAULT_LANGUAGE = "typescript";

export default function Playground({ problem }: PlaygroundProps) {
  const queryClient = useQueryClient();
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState("// Write your solution here");
  const [hints, setHints] = useState<AIInteractionEntity[]>([]);
  const [solution, setSolution] = useState<AIInteractionEntity | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "accepted" | "wrong_answer">("idle");
  const [failedCase, setFailedCase] = useState<{ input: string; output: string } | null>(null);

  const submitMutation = useSubmitSolutionMutation();
  const hintMutation = useHintMutation();
  const solutionMutation = useSolutionMutation();

  const hintLimitReached = hints.length >= 3;
  const activeCase = problem.testCases?.[activeTestCaseIndex];
  const highlightHint = submissionStatus === "wrong_answer";
  const hintLevels = ["General", "Detailed", "Strong"];

  const parsedSolution = useMemo(() => {
    if (!solution?.response) return { code: "", explanation: "" };
    const response = solution.response;
    if (response.includes("```")) {
      const sections = response.split("```").map((s) => s.trim()).filter(Boolean);
      return {
        code: sections[1] ?? sections[0] ?? response,
        explanation: sections.length > 2 ? sections.slice(2).join("\n\n") : response,
      };
    }
    return { code: response, explanation: response };
  }, [solution]);

  const handleSubmit = async () => {
    try {
      const response = await submitMutation.mutateAsync({
        problemId: problem._id,
        code,
        language,
      });
      setSubmissionStatus(response.status);
      setFailedCase(response.failedTestCase);

      await queryClient.invalidateQueries({
        queryKey: problemSolvingKeys.submissions(problem._id),
      });

      if (response.status === "accepted") {
        toast.success("Accepted");
      } else {
        toast.error("Wrong Answer", {
          description: "Review failed case and ask AI for hints.",
        });
      }
    } catch (error: unknown) {
      toast.error("Submission failed", {
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Please try again.",
      });
    }
  };

  const handleGetHint = async () => {
    try {
      const response = await hintMutation.mutateAsync({
        problemId: problem._id,
        code,
        languageHint: "english",
      });
      setHints((prev) => [...prev, response]);
      toast.success(`Hint ${response.level ?? hints.length + 1} generated`);
    } catch (error: unknown) {
      toast.error("Hint request failed", {
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Unable to generate hint right now.",
      });
    }
  };

  const handleShowSolution = async () => {
    try {
      const response = await solutionMutation.mutateAsync({
        problemId: problem._id,
        language,
      });
      setSolution(response);
      toast.success("AI solution ready");
    } catch (error: unknown) {
      toast.error("Solution request failed", {
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "You need at least one failed submission before requesting solution.",
      });
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl border bg-background/95 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Code</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-7 rounded-md border bg-background px-2 text-[11px]"
          >
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>
        </div>
        <div className="text-[11px] text-muted-foreground">Monaco Editor</div>
      </div>

      <div className="grid flex-1 grid-rows-[1fr_auto_auto] overflow-hidden">
        <div className="border-b overflow-hidden">
          <MonacoEditor
            language={language}
            value={code}
            onChange={(value) => setCode(value ?? "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        <div className="px-4 py-3 space-y-3 text-xs md:text-sm bg-muted/40 border-b">
          <div className="flex items-center justify-between">
            <div className="relative flex h-7 flex-col justify-center">
              <span className="text-xs font-medium text-foreground">Testcases</span>
              <span className="absolute bottom-0 h-0.5 w-14 rounded-full bg-foreground/80" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {problem.testCases?.map((testCase, index) => (
              <button
                key={`${testCase.input}-${index}`}
                onClick={() => setActiveTestCaseIndex(index)}
                className={`px-4 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  activeTestCaseIndex === index
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                Case {index + 1}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2 font-mono">
            <div>
              <p className="text-xs font-medium text-foreground">Input:</p>
              <div className="mt-1 rounded-md bg-background border px-3 py-2 text-[11px] md:text-xs text-foreground">
                {activeCase?.input}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Expected Output:</p>
              <div className="mt-1 rounded-md bg-background border px-3 py-2 text-[11px] md:text-xs text-foreground">
                {activeCase?.output}
              </div>
            </div>
            {failedCase ? (
              <div>
                <p className="text-xs font-medium text-rose-500">Failed Case:</p>
                <div className="mt-1 rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-[11px] md:text-xs text-rose-600 dark:text-rose-300">
                  input: {failedCase.input} | output: {failedCase.output}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-4 py-3 bg-background">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="cursor-pointer"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Solution"
              )}
            </Button>

            <Button
              variant={highlightHint ? "default" : "outline"}
              onClick={handleGetHint}
              disabled={hintMutation.isPending || hintLimitReached}
              className={highlightHint ? "ring-2 ring-amber-500/60 animate-pulse" : ""}
            >
              {hintMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating hint...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Hint ({hints.length}/3)
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              onClick={handleShowSolution}
              disabled={solutionMutation.isPending}
            >
              {solutionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating solution...
                </>
              ) : (
                "Show Solution"
              )}
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-foreground">
              {submissionStatus === "idle" ? "Not submitted" : submissionStatus}
            </span>
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">AI Hints</h3>
                {hints.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hints yet.</p>
                ) : (
                  <div className="space-y-3">
                    {hints.map((hint, index) => (
                      <div key={hint._id ?? `${hint.createdAt}-${index}`} className="rounded-lg border bg-muted/40 p-3">
                        <p className="mb-1 text-xs font-semibold">
                          Hint {index + 1} ({hintLevels[index] ?? "Strong"})
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground whitespace-pre-wrap">
                          {hint.response}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">AI Solution</h3>
                {!solution ? (
                  <p className="text-xs text-muted-foreground">
                    Submit at least one failing answer, then request solution.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <pre className="max-h-48 overflow-auto rounded-md bg-black p-3 text-[11px] text-green-200">
                      {parsedSolution.code}
                    </pre>
                    <p className="text-xs leading-5 text-muted-foreground whitespace-pre-wrap">
                      {parsedSolution.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
