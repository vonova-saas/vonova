"use client";

import React, { useState } from "react";
import { Award, BarChart3, Activity, Sparkles } from "lucide-react";
import OverviewSection from "./overview-section";
import ProgressSection from "./progress-section";
import ActivityFeed from "./activity-feed";
import Achievements from "./achievements";

const TABS = [
  { label: "Overview", icon: Sparkles, component: <OverviewSection /> },
  { label: "Progress", icon: BarChart3, component: <ProgressSection /> },
  { label: "Activity", icon: Activity, component: <ActivityFeed /> },
  { label: "Achievements", icon: Award, component: <Achievements /> },
];

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <nav className="flex justify-center items-center w-full overflow-x-auto pb-1">
        <div className="inline-flex gap-2 rounded-2xl border border-border/50 bg-card/60 p-2 shadow-lg backdrop-blur-md">
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            return (
            <button
              key={tab.label}
              className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl font-medium transition-all duration-200 focus:outline-none text-sm md:text-base border
                ${activeTab === idx
                  ? "text-primary-foreground border-primary/40 bg-primary shadow-md"
                  : "text-muted-foreground border-transparent bg-transparent hover:text-foreground hover:bg-accent/70"}
              `}
              onClick={() => setActiveTab(idx)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )})}
        </div>
      </nav>
      <div className="w-full">{TABS[activeTab].component}</div>
    </div>
  );
}
