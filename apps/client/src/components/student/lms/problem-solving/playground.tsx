"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Lightbulb, Loader2, Sparkles, WandSparkles } from "lucide-react";
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
  useHintsHistoryQuery,
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

type HintLanguage = "english" | "arabic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DEFAULT_LANGUAGE = "typescript";

export default function Playground({ problem }: PlaygroundProps) {
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState("// Write your solution here");
  const [solution, setSolution] = useState<AIInteractionEntity | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalMode, setAiModalMode] = useState<"hint" | "solution">("hint");
  const [hintLanguage, setHintLanguage] = useState<HintLanguage>("english");
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
  const {
    data: hintsHistory,
    refetch: refetchHintsHistory,
    isFetching: isFetchingHintsHistory,
  } = useHintsHistoryQuery(problem._id);

  const hintsUsed = hintsHistory?.hintsUsed ?? 0;
  const solutionUsed = hintsHistory?.solutionUsed ?? false;
  const allHints = hintsHistory?.hints ?? [];
  const hintLimitReached = hintsUsed >= 3;
  const visibleHints = useMemo(() => allHints, [allHints]);
  const hintLevels = ["General", "Focused", "Advanced"];
  const hintLevelHelp: Record<string, string> = {
    General: "High-level direction without revealing the approach.",
    Focused: "More specific guidance toward the right strategy.",
    Advanced: "Near-final guidance to help you finish the solution.",
  };

  const parsedSolution = useMemo(() => {
    if (!solution?.response) return { code: "", explanation: "" };
    const response = solution.response;

    try {
      const parsed = JSON.parse(response) as {
        solution?: string;
        code?: string;
        explanation?: string;
        response?: string;
      };
      const code = parsed.solution ?? parsed.code ?? parsed.response ?? "";
      const explanation = parsed.explanation ?? "";
      if (code || explanation) {
        return { code, explanation };
      }
    } catch {
      // not JSON payload
    }

    if (response.includes("```")) {
      const sections = response
        .split("```")
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        code: sections[1] ?? sections[0] ?? response,
        explanation: sections.length > 2 ? sections.slice(2).join("\n\n") : "",
      };
    }

    return { code: response, explanation: "" };
  }, [solution]);

  const formatHintResponse = (raw: string) => {
    if (!raw) return "";
    try {
      const parsed = JSON.parse(raw) as { hint?: string; response?: string };
      if (typeof parsed.hint === "string" && parsed.hint.trim()) return parsed.hint;
      if (typeof parsed.response === "string" && parsed.response.trim()) return parsed.response;
    } catch {
      // Raw value is not JSON, so show as-is.
    }
    return raw;
  };

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
        languageHint: hintLanguage,
      });
      await refetchHintsHistory();
      toast.success(`Hint ${response.hintsUsed ?? hintsUsed + 1}/3 generated`);
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
      await refetchHintsHistory();
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

  const handleViewHints = () => {
    setAiModalMode("hint");
    setAiModalOpen(true);
    void refetchHintsHistory();
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
                    Get Hint ({hintsUsed}/3)
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleViewHints}
                disabled={allHints.length === 0}
                className="h-8 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                View Hints ({visibleHints.length})
              </Button>

              <Button
                variant="outline"
                onClick={handleShowSolution}
                disabled={solutionMutation.isPending || solutionUsed}
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
                    {solutionUsed ? "Solution Unlocked" : "Show Solution"}
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
          className="max-h-[90vh] overflow-hidden border-zinc-700 bg-[#171717] p-0 sm:max-w-3xl"
        >
          <DialogHeader className="flex-row items-center justify-between border-b border-zinc-700 px-4 py-3">
            <DialogTitle className="text-sm text-zinc-100">
              {aiModalMode === "hint" ? "AI Hints" : "AI Solution"}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[80vh] space-y-4 overflow-y-auto px-5 py-5">
            {aiModalMode === "hint" ? (
              <div className="space-y-4">
                {isFetchingHintsHistory ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Syncing hints...
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-700/80 bg-zinc-900/50 px-4 py-3">
                  <div>
                    <p className="text-xs text-zinc-400">Hint language</p>
                    <p className="text-sm text-zinc-200">
                      Choose your preferred language for upcoming hints.
                    </p>
                  </div>
                  <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 p-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={hintLanguage === "english" ? "default" : "ghost"}
                      onClick={() => setHintLanguage("english")}
                      className="h-7 px-3 text-xs"
                    >
                      English
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={hintLanguage === "arabic" ? "default" : "ghost"}
                      onClick={() => setHintLanguage("arabic")}
                      className="h-7 px-3 text-xs"
                    >
                      العربية
                    </Button>
                  </div>
                </div>
                {visibleHints.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-6 text-center">
                    <p className="text-sm text-zinc-300">No hints yet.</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Click <span className="font-medium text-zinc-400">Get Hint</span> to generate
                      Hint 1 (General) in{" "}
                      <span className="font-semibold text-zinc-300">
                        {hintLanguage === "english" ? "English" : "Arabic"}
                      </span>
                      .
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleHints.map((hint, index) => {
                      const level = hintLevels[(hint.level ?? index + 1) - 1] ?? "Advanced";
                      return (
                        <div
                          key={`${hint.createdAt}-${hint.level}-${index}`}
                          className="rounded-xl border border-zinc-700 bg-linear-to-b from-zinc-800 to-zinc-900 px-4 py-4"
                          dir={hint.language === "arabic" ? "rtl" : "ltr"}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Badge className="bg-indigo-600/20 text-indigo-200">
                              Hint {index + 1}
                            </Badge>
                            <span className="text-sm font-semibold text-zinc-100">{level}</span>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {hint.language}
                            </Badge>
                          </div>
                          <p className="mb-2 text-xs text-zinc-400">{hintLevelHelp[level]}</p>
                          <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                            {formatHintResponse(hint.response)}
                          </p>
                        </div>
                      );
                    })}

                    {!hintLimitReached ? (
                      <div className="rounded-xl border border-dashed border-zinc-600 bg-zinc-900/40 px-4 py-3">
                        <p className="text-sm font-medium text-zinc-200">
                          Upcoming hint{3 - hintsUsed > 1 ? "s" : ""}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Next level:{" "}
                          <span className="font-semibold text-zinc-200">
                            {hintLevels[hintsUsed] ?? "Advanced"}
                          </span>{" "}
                          ({Math.max(0, 3 - hintsUsed)} remaining)
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/10 px-4 py-3">
                        <p className="text-sm font-medium text-emerald-300">
                          Hint limit reached (3/3)
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-zinc-500">
                      New hints will be generated in{" "}
                      <span className="font-medium text-zinc-400">
                        {hintLanguage === "english" ? "English" : "Arabic"}
                      </span>
                      .
                    </p>
                  </div>
                )}
              </div>
            ) : !solution ? (
              <p className="text-xs text-zinc-500">
                Solution will appear here after clicking "Show Solution".
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/40 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-300" />
                    <p className="text-sm font-semibold text-zinc-100">AI Generated Solution</p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    Review the code first, then read the explanation to understand the approach.
                  </p>
                </div>

                <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-900/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Solution Code
                  </p>
                  <pre className="max-h-72 overflow-auto rounded-lg border border-zinc-700 bg-[#0c0f14] p-4 text-[12px] leading-6 text-emerald-200">
                    {parsedSolution.code}
                  </pre>
                </div>

                <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-900/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Explanation
                  </p>
                  <p className="whitespace-pre-wrap rounded-lg border border-zinc-700 bg-[#12141a] px-4 py-3 text-sm leading-7 text-zinc-200">
                    {parsedSolution.explanation || "No explanation returned by AI."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
