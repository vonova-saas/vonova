"use client";

import { useState } from "react";
import { Problem } from "./problems-data";

type PlaygroundProps = {
  problem: Problem;
};

export default function Playground({ problem }: PlaygroundProps) {
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [code, setCode] = useState(problem.starterCode);
  const [output, setOutput] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

  const handleRun = () => {
    setStatus("running");
    // Fake run: always succeed for now
    setTimeout(() => {
      setStatus("success");
      setOutput("All sample tests passed (demo mode). Real execution can be wired later.");
    }, 400);
  };

  const handleSubmit = () => {
    setStatus("success");
    setOutput("Submission recorded (demo). In the future this can call an API.");
  };

  const activeExample = problem.examples[activeTestCaseIndex];

  return (
    <div className="flex flex-col h-full bg-background/90 rounded-md border overflow-hidden">
      {/* Editor header / preferences bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Code</span>
          <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] text-muted-foreground border">
            TypeScript
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Starter code is provided. You can edit it freely.
        </div>
      </div>

      {/* Editor + testcases split */}
      <div className="flex-1 flex flex-col md:flex-col">
        {/* Editor */}
        <div className="flex-1 border-b md:border-b md:border-b-muted/60 overflow-hidden">
          <textarea
            className="w-full h-full min-h-[200px] font-mono text-xs md:text-sm rounded-none border-0 bg-background px-3 py-3 focus:outline-none focus:ring-0 resize-none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Testcases panel */}
        <div className="flex-none px-4 py-3 space-y-3 text-xs md:text-sm bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="relative flex h-8 flex-col justify-center">
              <span className="text-xs font-medium text-foreground">Testcases</span>
              <span className="absolute bottom-0 h-0.5 w-14 rounded-full bg-foreground/80" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {problem.examples.map((ex, index) => (
              <button
                key={ex.id}
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
                {activeExample?.inputText}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Expected Output:</p>
              <div className="mt-1 rounded-md bg-background border px-3 py-2 text-[11px] md:text-xs text-foreground">
                {activeExample?.outputText}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-background/95 text-xs md:text-sm">
        <div className="text-[11px] text-muted-foreground">
          {status === "idle" && "Ready to run your code."}
          {status === "running" && "Running tests..."}
          {status === "success" && output}
          {status === "error" && "One or more tests failed (demo)."}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            className="px-3 py-1.5 rounded-md border bg-muted hover:bg-muted/80 text-xs font-medium cursor-pointer"
          >
            Run
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium cursor-pointer"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
