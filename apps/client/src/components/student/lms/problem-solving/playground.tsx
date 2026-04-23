"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Lightbulb, Loader2, WandSparkles, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState("// Write your solution here");
  const [hints, setHints] = useState<AIInteractionEntity[]>([]);
  const [solution, setSolution] = useState<AIInteractionEntity | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalMode, setAiModalMode] = useState<"hint" | "solution">("hint");
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "accepted" | "wrong_answer"
  >("idle");
  const [failedCase, setFailedCase] = useState<{
    input: string;
    output: string;
  } | null>(null);

  const submitMutation = useSubmitSolutionMutation();
  const hintMutation = useHintMutation();
  const solutionMutation = useSolutionMutation();

  const hintLimitReached = hints.length >= 3;
  const hintLevels = ["General", "Focused", "Advanced"];

  const parsedSolution = useMemo(() => {
    if (!solution?.response) return { code: "", explanation: "" };
    const response = solution.response;
    if (response.includes("```")) {
      const sections = response
        .split("```")
        .map((s) => s.trim())
        .filter(Boolean);
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
          (error as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Please try again.",
      });
    }
  };

  const handleGetHint = async () => {
    setAiModalMode("hint");
    setAiModalOpen(true);
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
          (error as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Unable to generate hint right now.",
      });
    }
  };

  const handleShowSolution = async () => {
    setAiModalMode("solution");
    setAiModalOpen(true);
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
          (error as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ??
          "You need at least one failed submission before requesting solution.",
      });
    }
  };

  return (
    <>
      <Card className="h-full overflow-hidden border-0 bg-[#1a1a1a] py-0 shadow-none">
        <CardHeader className="border-b border-zinc-800 bg-[#151515] py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-zinc-100">Code Workspace</CardTitle>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
              Monaco Editor
            </Badge>
          </div>
        </CardHeader>

        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#151515] px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-300">Language</span>
            <select
              aria-label="Programming language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-7 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-[11px] text-zinc-200"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>
          <div className="text-[11px] text-zinc-500">Auto</div>
        </div>

        <CardContent className="grid h-[calc(100%-110px)] grid-rows-[1fr_auto] overflow-hidden p-0">
          <div className="overflow-hidden bg-[#0f1117] ring-1 ring-inset ring-white/5">
            <MonacoEditor
              language={language}
              value={code}
              onChange={(value) => setCode(value ?? "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                automaticLayout: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          <div className="space-y-3 border-t border-zinc-800 bg-[#151515] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                size="sm"
                className="h-8 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-500"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleGetHint}
                disabled={hintMutation.isPending || hintLimitReached}
                className="h-8 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
              >
                {hintMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating hint...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Get Hint ({hints.length}/3)
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleShowSolution}
                disabled={solutionMutation.isPending}
                className="h-8 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
              >
                {solutionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating solution...
                  </>
                ) : (
                  <>
                    <WandSparkles className="mr-2 h-4 w-4" />
                    Show Solution
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-zinc-400">
              Result:{" "}
              <span
                className={`font-semibold ${
                  submissionStatus === "accepted"
                    ? "text-emerald-400"
                    : submissionStatus === "wrong_answer"
                    ? "text-rose-400"
                    : "text-zinc-200"
                }`}
              >
                {submissionStatus === "idle" ? "Not submitted" : submissionStatus}
              </span>
              {failedCase ? (
                <span className="ml-2 text-rose-300">
                  Failed case: {failedCase.input} {"->"} {failedCase.output}
                </span>
              ) : null}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent
          overlayClassName="bg-black/60 backdrop-blur-sm"
          className="max-h-[85vh] overflow-hidden border-zinc-700 bg-[#171717] p-0 sm:max-w-2xl"
        >
          <DialogHeader className="flex-row items-center justify-between border-b border-zinc-700 px-4 py-3">
            <DialogTitle className="text-sm text-zinc-100">
              {aiModalMode === "hint" ? "AI Hints" : "AI Solution"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              onClick={() => setAiModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="max-h-[72vh] space-y-3 overflow-y-auto px-4 py-4">
            {aiModalMode === "hint" ? (
              hints.length === 0 ? (
                <p className="text-xs text-zinc-500">No hints yet. Click "Get Hint".</p>
              ) : (
                hints.map((hint, index) => (
                  <div
                    key={hint._id ?? `${hint.createdAt}-${index}`}
                    className="ml-auto max-w-[95%] rounded-xl rounded-br-sm border border-zinc-700 bg-zinc-800 px-3 py-2"
                  >
                    <p className="mb-1 text-[11px] font-semibold text-zinc-100">
                      Hint {index + 1} ({hintLevels[index] ?? "Advanced"})
                    </p>
                    <p className="whitespace-pre-wrap text-xs leading-5 text-zinc-300">
                      {hint.response}
                    </p>
                  </div>
                ))
              )
            ) : !solution ? (
              <p className="text-xs text-zinc-500">
                Solution will appear here after clicking "Show Solution".
              </p>
            ) : (
              <div className="space-y-3">
                <pre className="max-h-64 overflow-auto rounded-md bg-black p-3 text-[11px] text-green-200">
                  {parsedSolution.code}
                </pre>
                <p className="whitespace-pre-wrap text-xs leading-5 text-zinc-400">
                  {parsedSolution.explanation}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
