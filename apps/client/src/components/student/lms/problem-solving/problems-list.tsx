"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useUserId } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, RefreshCcw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useProblemsQuery } from "@/hooks/student/use-problem-solving";

export default function ProblemsList() {
  const userId = useUserId();
  const { data: problems = [], isLoading, refetch, isRefetching } = useProblemsQuery();

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");

  const difficulties = useMemo(
    () => [
      "all",
      ...Array.from(new Set(problems.map((p) => p.createdBy ? "community" : "official"))),
    ],
    [problems]
  );

  const totalCases = useMemo(
    () => problems.reduce((sum, p) => sum + (p.testCases?.length ?? 0), 0),
    [problems]
  );

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesDifficulty =
        difficulty === "all" ||
        (difficulty === "official" && !problem.createdBy) ||
        (difficulty === "community" && Boolean(problem.createdBy));
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        problem.title.toLowerCase().includes(q) ||
        problem.description.toLowerCase().includes(q);
      return matchesDifficulty && matchesSearch;
    });
  }, [difficulty, search, problems]);

  const handleRefresh = () => {
    setSearch("");
    setDifficulty("all");
    void refetch();
  };

  return (
    <div className="min-h-full w-full pb-16">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
          <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            Student hub
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">Problem Solving</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Practice classic coding interview questions and build confidence.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-primary/25 bg-background/60 backdrop-blur"
              onClick={handleRefresh}
              title="Refresh"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{problems.length}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Problems
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{difficulties.length - 1}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Difficulties
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{totalCases}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Test Cases
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
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
                  {d === "all" ? "All" : d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
        </div>
      </div>

      {/* Problems grid */}
      <div className="w-full max-w-3xl">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading problems...
          </div>
        ) : null}
        {!isLoading && isRefetching ? (
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Refreshing...
          </div>
        ) : null}
        {!isLoading && filteredProblems.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No problems found.</div>
        ) : null}
        {filteredProblems.length > 0 ? (
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
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      >
                        {problem.testCases?.length ?? 0} cases
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium border text-muted-foreground">
                        {problem.createdBy ? "Community" : "Official"}
                      </span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between">
                  <p className="mb-4 text-sm text-muted-foreground min-h-[40px] line-clamp-3">
                    {problem.description}
                  </p>
                  <Link
                    href={`/student/${userId}/problem-solving/${problem._id}`}
                    className="w-full mt-auto"
                  >
                    <Button className="w-full cursor-pointer">Solve Problem</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
