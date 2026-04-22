"use client";

import DashboardTabs from "./dashboard-tabs";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuthContext();
  const displayName = user?.name?.split(" ")[0] || "Student";

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
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Learn together. Share what you build.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Stay on track, {displayName}. Keep momentum across courses, quizzes, and progress.
          </p>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">Courses</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Learning
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">Quizzes</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Practice
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">Progress</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Growth
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <DashboardTabs />
      </div>
    </div>
  );
}

/**
import OverviewCards from "./dashborad/overview-cards";
import ProgressSection from "./dashborad/progress-section";
import ActivityFeed from "./dashborad/activity-feed";
import QuickLinks from "./dashborad/quick-links";
import Achievements from "./dashborad/achievements";

export default function StudentDashboard() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 md:px-8 py-8">
      <OverviewCards />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          <ProgressSection />
          <ActivityFeed />
        </div>
        <div className="flex flex-col gap-6">
          <QuickLinks />
          <Achievements />
        </div>
      </div>
    </div>
  );
}
*/