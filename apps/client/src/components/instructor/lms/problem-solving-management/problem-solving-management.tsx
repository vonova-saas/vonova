"use client";

import { useState } from "react";
import { BookOpenCheck, FileText, LayoutList } from "lucide-react";
import { useInstructorProblemSheetsQuery } from "@/hooks/instructor/use-problem-solving-management";
import { SheetManagementDashboard } from "./sheet-management-dashboard";
import { StandaloneProblemsDashboard } from "./standalone-problems-dashboard";

type ActiveTab = "sheets" | "standalone";

export default function ProblemSolvingManagement({
  instructorId,
}: {
  instructorId: string;
}) {
  const { data: sheets = [], isLoading } = useInstructorProblemSheetsQuery();
  const [activeTab, setActiveTab] = useState<ActiveTab>("sheets");

  return (
    <div className="min-h-full w-full pb-16">
      {/* ── Hero ───────────────────────────────────────────── */}
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium">
            <BookOpenCheck className="h-3.5 w-3.5 text-primary" />
            Instructor hub
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Problem Solving Management
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Create and manage problem sheets for students, or create standalone
            problems that can be attached to lessons.
          </p>
        </div>
      </section>

      {/* ── Tab Switcher ───────────────────────────────────── */}
      <div className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl gap-1 px-4">
          <button
            id="tab-problem-sheets"
            onClick={() => setActiveTab("sheets")}
            className={[
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "sheets"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <LayoutList className="h-4 w-4" />
            Problem Sheets
          </button>
          <button
            id="tab-standalone-problems"
            onClick={() => setActiveTab("standalone")}
            className={[
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "standalone"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <FileText className="h-4 w-4" />
            Standalone Problems
          </button>
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 pt-10">
        {activeTab === "sheets" ? (
          isLoading ? (
            <div className="h-48 animate-pulse rounded-xl border bg-muted" />
          ) : (
            <SheetManagementDashboard sheets={sheets} instructorId={instructorId} />
          )
        ) : (
          <StandaloneProblemsDashboard />
        )}
      </div>
    </div>
  );
}
