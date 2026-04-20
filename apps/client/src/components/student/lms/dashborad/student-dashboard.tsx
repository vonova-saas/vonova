"use client";

import DashboardTabs from "./dashboard-tabs";
import { useAuthContext } from "@/context/app/auth/auth-context";

export default function StudentDashboard() {
  const { user } = useAuthContext();
  const displayName = user?.name?.split(" ")[0] || "Student";

  return (
    <div
      className="relative overflow-hidden flex flex-col gap-8 w-full mx-auto px-2 md:px-8 py-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
        backgroundSize: "18px 18px",
      }}
    >
      <div className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -right-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      <section className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md px-5 py-6 md:px-8 md:py-7 shadow-xl">
        <p className="text-sm text-primary/90 font-medium">Student</p>
        <p className="mt-1 text-sm text-muted-foreground">Monday, April 20</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
          Good morning, {displayName}
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Stay on track with courses, sharpen your quiz skills, and grow your
          learning streaks in one calm workspace.
        </p>
      </section>
      <DashboardTabs />
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