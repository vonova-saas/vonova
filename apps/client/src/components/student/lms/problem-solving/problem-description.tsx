"use client";

import { Badge } from "@/components/ui/badge";
import type { ProblemEntity } from "@/types/api/student/lms/problem-solving/problem-solving.type";

type ProblemDescriptionProps = {
  problem: ProblemEntity;
};

export default function ProblemDescription({ problem }: ProblemDescriptionProps) {
  const categories = deriveCategories(problem.title, problem.description);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <div className="border-b border-border bg-background px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">Description</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">{problem.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="border-emerald-500/40 bg-emerald-600/20 text-emerald-700 dark:text-emerald-300">
              Medium
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant="outline"
                className="border-border text-muted-foreground"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <p className="whitespace-pre-line leading-7 text-muted-foreground">{problem.description}</p>

        <div className="mt-6 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Examples</h3>
          {problem.testCases?.map((testCase, index) => (
            <div
              key={`example-${index}`}
              className="rounded-md border border-border bg-muted/40 p-3"
            >
              <p className="text-xs font-semibold text-foreground">Example {index + 1}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                <span className="text-foreground">Input:</span>{" "}
                {JSON.stringify(testCase.input)}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                <span className="text-foreground">Expected:</span>{" "}
                {JSON.stringify(testCase.expected)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-base font-semibold text-foreground">Constraints</h3>
          <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {problem.constraints}
          </p>
        </div>
      </div>
    </div>
  );
}

function deriveCategories(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const tags: string[] = [];

  if (text.includes("array")) tags.push("Array");
  if (text.includes("string")) tags.push("String");
  if (text.includes("linked")) tags.push("Linked List");
  if (text.includes("tree")) tags.push("Tree");
  if (text.includes("graph")) tags.push("Graph");
  if (text.includes("stack")) tags.push("Stack");
  if (text.includes("queue")) tags.push("Queue");
  if (text.includes("dynamic")) tags.push("Dynamic Programming");
  if (text.includes("hash")) tags.push("Hash Table");
  if (text.includes("two")) tags.push("Two Pointers");

  if (tags.length === 0) tags.push("Algorithms");
  return tags.slice(0, 3);
}
