"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useUserId } from "@/hooks";
import { PROBLEMS } from "./problems-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, Filter, RefreshCcw, BrainCog } from "lucide-react";

export default function ProblemsList() {
  const userId = useUserId();

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");

  const difficulties = useMemo(
    () => [
      "All",
      ...Array.from(new Set(PROBLEMS.map((p) => p.difficulty))),
    ],
    []
  );

  const totalExamples = useMemo(
    () => PROBLEMS.reduce((sum, p) => sum + p.examples.length, 0),
    []
  );

  const filteredProblems = useMemo(() => {
    return PROBLEMS.filter((problem) => {
      const matchesDifficulty =
        difficulty === "All" || problem.difficulty === difficulty;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        problem.title.toLowerCase().includes(q) ||
        problem.category.toLowerCase().includes(q) ||
        problem.problemStatement.toLowerCase().includes(q);
      return matchesDifficulty && matchesSearch;
    });
  }, [difficulty, search]);

  const handleRefresh = () => {
    setSearch("");
    setDifficulty("All");
  };

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-start overflow-auto relative p-6"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
        backgroundSize: "18px 18px",
      }}
    >
      {/* Header with title and refresh button */}
      <div className="flex items-center mb-4 w-full max-w-3xl">
        <div className="flex items-center gap-2">
          <h1 className="text-4xl font-bold leading-tight">Problem Solving</h1>
          <BrainCog className="w-7 h-7 text-primary animate-pulse" />
        </div>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            title="Refresh"
            className="cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary card */}
      <Card className="w-full max-w-3xl mb-6 shadow-lg border-2 backdrop-blur-sm">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary rounded-full p-4 flex items-center justify-center shadow-sm">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-primary drop-shadow-sm">
                    {PROBLEMS.length}
                  </span>
                  <span className="text-base font-medium text-muted-foreground mb-1">
                    Total Problems
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                    {difficulties.length - 1} Difficulties
                  </span>
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                    {totalExamples} Examples
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center md:text-right flex flex-col justify-center">
              <span className="text-lg font-semibold text-primary">
                Ready to train on real problems?
              </span>
              <span className="text-muted-foreground text-sm mt-1">
                Practice classic coding interview questions and build confidence.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and filter */}
      <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        </div>
        <div className="relative w-[120px]">
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
        </div>
      </div>

      {/* Problems grid */}
      <div className="w-full max-w-3xl">
        {filteredProblems.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No problems found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProblems.map((problem) => (
              <Card
                key={problem.id}
                className="hover:shadow-lg transition-shadow flex flex-col justify-between h-full"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold flex flex-col gap-1">
                    <span>{problem.title}</span>
                    <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
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
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between">
                  <p className="mb-4 text-sm text-muted-foreground min-h-[40px] line-clamp-3">
                    {problem.problemStatement}
                  </p>
                  <Link
                    href={`/student/${userId}/problem-solving/${problem.id}`}
                    className="w-full mt-auto"
                  >
                    <Button className="w-full cursor-pointer">Solve Problem</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
