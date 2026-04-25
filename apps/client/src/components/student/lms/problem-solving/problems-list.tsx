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
import { useProblemCompletion } from "@/hooks/student/use-problem-completion";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORY_OPTIONS = [
  { value: "arrays", label: "Arrays" },
  { value: "strings", label: "Strings" },
  { value: "hashmap", label: "Hashmap" },
  { value: "math", label: "Math" },
  { value: "dp", label: "DP" },
  { value: "recursion", label: "Recursion" },
  { value: "sorting", label: "Sorting" },
] as const;

export default function ProblemsList() {
  const userId = useUserId();
  const { isCompleted } = useProblemCompletion();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { data: problems = [], isLoading, refetch, isRefetching } = useProblemsQuery({
    difficulty: difficulty === "all" ? undefined : difficulty,
    category: selectedCategories[0] as
      | "arrays"
      | "strings"
      | "hashmap"
      | "math"
      | "dp"
      | "recursion"
      | "sorting"
      | undefined,
  });

  const totalCases = useMemo(
    () => problems.reduce((sum, p) => sum + (p.testCases?.length ?? 0), 0),
    [problems]
  );

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        problem.title.toLowerCase().includes(q) ||
        problem.description.toLowerCase().includes(q);
      const matchesCategories =
        selectedCategories.length === 0 ||
        selectedCategories.every((category) =>
          problem.categories.includes(
            category as
              | "arrays"
              | "strings"
              | "hashmap"
              | "math"
              | "dp"
              | "recursion"
              | "sorting",
          ),
        );
      return matchesSearch && matchesCategories;
    });
  }, [search, problems, selectedCategories]);

  const availableProblems = useMemo(
    () => filteredProblems.filter((problem) => !isCompleted(problem._id)),
    [filteredProblems, isCompleted],
  );
  const completedProblems = useMemo(
    () => filteredProblems.filter((problem) => isCompleted(problem._id)),
    [filteredProblems, isCompleted],
  );

  const handleRefresh = () => {
    setSearch("");
    setDifficulty("all");
    setSelectedCategories([]);
    void refetch();
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
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
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">3</div>
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
      {/* Search and Filter */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        </div>
        <div className="relative w-[93px]">
          <Select
            value={difficulty}
            onValueChange={(value) =>
              setDifficulty(value as "all" | "easy" | "medium" | "hard")
            }
          >
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[180px] justify-start">
              Categories
              {selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Filter by categories</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CATEGORY_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedCategories.includes(option.value)}
                onCheckedChange={() => toggleCategory(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold mb-4">Available Problems</h2>
              {availableProblems.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-muted-foreground">
                    You have no problems left to solve. See completed problems below.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
                  {availableProblems.map((problem, index) => (
                    <Card
                      key={problem._id ?? `${problem.title}-${index}`}
                      className="hover:shadow-lg transition-shadow flex flex-col justify-between h-full"
                    >
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center">
                          {problem.title}
                          <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold ml-2 align-middle">
                            {problem.testCases?.length ?? 0} Cases
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1 justify-between">
                        <p className="mb-2 text-muted-foreground min-h-[48px]">
                          {problem.description}
                        </p>
                        <div className="text-xs text-muted-foreground mb-2">
                          <span
                            className={
                              problem.difficulty === "easy"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : problem.difficulty === "medium"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {problem.difficulty}
                          </span>
                          {" • "}
                          {problem.categories.join(", ")}
                        </div>
                        <Link
                          href={`/student/${userId}/problem-solving/${problem._id}`}
                          className="w-full mt-4"
                        >
                          <Button className="w-full cursor-pointer">Solve Problem</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4">Completed Problems</h2>
              {completedProblems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
                  {completedProblems.map((problem, index) => (
                    <Card
                      key={problem._id ?? `${problem.title}-${index}`}
                      className="hover:shadow-lg transition-shadow flex flex-col justify-between h-full"
                    >
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center">
                          {problem.title}
                          <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold ml-2 align-middle">
                            {problem.testCases?.length ?? 0} Cases
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1 justify-between">
                        <p className="mb-2 text-muted-foreground min-h-[48px]">
                          {problem.description}
                        </p>
                        <div className="text-xs text-muted-foreground mb-2">
                          <span
                            className={
                              problem.difficulty === "easy"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : problem.difficulty === "medium"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {problem.difficulty}
                          </span>
                          {" • "}
                          {problem.categories.join(", ")}
                        </div>
                        <Link
                          href={`/student/${userId}/problem-solving/${problem._id}`}
                          className="w-full mt-4"
                        >
                          <Button className="w-full cursor-pointer" variant="outline">
                            Solve Again
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-6 text-muted-foreground">
                    No completed problems yet.
                  </CardContent>
                </Card>
              )}
            </section>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
