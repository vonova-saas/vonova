"use client";

import { Problem } from "./problems-data";

type ProblemDescriptionProps = {
  problem: Problem;
};

export default function ProblemDescription({ problem }: ProblemDescriptionProps) {
  return (
    <div className="flex flex-col h-full bg-background/90 rounded-md border overflow-hidden">
      {/* Tab header */}
      <div className="flex items-center h-11 px-4 bg-muted text-xs font-medium tracking-wide">
        <div className="px-4 py-2 rounded-t-md bg-background text-foreground">
          Description
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 text-sm">
        {/* Title & meta */}
        <div>
          <h1 className="text-lg md:text-xl font-semibold mb-2">
            {problem.title}
          </h1>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                problem.difficulty === "Easy"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : problem.difficulty === "Medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              }`}
            >
              {problem.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium border text-muted-foreground">
              {problem.category}
            </span>
          </div>
        </div>

        {/* Problem statement */}
        <div className="space-y-2 leading-relaxed">
          <p className="whitespace-pre-line text-sm text-foreground">
            {problem.problemStatement}
          </p>
        </div>

        {/* Examples */}
        <div>
          <h2 className="font-semibold mb-2 text-sm">Examples</h2>
          <div className="space-y-3 text-xs md:text-sm">
            {problem.examples.map((ex, index) => (
              <div key={ex.id} className="space-y-1">
                <p className="font-medium text-foreground">Example {index + 1}:</p>
                <div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-[11px] md:text-xs">
                  <div>
                    <span className="font-semibold">Input:</span> {ex.inputText}
                  </div>
                  <div>
                    <span className="font-semibold">Output:</span> {ex.outputText}
                  </div>
                  {ex.explanation && (
                    <div className="mt-1 text-[11px] md:text-xs text-muted-foreground">
                      <span className="font-semibold">Explanation:</span> {ex.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div className="pb-4">
          <h2 className="font-semibold mb-2 text-sm">Constraints</h2>
          <ul className="ml-4 list-disc text-xs md:text-sm text-muted-foreground whitespace-pre-line">
            {problem.constraints}
          </ul>
        </div>
      </div>
    </div>
  );
}
