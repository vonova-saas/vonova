"use client";

import React, { useState } from "react";
import OverviewSection from "./overview-section";
import ProgressSection from "./progress-section";
import ActivityFeed from "./activity-feed";
import Achievements from "./achievements";

const TABS = [
  { label: "Overview", component: <OverviewSection /> },
  { label: "Progress Section", component: <ProgressSection /> },
  { label: "Activity Feed", component: <ActivityFeed /> },
  { label: "Achievements & Streaks", component: <Achievements /> },
];

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full flex flex-col items-center">
      <nav className="flex justify-center items-center w-full">
        <div className="flex gap-2 border-2 backdrop-blur-sm px-2 py-2 shadow-md rounded-[10px]">
          {TABS.map((tab, idx) => (
            <button
              key={tab.label}
              className={`px-6 py-2 rounded-[25px] font-medium transition-colors duration-200 focus:outline-none text-base relative
                ${activeTab === idx
                  ? "text-white after:absolute after:left-4 after:right-4 after:-bottom-1 after:h-0.5 after:bg-white after:rounded-full after:content-['']"
                  : "text-zinc-300 hover:text-white hover:after:absolute hover:after:left-4 hover:after:right-4 hover:after:-bottom-1 hover:after:h-0.5 hover:after:bg-white hover:after:rounded-full hover:after:content-['']"}
              `}
              onClick={() => setActiveTab(idx)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      <div className="w-full mt-8">{TABS[activeTab].component}</div>
    </div>
  );
}
