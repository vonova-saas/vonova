import React from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

const mockProgress = [
  {
    label: "Course Progress",
    percent: 68,
    color: "from-[#F2996A] to-[#F0784A]",
    textColor: "text-[#F2996A]",
  },
  {
    label: "Quiz Success Rate",
    percent: 82,
    color: "from-[#16C47F] to-[#11A56C]",
    textColor: "text-[#16C47F]",
  },
  {
    label: "Books Read",
    percent: 40,
    color: "from-[#4A90E2] to-[#2F6DCE]",
    textColor: "text-[#4A90E2]",
  },
];

export default function ProgressSection() {
  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-border/50 bg-linear-to-b from-card/90 via-card/70 to-card/60 p-6 shadow-xl backdrop-blur-sm md:p-7">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Weekly snapshot
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Your Progress</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Keep pushing. Your consistency is improving week by week.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          +11% this week
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="grid gap-4">
        {mockProgress.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border/40 bg-background/30 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground/90">
                {item.label}
              </span>
              <span className={`text-sm font-semibold ${item.textColor}`}>
                {item.percent}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/80">
              <div
                className={`h-full rounded-full bg-linear-to-r ${item.color}`}
                style={{ width: `${item.percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {100 - item.percent}% left to your target
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
