"use client";

import { Badge } from "@/components/ui/badge";
import type { ProblemEntity } from "@/types/api/student/lms/problem-solving/problem-solving.type";

type ProblemDescriptionProps = {
  problem: ProblemEntity;
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
        <div>
          <h1 className="text-lg md:text-xl font-semibold mb-2">
            {problem.title}
          </h1>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary">{problem.testCases?.length ?? 0} test cases</Badge>
          </div>
        </div>

        <div className="space-y-2 leading-relaxed">
          <p className="whitespace-pre-line text-sm text-foreground">
            {problem.description}
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-2 text-sm">Test Cases</h2>
          <div className="space-y-3 text-xs md:text-sm">
            {problem.testCases?.map((testCase, index) => (
              <div key={`${testCase.input}-${index}`} className="space-y-1">
                <p className="font-medium text-foreground">Case {index + 1}:</p>
                <div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-[11px] md:text-xs">
                  <div>
                    <span className="font-semibold">Input:</span> {testCase.input}
                  </div>
                  <div>
                    <span className="font-semibold">Output:</span> {testCase.output}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
